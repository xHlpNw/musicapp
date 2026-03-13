package com.example.musicapp.realtime;

import com.example.musicapp.dto.room.RoomChatMessageResponse;
import com.example.musicapp.dto.room.RoomResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket‑обработчик для комнат совместного прослушивания.
 * Подключение по адресу /ws/rooms/{roomId}.
 *
 * Клиенты ничего не отправляют на сервер, а только получают
 * пуш‑уведомления с обновлённым состоянием комнаты (RoomResponse).
 */
@Component
public class RoomWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;

    /**
     * Сессии по roomId.
     */
    private final Map<Long, Set<WebSocketSession>> roomSessions = new ConcurrentHashMap<>();

    public RoomWebSocketHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        Long roomId = extractRoomId(session.getUri());
        if (roomId == null) {
            System.out.println("[RoomWebSocketHandler] afterConnectionEstablished: failed to extract roomId, closing");
            closeSilently(session, CloseStatus.BAD_DATA);
            return;
        }
        System.out.println("[RoomWebSocketHandler] afterConnectionEstablished: roomId=" + roomId + ", sessionId=" + session.getId());
        roomSessions.computeIfAbsent(roomId, id -> ConcurrentHashMap.newKeySet())
                .add(session);
        session.getAttributes().put("roomId", roomId);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Object attr = session.getAttributes().get("roomId");
        if (attr instanceof Long roomId) {
            System.out.println("[RoomWebSocketHandler] afterConnectionClosed: roomId=" + roomId + ", sessionId=" + session.getId() + ", status=" + status);
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
     * Сообщения от клиентов сейчас не обрабатываем.
     */
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        // no-op
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

    private void closeSilently(WebSocketSession session, CloseStatus status) {
        try {
            session.close(status);
        } catch (IOException ignored) {
        }
    }
}

