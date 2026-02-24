package com.example.musicapp.controller;

import com.example.musicapp.dto.room.CreateRoomRequest;
import com.example.musicapp.dto.room.RoomResponse;
import com.example.musicapp.dto.room.RoomStateRequest;
import com.example.musicapp.dto.room.UpdateRoomRequest;
import com.example.musicapp.entity.User;
import com.example.musicapp.security.SecurityUser;
import com.example.musicapp.service.RoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomsController {

    private final RoomService roomService;

    /** Список комнат: filter=all|open|mine, q=поиск, page, size. */
    @GetMapping
    public ResponseEntity<Page<RoomResponse>> findRooms(
            @RequestParam(defaultValue = "all") String filter,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "24") int size,
            @AuthenticationPrincipal SecurityUser securityUser) {
        User user = securityUser.getUser();
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
        return ResponseEntity.ok(roomService.findRooms(filter, q, pageable, user));
    }

    /** Популярные комнаты (по числу участников). */
    @GetMapping("/popular")
    public ResponseEntity<List<RoomResponse>> findPopular(
            @RequestParam(defaultValue = "10") int limit,
            @AuthenticationPrincipal SecurityUser securityUser) {
        User user = securityUser.getUser();
        return ResponseEntity.ok(roomService.findPopular(limit, user));
    }

    /** Краткая информация о комнате (для не-участников). */
    @GetMapping("/{id}/summary")
    public ResponseEntity<RoomResponse> findSummary(
            @PathVariable Long id) {
        return ResponseEntity.ok(roomService.findByIdPublic(id));
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

    @PatchMapping("/{id}")
    public ResponseEntity<RoomResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRoomRequest request,
            @AuthenticationPrincipal SecurityUser securityUser) {
        User user = securityUser.getUser();
        return ResponseEntity.ok(roomService.update(id, request, user));
    }

    @PostMapping("/{id}/cover")
    public ResponseEntity<RoomResponse> uploadCover(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal SecurityUser securityUser) {
        User user = securityUser.getUser();
        return ResponseEntity.ok(roomService.uploadCover(id, file, user));
    }

    @DeleteMapping("/{id}/cover")
    public ResponseEntity<RoomResponse> deleteCover(
            @PathVariable Long id,
            @AuthenticationPrincipal SecurityUser securityUser) {
        User user = securityUser.getUser();
        return ResponseEntity.ok(roomService.deleteCover(id, user));
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
