package com.example.musicapp.controller;

import com.example.musicapp.dto.album.AlbumResponse;
import com.example.musicapp.dto.album.AlbumSummaryResponse;
import com.example.musicapp.dto.album.CreateAlbumRequest;
import com.example.musicapp.dto.album.UpdateAlbumRequest;
import com.example.musicapp.service.AlbumService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/albums")
@RequiredArgsConstructor
public class AlbumsController {

    private final AlbumService albumService;

    @GetMapping
    public ResponseEntity<Page<AlbumSummaryResponse>> findAll(
            @RequestParam(required = false) String q,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(albumService.findAll(q, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AlbumResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(albumService.findById(id));
    }

    @GetMapping("/by-artist/{artistId}")
    public ResponseEntity<List<AlbumSummaryResponse>> findByArtistId(@PathVariable Long artistId) {
        return ResponseEntity.ok(albumService.findByArtistId(artistId));
    }

    @PostMapping
    public ResponseEntity<AlbumResponse> create(@Valid @RequestBody CreateAlbumRequest request) {
        AlbumResponse response = albumService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AlbumResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAlbumRequest request) {
        return ResponseEntity.ok(albumService.update(id, request));
    }
}
