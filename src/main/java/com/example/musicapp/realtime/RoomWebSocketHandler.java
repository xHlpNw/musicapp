package com.example.musicapp.realtime;

import com.example.musicapp.dto.room.RoomChatMessageResponse;
import com.example.musicapp.dto.room.RoomResponse;
import com.example.musicapp.entity.Room;
import com.example.musicapp.entity.User;
import com.example.musicapp.repository.RoomMemberRepository;
import com.example.musicapp.repository.RoomRepository;
import com.example.musicapp.repository.UserRepository;
import com.example.musicapp.security.JwtUtil;
import com.example.musicapp.service.RoomService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket-обработчик для комнат совместного прослушивания.
 * Подключение: /ws/rooms/{roomId}?token=JWT.
 *
 * <p>Протокол (все сообщения — JSON):
 * <ul>
 *   <li>Server → Client: {@code {type:"stateSnapshot", revision:N, payload:{RoomResponse}}}
 *   <li>Server → Client: {@code {type:"position", positionSeconds, playing, currentTrackId, currentQueueItemId, serverTimeMs}}
 *   <li>Server → Client: {@code {type:"chat", message:{RoomChatMessageResponse}}}
 *   <li>Server → Client: {@code {type:"roomClosed", roomId:N}}
 *   <li>Server → Host:   {@code {type:"getPositionRequest", requestId:S}}
 *   <li>Host → Server:   {@code {type:"positionResponse", requestId:S, positionSeconds, playing, ...}}
 *   <li>Host → Server:   {@code {type:"positionTick", positionSeconds, playing, currentTrackId, currentQueueItemId}}
 *   <li>Client → Server: {@code {type:"getPosition", requestId:S}}
 * </ul>
 */
@Component
public class RoomWebSocketHandler extends TextWebSocketHandler {

    private static final String QUERY_PARAM_TOKEN = "token";
    private static final String TYPE_ROOM_CLOSED = "roomClosed";

    /** Минимальный интервал между getPosition-запросами от одной сессии (мс). */
    private static final long GET_POSITION_RATE_LIMIT_MS = 2_000;
    /** TTL для ожидающих ответа хоста positionRequest (мс). */
    private static final long PENDING_REQUEST_TTL_MS = 15_000;
    /** Интервал checkpoint-сохранения позиции в БД из positionTick (мс). */
    private static final long POSITION_CHECKPOINT_INTERVAL_MS = 20_000;

    private final ObjectMapper objectMapper;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final RoomService roomService;

    /** Активные сессии по roomId. */
    private final Map<Long, Set<WebSocketSession>> roomSessions = new ConcurrentHashMap<>();

    /** requestId → сессия, ожидающая ответа на getPosition. */
    private final Map<String, WebSocketSession> pendingPositionRequests = new ConcurrentHashMap<>();
    /** requestId → время создания запроса (для TTL-очистки). */
    private final Map<String, Long> pendingRequestTimestamps = new ConcurrentHashMap<>();

    /** sessionId → timestamp последнего getPosition (rate-limit). */
    private final Map<String, Long> lastGetPositionTime = new ConcurrentHashMap<>();

    /** roomId → timestamp последнего checkpoint-сохранения позиции. */
    private final Map<Long, Long> lastCheckpointMs = new ConcurrentHashMap<>();

