package com.example.musicapp.service;

import com.example.musicapp.dto.room.CreateRoomRequest;
import com.example.musicapp.dto.room.RoomResponse;
import com.example.musicapp.dto.room.RoomStateRequest;
import com.example.musicapp.entity.Room;
import com.example.musicapp.entity.RoomMember;
import com.example.musicapp.entity.RoomQueueItem;
import com.example.musicapp.entity.Track;
import com.example.musicapp.entity.User;
import com.example.musicapp.exception.ForbiddenException;
import com.example.musicapp.exception.ResourceNotFoundException;
import com.example.musicapp.repository.RoomMemberRepository;
import com.example.musicapp.repository.RoomQueueItemRepository;
import com.example.musicapp.repository.RoomRepository;
import com.example.musicapp.repository.TrackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final RoomQueueItemRepository roomQueueItemRepository;
    private final TrackRepository trackRepository;

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
        return combined.stream().map(this::toResponse).collect(Collectors.toList());
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
                roomRepository.save(room);
            }
        }
    }

    @Transactional
    public RoomResponse updateState(Long roomId, RoomStateRequest request, User currentUser) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + roomId));
        if (!room.getHost().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Only the host can update room state");
        }
        if (request.getCurrentTrackId() != null) {
            Track track = trackRepository.findById(request.getCurrentTrackId())
                    .orElseThrow(() -> new ResourceNotFoundException("Track not found: " + request.getCurrentTrackId()));
            room.setCurrentTrack(track);
        }
        if (request.getPositionSeconds() != null) {
            room.setPositionSeconds(request.getPositionSeconds());
        }
        if (request.getPlaying() != null) {
            room.setPlaying(request.getPlaying());
        }
        room.setUpdatedAt(Instant.now());
        room = roomRepository.save(room);
        return toDetailResponse(room);
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
        roomRepository.save(room);
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
        room.getQueue().remove(item);
        roomQueueItemRepository.delete(item);
        room.setUpdatedAt(Instant.now());
        roomRepository.save(room);
    }

    private boolean isMember(Room room, User user) {
        return room.getHost().getId().equals(user.getId())
                || roomMemberRepository.existsByRoomAndUser(room, user);
    }

    private RoomResponse toResponse(Room room) {
        long memberCount = roomMemberRepository.countByRoom(room);
        List<RoomResponse.QueueItemInfo> queue = room.getQueue().stream()
                .map(qi -> new RoomResponse.QueueItemInfo(qi.getId(), qi.getPosition(), qi.getTrack().getId()))
                .collect(Collectors.toList());
        return RoomResponse.builder()
                .id(room.getId())
                .name(room.getName())
                .hostId(room.getHost().getId())
                .hostUsername(room.getHost().getUsername())
                .currentTrackId(room.getCurrentTrack() != null ? room.getCurrentTrack().getId() : null)
                .positionSeconds(room.getPositionSeconds())
                .playing(room.isPlaying())
                .memberCount((int) memberCount)
                .maxMembers(room.getMaxMembers())
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
                .map(qi -> new RoomResponse.QueueItemInfo(qi.getId(), qi.getPosition(), qi.getTrack().getId()))
                .collect(Collectors.toList());
        return RoomResponse.builder()
                .id(room.getId())
                .name(room.getName())
                .hostId(room.getHost().getId())
                .hostUsername(room.getHost().getUsername())
                .currentTrackId(room.getCurrentTrack() != null ? room.getCurrentTrack().getId() : null)
                .positionSeconds(room.getPositionSeconds())
                .playing(room.isPlaying())
                .memberCount(members.size())
                .maxMembers(room.getMaxMembers())
                .createdAt(room.getCreatedAt())
                .updatedAt(room.getUpdatedAt())
                .queue(queue)
                .members(members)
                .build();
    }
}
