package com.example.musicapp.controller;

import com.example.musicapp.dto.playlist.*;
import com.example.musicapp.dto.track.TrackResponse;
import com.example.musicapp.entity.User;
import com.example.musicapp.security.SecurityUser;
import com.example.musicapp.service.PlaylistService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/playlists")
@RequiredArgsConstructor
public class PlaylistsController {

    private final PlaylistService playlistService;

    /** Все плейлисты (каталог). Опционально поиск по имени через q. */
    @GetMapping("/browse")
    public ResponseEntity<Page<PlaylistResponse>> browse(
            @RequestParam(required = false) String q,
            @PageableDefault(size = 24) Pageable pageable) {
        return ResponseEntity.ok(playlistService.findAllForBrowse(q, pageable));
    }

    @GetMapping
    public ResponseEntity<Page<PlaylistResponse>> findMy(
            @RequestParam(required = false) String q,
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal SecurityUser securityUser) {
        User user = securityUser.getUser();
        if (q != null && !q.isBlank()) {
            return ResponseEntity.ok(playlistService.search(q, user, pageable));
        }
        return ResponseEntity.ok(playlistService.findByOwner(user, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlaylistResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(playlistService.findById(id));
    }

    @PostMapping
    public ResponseEntity<PlaylistResponse> create(
            @Valid @RequestBody CreatePlaylistRequest request,
            @AuthenticationPrincipal SecurityUser securityUser) {
        User user = securityUser.getUser();
        PlaylistResponse response = playlistService.create(request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlaylistResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePlaylistRequest request,
            @AuthenticationPrincipal SecurityUser securityUser) {
        User user = securityUser.getUser();
        return ResponseEntity.ok(playlistService.update(id, request, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal SecurityUser securityUser) {
        User user = securityUser.getUser();
        playlistService.delete(id, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/cover")
    public ResponseEntity<PlaylistResponse> uploadCover(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal SecurityUser securityUser) {
        return ResponseEntity.ok(playlistService.uploadCover(id, file, securityUser.getUser()));
    }

    @GetMapping("/{id}/tracks")
    public ResponseEntity<List<TrackResponse>> getTracks(@PathVariable Long id) {
        return ResponseEntity.ok(playlistService.getTracks(id));
    }

    @PostMapping("/{id}/tracks")
    public ResponseEntity<Void> addTrack(
            @PathVariable Long id,
            @Valid @RequestBody AddTrackRequest request,
            @AuthenticationPrincipal SecurityUser securityUser) {
        User user = securityUser.getUser();
        playlistService.addTrack(id, request, user);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/tracks/{trackId}")
    public ResponseEntity<Void> removeTrack(
            @PathVariable Long id,
            @PathVariable Long trackId,
            @AuthenticationPrincipal SecurityUser securityUser) {
        User user = securityUser.getUser();
        playlistService.removeTrack(id, trackId, user);
        return ResponseEntity.noContent().build();
    }
}