    public RoomWebSocketHandler(ObjectMapper objectMapper, JwtUtil jwtUtil,
                                UserRepository userRepository, RoomRepository roomRepository,
                                RoomMemberRepository roomMemberRepository,
                                @Lazy RoomService roomService) {
        this.objectMapper = objectMapper;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.roomRepository = roomRepository;
        this.roomMemberRepository = roomMemberRepository;
        this.roomService = roomService;
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        Long roomId = extractRoomId(session.getUri());
        if (roomId == null) {
            closeSilently(session, CloseStatus.BAD_DATA);
            return;
        }
        String token = extractToken(session.getUri());
        if (token == null || token.isBlank()) {
            closeSilently(session, CloseStatus.POLICY_VIOLATION);
            return;
        }
        if (!jwtUtil.validateToken(token)) {
            closeSilently(session, CloseStatus.POLICY_VIOLATION);
            return;
        }
        String username;
        try {
            username = jwtUtil.getUsernameFromToken(token);
        } catch (Exception e) {
            closeSilently(session, CloseStatus.POLICY_VIOLATION);
            return;
        }
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            closeSilently(session, CloseStatus.POLICY_VIOLATION);
            return;
        }
        Optional<Room> roomOpt = roomRepository.findById(roomId);
        if (roomOpt.isEmpty()) {
            closeSilently(session, CloseStatus.POLICY_VIOLATION);
            return;
        }
        Room room = roomOpt.get();
        boolean isHost = room.getHost().getId().equals(user.getId());
        boolean isMember = roomMemberRepository.existsByRoomAndUser(room, user);
        if (!isHost && !isMember) {
            closeSilently(session, CloseStatus.POLICY_VIOLATION);
            return;
        }
        roomSessions.computeIfAbsent(roomId, id -> ConcurrentHashMap.newKeySet()).add(session);
        session.getAttributes().put("roomId", roomId);
        session.getAttributes().put("userId", user.getId());
        sendInitialState(session, roomId, user);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        lastGetPositionTime.remove(session.getId());
        pendingPositionRequests.entrySet().removeIf(e -> e.getValue() == session);
        pendingRequestTimestamps.keySet().removeIf(k -> !pendingPositionRequests.containsKey(k));

        Object roomIdAttr = session.getAttributes().get("roomId");
        Object userIdAttr = session.getAttributes().get("userId");
        Long roomId = roomIdAttr instanceof Long l ? l : null;
        Long userId = userIdAttr instanceof Long l ? l : (userIdAttr instanceof Number n ? n.longValue() : null);

