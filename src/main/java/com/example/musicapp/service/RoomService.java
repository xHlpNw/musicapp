package com.example.musicapp.service;

import com.example.musicapp.dto.room.CreateRoomChatMessageRequest;
import com.example.musicapp.dto.room.CreateRoomRequest;
import com.example.musicapp.dto.room.RoomChatMessageResponse;
import com.example.musicapp.dto.room.RoomResponse;
import com.example.musicapp.dto.room.RoomStateRequest;
import com.example.musicapp.dto.room.UpdateRoomRequest;
import com.example.musicapp.entity.Room;
import com.example.musicapp.entity.RoomChatMessage;
import com.example.musicapp.entity.RoomMember;
import com.example.musicapp.entity.RoomQueueItem;
import com.example.musicapp.entity.Track;
import com.example.musicapp.entity.User;
import com.example.musicapp.exception.ForbiddenException;
import com.example.musicapp.exception.ResourceNotFoundException;
import com.example.musicapp.realtime.RoomWebSocketHandler;
import com.example.musicapp.repository.RoomChatMessageRepository;
import com.example.musicapp.repository.RoomMemberRepository;
import com.example.musicapp.repository.RoomQueueItemRepository;
import com.example.musicapp.repository.RoomRepository;
import com.example.musicapp.repository.TrackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomService {

    @Value("${app.storage.path:./storage}")
    private String storagePath;
    private Path roomsCoversDir;

    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final RoomQueueItemRepository roomQueueItemRepository;
    private final TrackRepository trackRepository;
    private final RoomChatMessageRepository roomChatMessageRepository;
    private final RoomWebSocketHandler roomWebSocketHandler;

    @PostConstruct
    public void init() throws IOException {
        roomsCoversDir = Paths.get(storagePath).resolve("covers").resolve("rooms").toAbsolutePath();
        Files.createDirectories(roomsCoversDir);
    }

    @Transactional(readOnly = true)
    public List<RoomResponse> findRoomsForUser(User currentUser) {
        List<Room> hosted = roomRepository.findByHostOrderByCreatedAtDesc(currentUser);
        List<Room> asMember = roomRepository.findByMembersUserOrderByCreatedAtDesc(currentUser);
        List<Room> combined = new ArrayList<>(hosted);
        for (Room r : asMember) {
            if (!r.getHost().getId().equals(currentUser.getId())) {
                combined.add(r);
            }
        }
        return combined.stream().map(room -> toResponse(room, currentUser)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RoomResponse findById(Long id, User currentUser) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + id));
        if (!isMember(room, currentUser)) {
            throw new ForbiddenException("You are not a member of this room");
        }
        return toDetailResponse(room);
    }

    /** Краткая информация о комнате для не-участников (карточка, страница до присоединения). */
    @Transactional(readOnly = true)
    public RoomResponse findByIdPublic(Long id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + id));
        return toResponse(room);
    }

    /** Список комнат с фильтром и пагинацией. */
    @Transactional(readOnly = true)
    public Page<RoomResponse> findRooms(String filter, String q, Pageable pageable, User currentUser) {
        String trimmedQ = (q != null && !q.isBlank()) ? q.trim() : null;
        if ("mine".equals(filter)) {
            List<RoomResponse> list = findRoomsForUser(currentUser);
            int start = (int) pageable.getOffset();
            int end = Math.min(start + pageable.getPageSize(), list.size());
            List<RoomResponse> pageContent = start < list.size() ? list.subList(start, end) : new ArrayList<>();
            return new org.springframework.data.domain.PageImpl<>(pageContent, pageable, list.size());
        }
        if ("open".equals(filter)) {
            Page<Room> page = trimmedQ != null
                    ? roomRepository.findOpenRoomsWithSearch(trimmedQ, pageable)
                    : roomRepository.findOpenRooms(pageable);
            return page.map(room -> toResponse(room, currentUser));
        }
        // all
        Page<Room> page = trimmedQ != null
                ? roomRepository.findByNameContainingIgnoreCaseOrHost_UsernameContainingIgnoreCase(trimmedQ, trimmedQ, pageable)
                : roomRepository.findAll(pageable);
        return page.map(room -> toResponse(room, currentUser));
    }

    /** Популярные комнаты (по количеству участников). */
    @Transactional(readOnly = true)
    public List<RoomResponse> findPopular(int limit, User currentUser) {
        Pageable pageable = PageRequest.of(0, Math.min(limit, 20), Sort.unsorted());
        return roomRepository.findPopularRooms(pageable).getContent().stream()
                .map(room -> toResponse(room, currentUser))
                .collect(Collectors.toList());
    }

    @Transactional
    public RoomResponse create(CreateRoomRequest request, User currentUser) {
        Instant now = Instant.now();
        Room room = Room.builder()
                .name(request.getName())
                .maxMembers(request.getMaxMembers())
                .host(currentUser)
                .positionSeconds(0.0)
                .playing(false)
                .createdAt(now)
                .updatedAt(now)
                .queue(new ArrayList<>())
                .build();
        room = roomRepository.save(room);
        RoomMember member = RoomMember.builder()
                .room(room)
                .user(currentUser)
                .joinedAt(Instant.now())
                .build();
        roomMemberRepository.save(member);
        return toDetailResponse(room);
    }

    @Transactional
    public void join(Long roomId, User currentUser) {
        roomMemberRepository.findByUser(currentUser).ifPresent(m -> leave(m.getRoom().getId(), currentUser));
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + roomId));
        if (roomMemberRepository.existsByRoomAndUser(room, currentUser)) {
            return;
        }
        if (room.getMaxMembers() != null) {
            long count = roomMemberRepository.countByRoom(room);
            if (count >= room.getMaxMembers()) {
                throw new ForbiddenException("Room is full");
            }
        }
        RoomMember member = RoomMember.builder()
                .room(room)
                .user(currentUser)
                .joinedAt(Instant.now())
                .build();
        roomMemberRepository.save(member);
    }

    @Transactional
    public void leave(Long roomId, User currentUser) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + roomId));
        if (!roomMemberRepository.existsByRoomAndUser(room, currentUser)) {
            return;
        }
        roomMemberRepository.deleteByRoomAndUser(room, currentUser);
        if (room.getHost().getId().equals(currentUser.getId())) {
            List<RoomMember> remaining = roomMemberRepository.findByRoomOrderByJoinedAtAsc(room);
            if (remaining.isEmpty()) {
                roomRepository.delete(room);
            } else {
                room.setHost(remaining.get(0).getUser());
                room = roomRepository.save(room);
                RoomResponse response = toDetailResponse(room);
                roomWebSocketHandler.broadcastRoomState(roomId, response);
            }
        }
    }

    @Transactional
    public RoomResponse update(Long roomId, UpdateRoomRequest request, User currentUser) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + roomId));
        if (!room.getHost().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Only the host can update room settings");
        }
        if (request.getName() != null && !request.getName().isBlank()) {
            room.setName(request.getName().trim());
        }
        if (request.getMaxMembers() != null) {
            room.setMaxMembers(request.getMaxMembers());
        }
        room.setUpdatedAt(Instant.now());
        room = roomRepository.save(room);
        RoomResponse response = toDetailResponse(room);
        roomWebSocketHandler.broadcastRoomState(roomId, response);
        return response;
    }

    @Transactional
    public RoomResponse updateState(Long roomId, RoomStateRequest request, User currentUser) {
        System.out.println("[RoomService] updateState called for roomId=" + roomId + ", userId=" + currentUser.getId());
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + roomId));
        if (!room.getHost().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Only the host can update room state");
        }
        if (request.getQueueItemId() != null) {
            RoomQueueItem item = roomQueueItemRepository.findById(request.getQueueItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Queue item not found: " + request.getQueueItemId()));
            if (!item.getRoom().getId().equals(roomId)) {
                throw new ForbiddenException("Queue item does not belong to this room");
            }
            room.setCurrentQueueItemId(item.getId());
            room.setCurrentTrack(item.getTrack());
        } else if (request.getCurrentTrackId() != null) {
            Track track = trackRepository.findById(request.getCurrentTrackId())
                    .orElseThrow(() -> new ResourceNotFoundException("Track not found: " + request.getCurrentTrackId()));
            Long previousTrackId = room.getCurrentTrack() != null ? room.getCurrentTrack().getId() : null;
            room.setCurrentTrack(track);
            if (!Objects.equals(previousTrackId, track.getId())) {
                room.setCurrentQueueItemId(resolveCurrentQueueItemId(room, track.getId()));
            }
        } else {
            room.setCurrentTrack(null);
            room.setCurrentQueueItemId(null);
        }
        if (request.getPositionSeconds() != null) {
            room.setPositionSeconds(request.getPositionSeconds());
        }
        if (request.getPlaying() != null) {
            room.setPlaying(request.getPlaying());
        }
        room.setUpdatedAt(Instant.now());
        room = roomRepository.save(room);
        RoomResponse response = toDetailResponse(room);
        System.out.println("[RoomService] broadcasting new state for roomId=" + roomId);
        roomWebSocketHandler.broadcastRoomState(roomId, response);
        return response;
    }

    /** Первый по position элемент очереди с данным trackId, или null. */
    private Long resolveCurrentQueueItemId(Room room, Long trackId) {
        return room.getQueue().stream()
                .filter(qi -> qi.getTrack().getId().equals(trackId))
                .findFirst()
                .map(RoomQueueItem::getId)
                .orElse(null);
    }

    @Transactional
    public RoomResponse uploadCover(Long roomId, MultipartFile file, User currentUser) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + roomId));
        if (!room.getHost().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Only the host can change room cover");
        }
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }
        String ext = getImageExtension(file.getOriginalFilename()).orElse("jpg");
        String fileName = roomId + "." + ext;
        Path targetFile = roomsCoversDir.resolve(fileName);
        try {
            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Failed to save room cover", e);
        }
        String relativePath = "rooms/" + fileName;
        room.setCoverImagePath(relativePath);
        room.setUpdatedAt(Instant.now());
        room = roomRepository.save(room);
        RoomResponse response = toDetailResponse(room);
        roomWebSocketHandler.broadcastRoomState(roomId, response);
        return response;
    }

    @Transactional
    public RoomResponse deleteCover(Long roomId, User currentUser) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + roomId));
        if (!room.getHost().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Only the host can remove room cover");
        }
        if (room.getCoverImagePath() != null && !room.getCoverImagePath().isBlank()) {
            String path = room.getCoverImagePath();
            if (path.startsWith("rooms/")) {
                Path file = roomsCoversDir.resolve(path.substring("rooms/".length())).normalize();
                if (file.startsWith(roomsCoversDir)) {
                    try {
                        Files.deleteIfExists(file);
                    } catch (IOException ignored) {
                    }
                }
            }
            room.setCoverImagePath(null);
            room.setUpdatedAt(Instant.now());
            room = roomRepository.save(room);
            RoomResponse response = toDetailResponse(room);
            roomWebSocketHandler.broadcastRoomState(roomId, response);
            return response;
        }
        return toDetailResponse(room);
    }

    @Transactional(readOnly = true)
    public List<RoomChatMessageResponse> getRecentChatMessages(Long roomId, int limit, User currentUser) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + roomId));
        if (!isMember(room, currentUser)) {
            throw new ForbiddenException("You are not a member of this room");
        }
        int pageSize = Math.min(Math.max(limit, 1), 200);
        var messagesDesc = roomChatMessageRepository.findRecentByRoom(room, PageRequest.of(0, pageSize));
        var messagesAsc = new ArrayList<>(messagesDesc);
        messagesAsc.sort(Comparator.comparing(RoomChatMessage::getCreatedAt));
        return messagesAsc.stream()
                .map(this::toChatMessageResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public RoomChatMessageResponse addChatMessage(Long roomId, CreateRoomChatMessageRequest request, User currentUser) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + roomId));
        if (!isMember(room, currentUser)) {
            throw new ForbiddenException("You are not a member of this room");
        }
        String text = Optional.ofNullable(request.getText())
                .map(String::trim)
                .orElse("");
        if (text.isEmpty()) {
            throw new IllegalArgumentException("Message text must not be empty");
        }
        Instant now = Instant.now();
        RoomChatMessage message = RoomChatMessage.builder()
                .room(room)
                .user(currentUser)
                .text(text)
                .createdAt(now)
                .build();
        message = roomChatMessageRepository.save(message);
        RoomChatMessageResponse dto = toChatMessageResponse(message);
        roomWebSocketHandler.broadcastChatMessage(roomId, dto);
        return dto;
    }

    @Transactional
    public void addToQueue(Long roomId, Long trackId, User currentUser) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + roomId));
        if (!room.getHost().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Only the host can add to queue");
        }
        Track track = trackRepository.findById(trackId)
                .orElseThrow(() -> new ResourceNotFoundException("Track not found: " + trackId));
        int nextPosition = room.getQueue().stream()
                .mapToInt(RoomQueueItem::getPosition)
                .max()
                .orElse(0) + 1;
        RoomQueueItem item = RoomQueueItem.builder()
                .room(room)
                .track(track)
                .position(nextPosition)
                .build();
        roomQueueItemRepository.save(item);
        room.getQueue().add(item);
        room.setUpdatedAt(Instant.now());
        room = roomRepository.save(room);
        RoomResponse response = toDetailResponse(room);
        roomWebSocketHandler.broadcastRoomState(roomId, response);
    }

    @Transactional
    public void removeFromQueue(Long roomId, Long queueItemId, User currentUser) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + roomId));
        if (!room.getHost().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Only the host can remove from queue");
        }
        RoomQueueItem item = roomQueueItemRepository.findById(queueItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Queue item not found: " + queueItemId));
        if (!item.getRoom().getId().equals(roomId)) {
            throw new ForbiddenException("Queue item does not belong to this room");
        }
        if (item.getId().equals(room.getCurrentQueueItemId())) {
            room.setCurrentTrack(null);
            room.setCurrentQueueItemId(null);
        }
        room.getQueue().remove(item);
        roomQueueItemRepository.delete(item);
        room.setUpdatedAt(Instant.now());
        room = roomRepository.save(room);
        RoomResponse response = toDetailResponse(room);
        roomWebSocketHandler.broadcastRoomState(roomId, response);
    }

    private boolean isMember(Room room, User user) {
        return room.getHost().getId().equals(user.getId())
                || roomMemberRepository.existsByRoomAndUser(room, user);
    }

    private RoomChatMessageResponse toChatMessageResponse(RoomChatMessage message) {
        User user = message.getUser();
        Room room = message.getRoom();
        boolean isHost = room.getHost() != null && room.getHost().getId().equals(user.getId());
        return RoomChatMessageResponse.builder()
                .id(message.getId())
                .roomId(room.getId())
                .userId(user.getId())
                .username(user.getUsername())
                .host(isHost)
                .text(message.getText())
                .createdAt(message.getCreatedAt())
                .build();
    }

    private RoomResponse toResponse(Room room) {
        return toResponse(room, null);
    }

    private RoomResponse toResponse(Room room, User currentUser) {
        long memberCount = roomMemberRepository.countByRoom(room);
        List<RoomResponse.QueueItemInfo> queue = room.getQueue().stream()
                .map(qi -> {
                    var t = qi.getTrack();
                    return new RoomResponse.QueueItemInfo(qi.getId(), qi.getPosition(), t.getId(), t.getTitle(), getFirstArtistName(t), t.getDurationSeconds(), t.getCoverImagePath());
                })
                .collect(Collectors.toList());
        var track = room.getCurrentTrack();
        return RoomResponse.builder()
                .id(room.getId())
                .name(room.getName())
                .hostId(room.getHost().getId())
                .hostUsername(room.getHost().getUsername())
                .currentTrackId(track != null ? track.getId() : null)
                .currentQueueItemId(room.getCurrentQueueItemId())
                .currentTrackTitle(track != null ? track.getTitle() : null)
                .currentTrackCoverPath(track != null ? track.getCoverImagePath() : null)
                .currentTrackArtistName(track != null ? getFirstArtistName(track) : null)
                .positionSeconds(room.getPositionSeconds())
                .playing(room.isPlaying())
                .memberCount((int) memberCount)
                .maxMembers(room.getMaxMembers())
                .coverImagePath(room.getCoverImagePath())
                .isMember(currentUser != null && isMember(room, currentUser))
                .createdAt(room.getCreatedAt())
                .updatedAt(room.getUpdatedAt())
                .queue(queue)
                .members(null)
                .build();
    }

    private RoomResponse toDetailResponse(Room room) {
        List<RoomResponse.MemberInfo> members = roomMemberRepository.findByRoomOrderByJoinedAtAsc(room).stream()
                .map(m -> new RoomResponse.MemberInfo(m.getUser().getId(), m.getUser().getUsername()))
                .collect(Collectors.toList());
        if (room.getHost() != null && members.stream().noneMatch(m -> m.getUserId().equals(room.getHost().getId()))) {
            members.add(0, new RoomResponse.MemberInfo(room.getHost().getId(), room.getHost().getUsername()));
        }
        List<RoomResponse.QueueItemInfo> queue = room.getQueue().stream()
                .map(qi -> {
                    var t = qi.getTrack();
                    return new RoomResponse.QueueItemInfo(qi.getId(), qi.getPosition(), t.getId(), t.getTitle(), getFirstArtistName(t), t.getDurationSeconds(), t.getCoverImagePath());
                })
                .collect(Collectors.toList());
        var track = room.getCurrentTrack();
        return RoomResponse.builder()
                .id(room.getId())
                .name(room.getName())
                .hostId(room.getHost().getId())
                .hostUsername(room.getHost().getUsername())
                .currentTrackId(track != null ? track.getId() : null)
                .currentQueueItemId(room.getCurrentQueueItemId())
                .currentTrackTitle(track != null ? track.getTitle() : null)
                .currentTrackCoverPath(track != null ? track.getCoverImagePath() : null)
                .currentTrackArtistName(track != null ? getFirstArtistName(track) : null)
                .positionSeconds(room.getPositionSeconds())
                .playing(room.isPlaying())
                .memberCount(members.size())
                .maxMembers(room.getMaxMembers())
                .coverImagePath(room.getCoverImagePath())
                .createdAt(room.getCreatedAt())
                .updatedAt(room.getUpdatedAt())
                .queue(queue)
                .members(members)
                .build();
    }

    private static Optional<String> getImageExtension(String filename) {
        if (filename == null || filename.isBlank()) return Optional.empty();
        String lower = filename.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".jpeg") || lower.endsWith(".jpg")) return Optional.of("jpg");
        if (lower.endsWith(".png")) return Optional.of("png");
        if (lower.endsWith(".webp")) return Optional.of("webp");
        return Optional.empty();
    }

    private String getFirstArtistName(Track track) {
        if (track.getArtists() == null || track.getArtists().isEmpty()) {
            return null;
        }
        return track.getArtists().get(0).getArtist().getName();
    }
}
