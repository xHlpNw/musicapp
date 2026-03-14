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
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.UUID;

/**
 * WebSocket‑обработчик для комнат совместного прослушивания.
 * Подключение по адресу /ws/rooms/{roomId}?token=JWT.
 * Только участники комнаты (хост или в RoomMember) могут подключаться.
 */
@Component
public class RoomWebSocketHandler extends TextWebSocketHandler {

    private static final String QUERY_PARAM_TOKEN = "token";

    private static final String TYPE_ROOM_CLOSED = "roomClosed";

    private final ObjectMapper objectMapper;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final RoomService roomService;

    /**
     * Сессии по roomId.
     */
    private final Map<Long, Set<WebSocketSession>> roomSessions = new ConcurrentHashMap<>();

    /** Ожидающие ответа по позиции: requestId -> сессия, которая запросила. */
    private final Map<String, WebSocketSession> pendingPositionRequests = new ConcurrentHashMap<>();

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
        roomSessions.computeIfAbsent(roomId, id -> ConcurrentHashMap.newKeySet())
                .add(session);
        session.getAttributes().put("roomId", roomId);
        sendInitialState(session, roomId, user);
    }

    /** Отправить текущее состояние комнаты только что подключившемуся клиенту. */
    private void sendInitialState(WebSocketSession session, Long roomId, User user) {
        try {
            RoomResponse state = roomService.findById(roomId, user);
            String payload = objectMapper.writeValueAsString(state);
            if (session.isOpen()) {
                session.sendMessage(new TextMessage(payload));
            }
        } catch (Exception e) {
            System.out.println("[RoomWebSocketHandler] sendInitialState failed: " + e.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        pendingPositionRequests.entrySet().removeIf(e -> e.getValue() == session);
        Object attr = session.getAttributes().get("roomId");
        if (attr instanceof Long roomId) {
            Set<WebSocketSession> sessions = roomSessions.get(roomId);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    roomSessions.remove(roomId);
                }
            }
        }
    }

    /**
     * Обработка сообщений от клиентов: getPosition (запрос позиции у хоста) и positionResponse (ответ хоста).
     */
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        Object roomIdAttr = session.getAttributes().get("roomId");
        if (!(roomIdAttr instanceof Long roomId)) {
            return;
        }
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> payload = objectMapper.readValue(message.getPayload(), Map.class);
            String type = (String) payload.get("type");
            if ("getPosition".equals(type)) {
                String requestId = (String) payload.get("requestId");
                if (requestId == null || requestId.isBlank()) {
                    requestId = UUID.randomUUID().toString();
                }
                pendingPositionRequests.put(requestId, session);
                String requestPayload = objectMapper.writeValueAsString(Map.of("type", "getPositionRequest", "requestId", requestId));
                sendToRoom(roomId, new TextMessage(requestPayload), null);
                return;
            }
            if ("positionResponse".equals(type)) {
                String requestId = (String) payload.get("requestId");
                if (requestId != null) {
                    WebSocketSession requester = pendingPositionRequests.remove(requestId);
                    if (requester != null && requester.isOpen()) {
                        try {
                            requester.sendMessage(message);
                        } catch (IOException ignored) {
                        }
                    }
                }
            }
        } catch (Exception e) {
            // ignore malformed messages
        }
    }

    private void sendToRoom(Long roomId, TextMessage message, WebSocketSession exclude) {
        Set<WebSocketSession> sessions = roomSessions.get(roomId);
        if (sessions == null) return;
        for (WebSocketSession s : sessions) {
            if (s != exclude && s.isOpen()) {
                try {
                    s.sendMessage(message);
                } catch (IOException ignored) {
                }
            }
        }
    }

    /**
     * Отправить обновлённое состояние комнаты всем подключённым клиентам.
     */
    public void broadcastRoomState(Long roomId, RoomResponse state) {
        System.out.println("[RoomWebSocketHandler] broadcastRoomState roomId=" + roomId);
        Set<WebSocketSession> sessions = roomSessions.get(roomId);
        if (sessions == null || sessions.isEmpty()) {
            System.out.println("[RoomWebSocketHandler] no sessions for roomId=" + roomId);
            return;
        }
        String payload;
        try {
            // Оставляем обратную совместимость: состояние комнаты отправляем "как есть"
            // (без обёртки type/state), чтобы существующий клиент продолжал работать.
            payload = objectMapper.writeValueAsString(state);
        } catch (JsonProcessingException e) {
            System.out.println("[RoomWebSocketHandler] failed to serialize RoomResponse: " + e.getMessage());
            return;
        }
        TextMessage message = new TextMessage(payload);
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(message);
                } catch (IOException ignored) {
                    System.out.println("[RoomWebSocketHandler] failed to send message to session: " + ignored.getMessage());
                }
            }
        }
    }

    /**
     * Отправить новое чат‑сообщение всем участникам комнаты.
     * Сообщение идёт в отдельном формате:
     * { "type": "chat", "message": { ...RoomChatMessageResponse } }
     */
    public void broadcastChatMessage(Long roomId, RoomChatMessageResponse messageDto) {
        System.out.println("[RoomWebSocketHandler] broadcastChatMessage roomId=" + roomId);
        Set<WebSocketSession> sessions = roomSessions.get(roomId);
        if (sessions == null || sessions.isEmpty()) {
            System.out.println("[RoomWebSocketHandler] no sessions for roomId=" + roomId);
            return;
        }
        String payload;
        try {
            Map<String, Object> envelope = Map.of(
                    "type", "chat",
                    "message", messageDto
            );
            payload = objectMapper.writeValueAsString(envelope);
        } catch (JsonProcessingException e) {
            System.out.println("[RoomWebSocketHandler] failed to serialize RoomChatMessageResponse: " + e.getMessage());
            return;
        }
        TextMessage textMessage = new TextMessage(payload);
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(textMessage);
                } catch (IOException ignored) {
                    System.out.println("[RoomWebSocketHandler] failed to send chat message to session: " + ignored.getMessage());
                }
            }
        }
    }

    /**
     * Рассылает сообщение «комната закрыта» всем подключённым, затем удаляет комнату из roomSessions.
     * Вызывать до удаления комнаты из БД.
     */
    public void broadcastRoomClosed(Long roomId) {
        Set<WebSocketSession> sessions = roomSessions.remove(roomId);
        if (sessions == null || sessions.isEmpty()) {
            return;
        }
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
                } catch (IOException ignored) {
                }
            }
        }
    }

    private Long extractRoomId(URI uri) {
        if (uri == null) {
            return null;
        }
        String path = uri.getPath(); // ожидаем что‑то вроде /ws/rooms/123
        if (path == null) {
            return null;
        }
        String[] parts = path.split("/");
        if (parts.length < 3) {
            return null;
        }
        String last = parts[parts.length - 1];
        try {
            return Long.parseLong(last);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String extractToken(URI uri) {
        if (uri == null) {
            return null;
        }
        String query = uri.getRawQuery();
        if (query == null || query.isBlank()) {
            return null;
        }
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
        } catch (IOException ignored) {
        }
    }
}