        if (roomId != null) {
            Set<WebSocketSession> sessions = roomSessions.get(roomId);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    roomSessions.remove(roomId);
                }
            }
        }

        if (roomId != null && userId != null) {
            boolean hostHasOtherSessions = roomSessions
                    .getOrDefault(roomId, ConcurrentHashMap.newKeySet())
                    .stream()
                    .anyMatch(s -> s.isOpen() && userId.equals(s.getAttributes().get("userId")));
            if (!hostHasOtherSessions) {
                roomService.pauseRoomIfHostDisconnected(roomId, userId).ifPresent(state ->
                        broadcastRoomState(roomId, state));
            }
        }
    }

    // -------------------------------------------------------------------------
    // Message handling
    // -------------------------------------------------------------------------

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        Object roomIdAttr = session.getAttributes().get("roomId");
        if (!(roomIdAttr instanceof Long roomId)) return;
        Object userIdAttr = session.getAttributes().get("userId");
        Long userId = userIdAttr instanceof Long l ? l : (userIdAttr instanceof Number n ? n.longValue() : null);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> payload = objectMapper.readValue(message.getPayload(), Map.class);
            String type = (String) payload.get("type");

            switch (type == null ? "" : type) {
                case "getPosition" -> handleGetPosition(session, roomId, payload);
                case "positionResponse" -> handlePositionResponse(session, userId, roomId, payload, message);
                case "positionTick" -> handlePositionTick(session, userId, roomId, payload);
                default -> { /* неизвестные типы игнорируются */ }
            }
        } catch (Exception ignored) {
            // malformed JSON — игнорируем
        }
    }

    /**
     * Клиент запрашивает текущую позицию у хоста.
     * Запрос пересылается только активным сессиям хоста (не всем участникам).
     */
    private void handleGetPosition(WebSocketSession requesterSession, Long roomId,
                                   Map<String, Object> payload) throws IOException {
        long nowMs = System.currentTimeMillis();
        Long lastMs = lastGetPositionTime.get(requesterSession.getId());
        if (lastMs != null && nowMs - lastMs < GET_POSITION_RATE_LIMIT_MS) return;
        lastGetPositionTime.put(requesterSession.getId(), nowMs);

        String requestId = (String) payload.get("requestId");
        if (requestId == null || requestId.isBlank()) {
            requestId = UUID.randomUUID().toString();
        }
        pendingPositionRequests.put(requestId, requesterSession);
        pendingRequestTimestamps.put(requestId, nowMs);

        Optional<Room> roomOpt = roomRepository.findById(roomId);
        if (roomOpt.isEmpty()) return;
        Long hostId = roomOpt.get().getHost().getId();

        String requestPayload = objectMapper.writeValueAsString(
                Map.of("type", "getPositionRequest", "requestId", requestId));
        TextMessage msg = new TextMessage(requestPayload);

        // Слать только сессиям хоста, а не всем участникам
        Set<WebSocketSession> sessions = roomSessions.getOrDefault(roomId, Set.of());
        for (WebSocketSession s : sessions) {
            if (s.isOpen() && hostId.equals(s.getAttributes().get("userId"))) {
                s.sendMessage(msg);
            }
        }
    }

    /**
     * Хост отвечает на запрос позиции — пересылаем конкретному запросившему.
     */
    private void handlePositionResponse(WebSocketSession senderSession, Long userId,
                                        Long roomId, Map<String, Object> payload,
                                        TextMessage originalMessage) {
        if (userId == null) return;
        Optional<Room> roomOpt = roomRepository.findById(roomId);
        if (roomOpt.isEmpty() || !roomOpt.get().getHost().getId().equals(userId)) return;

        String requestId = (String) payload.get("requestId");
        if (requestId != null) {
            WebSocketSession requester = pendingPositionRequests.remove(requestId);
            pendingRequestTimestamps.remove(requestId);
            if (requester != null && requester.isOpen()) {
                try {
                    requester.sendMessage(originalMessage);
                } catch (IOException ignored) {}
            }
        }
    }

    /**
     * Хост периодически шлёт тики позиции для анти-дрифта.
     * Сервер ретранслирует всем участникам (кроме отправителя) и периодически
     * сохраняет позицию в БД (checkpoint).
     */
    private void handlePositionTick(WebSocketSession senderSession, Long userId,
                                    Long roomId, Map<String, Object> payload) throws IOException {
        if (userId == null) return;
        Optional<Room> roomOpt = roomRepository.findById(roomId);
        if (roomOpt.isEmpty()) return;
        Room room = roomOpt.get();
        if (!room.getHost().getId().equals(userId)) return;

        double positionSeconds = 0.0;
        Object posObj = payload.get("positionSeconds");
        if (posObj instanceof Number n) positionSeconds = Math.max(0.0, n.doubleValue());
        boolean playing = Boolean.TRUE.equals(payload.get("playing"));
        Object currentTrackId = payload.get("currentTrackId");
        Object currentQueueItemId = payload.get("currentQueueItemId");
        long serverTimeMs = System.currentTimeMillis();

        Map<String, Object> tick = new HashMap<>();
        tick.put("type", "position");
        tick.put("positionSeconds", positionSeconds);
        tick.put("playing", playing);
        tick.put("currentTrackId", currentTrackId);
        tick.put("currentQueueItemId", currentQueueItemId);
        tick.put("serverTimeMs", serverTimeMs);

        String tickPayload = objectMapper.writeValueAsString(tick);
        sendToRoom(roomId, new TextMessage(tickPayload), senderSession);

        // Checkpoint: сохранить позицию в БД не чаще раза в POSITION_CHECKPOINT_INTERVAL_MS
        if (playing) {
            long lastSave = lastCheckpointMs.getOrDefault(roomId, 0L);
            if (serverTimeMs - lastSave >= POSITION_CHECKPOINT_INTERVAL_MS) {
                lastCheckpointMs.put(roomId, serverTimeMs);
                roomService.savePositionCheckpoint(roomId, positionSeconds, serverTimeMs);
            }
        }
    }

    // -------------------------------------------------------------------------
    // Broadcasts
    // -------------------------------------------------------------------------

    /** Отправить снимок состояния комнаты всем подключённым клиентам. */
    public void broadcastRoomState(Long roomId, RoomResponse state) {
        Set<WebSocketSession> sessions = roomSessions.get(roomId);
        if (sessions == null || sessions.isEmpty()) return;
        String payload;
        try {
            Map<String, Object> envelope = new HashMap<>();
            envelope.put("type", "stateSnapshot");
            envelope.put("revision", state.getStateRevision());
            envelope.put("payload", state);
            payload = objectMapper.writeValueAsString(envelope);
        } catch (JsonProcessingException e) {
            return;
        }
        TextMessage message = new TextMessage(payload);
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(message);
                } catch (IOException ignored) {}
            }
        }
    }

    /** Отправить новое чат-сообщение всем участникам комнаты. */
    public void broadcastChatMessage(Long roomId, RoomChatMessageResponse messageDto) {
        Set<WebSocketSession> sessions = roomSessions.get(roomId);
        if (sessions == null || sessions.isEmpty()) return;
        String payload;
        try {
            Map<String, Object> envelope = Map.of("type", "chat", "message", messageDto);
            payload = objectMapper.writeValueAsString(envelope);
        } catch (JsonProcessingException e) {
            return;
        }
        TextMessage textMessage = new TextMessage(payload);
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(textMessage);
                } catch (IOException ignored) {}
            }
        }
    }

    /**
     * Рассылает событие «комната закрыта» всем подключённым, затем удаляет запись.
     * Вызывать до удаления комнаты из БД.
     */
    public void broadcastRoomClosed(Long roomId) {
        Set<WebSocketSession> sessions = roomSessions.remove(roomId);
        lastCheckpointMs.remove(roomId);
        if (sessions == null || sessions.isEmpty()) return;
        String payload;
        try {
            payload = objectMapper.writeValueAsString(Map.of("type", TYPE_ROOM_CLOSED, "roomId", roomId));
        } catch (JsonProcessingException e) {
            return;
        }
        TextMessage message = new TextMessage(payload);
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(message);
                } catch (IOException ignored) {}
            }
        }
    }

    // -------------------------------------------------------------------------
    // Scheduled cleanup
    // -------------------------------------------------------------------------

    /**
     * Удаляет устаревшие pendingPositionRequests (хост не ответил в течение TTL).
     * Предотвращает утечку памяти при сбоях.
     */
    @Scheduled(fixedDelay = 30_000)
    public void cleanupStalePendingRequests() {
        long now = System.currentTimeMillis();
        pendingRequestTimestamps.entrySet().removeIf(entry -> {
            boolean stale = now - entry.getValue() > PENDING_REQUEST_TTL_MS;
            if (stale) pendingPositionRequests.remove(entry.getKey());
            return stale;
        });
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /** Отправить текущее состояние только что подключившемуся клиенту. */
    private void sendInitialState(WebSocketSession session, Long roomId, User user) {
        try {
            RoomResponse state = roomService.findById(roomId, user);
            Map<String, Object> envelope = new HashMap<>();
            envelope.put("type", "stateSnapshot");
            envelope.put("revision", state.getStateRevision());
            envelope.put("payload", state);
            String payload = objectMapper.writeValueAsString(envelope);
            if (session.isOpen()) {
                session.sendMessage(new TextMessage(payload));
            }
        } catch (Exception ignored) {}
    }

    private void sendToRoom(Long roomId, TextMessage message, WebSocketSession exclude) {
        Set<WebSocketSession> sessions = roomSessions.get(roomId);
        if (sessions == null) return;
        for (WebSocketSession s : sessions) {
            if (s != exclude && s.isOpen()) {
                try {
                    s.sendMessage(message);
                } catch (IOException ignored) {}
            }
        }
    }

    private Long extractRoomId(URI uri) {
        if (uri == null) return null;
        String path = uri.getPath();
        if (path == null) return null;
        String[] parts = path.split("/");
        if (parts.length < 3) return null;
        try {
            return Long.parseLong(parts[parts.length - 1]);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String extractToken(URI uri) {
        if (uri == null) return null;
        String query = uri.getRawQuery();
        if (query == null || query.isBlank()) return null;
        for (String param : query.split("&")) {
            int eq = param.indexOf('=');
            if (eq > 0 && QUERY_PARAM_TOKEN.equals(param.substring(0, eq).trim())) {
                String value = param.substring(eq + 1).trim();
                return value.isEmpty() ? null : value;
            }
        }
        return null;
    }

    private void closeSilently(WebSocketSession session, CloseStatus status) {
        try {
            session.close(status);
        } catch (IOException ignored) {}
    }
}
