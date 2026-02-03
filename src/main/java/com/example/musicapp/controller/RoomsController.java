package com.example.musicapp.controller;

import com.example.musicapp.dto.room.CreateRoomRequest;
import com.example.musicapp.dto.room.RoomResponse;
import com.example.musicapp.dto.room.RoomStateRequest;
import com.example.musicapp.entity.User;
import com.example.musicapp.security.SecurityUser;
import com.example.musicapp.service.RoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomsController {

    private final RoomService roomService;

    @GetMapping
    public ResponseEntity<List<RoomResponse>> findMyRooms(
            @AuthenticationPrincipal SecurityUser securityUser) {
        User user = securityUser.getUser();
        return ResponseEntity.ok(roomService.findRoomsForUser(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoomResponse> findById(
            @PathVariable Long id,
            @AuthenticationPrincipal SecurityUser securityUser) {
        User user = securityUser.getUser();
        return ResponseEntity.ok(roomService.findById(id, user));
    }

    @PostMapping
    public ResponseEntity<RoomResponse> create(
            @Valid @RequestBody CreateRoomRequest request,
            @AuthenticationPrincipal SecurityUser securityUser) {
        User user = securityUser.getUser();
        RoomResponse response = roomService.create(request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<Void> join(
            @PathVariable Long id,
            @AuthenticationPrincipal SecurityUser securityUser) {
        User user = securityUser.getUser();
        roomService.join(id, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<Void> leave(
            @PathVariable Long id,
            @AuthenticationPrincipal SecurityUser securityUser) {
        User user = securityUser.getUser();
        roomService.leave(id, user);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/state")
    public ResponseEntity<RoomResponse> updateState(
            @PathVariable Long id,
            @Valid @RequestBody RoomStateRequest request,
            @AuthenticationPrincipal SecurityUser securityUser) {
        User user = securityUser.getUser();
        return ResponseEntity.ok(roomService.updateState(id, request, user));
    }

    @PostMapping("/{id}/queue")
    public ResponseEntity<Void> addToQueue(
            @PathVariable Long id,
            @RequestParam Long trackId,
            @AuthenticationPrincipal SecurityUser securityUser) {
        User user = securityUser.getUser();
        roomService.addToQueue(id, trackId, user);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/queue/{queueItemId}")
    public ResponseEntity<Void> removeFromQueue(
            @PathVariable Long id,
            @PathVariable Long queueItemId,
            @AuthenticationPrincipal SecurityUser securityUser) {
        User user = securityUser.getUser();
        roomService.removeFromQueue(id, queueItemId, user);
        return ResponseEntity.noContent().build();
    }
}
