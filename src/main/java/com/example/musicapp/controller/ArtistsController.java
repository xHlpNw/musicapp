package com.example.musicapp.controller;

import com.example.musicapp.dto.artist.ArtistResponse;
import com.example.musicapp.dto.artist.CreateArtistRequest;
import com.example.musicapp.dto.album.AlbumSummaryResponse;
import com.example.musicapp.service.ArtistService;
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
@RequestMapping("/api/artists")
@RequiredArgsConstructor
public class ArtistsController {

    private final ArtistService artistService;
    private final AlbumService albumService;

    @GetMapping
    public ResponseEntity<Page<ArtistResponse>> findAll(
            @RequestParam(required = false) String q,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(artistService.findAll(q, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ArtistResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(artistService.findById(id));
    }

    @GetMapping("/{id}/albums")
    public ResponseEntity<List<AlbumSummaryResponse>> getAlbums(@PathVariable Long id) {
        return ResponseEntity.ok(albumService.findByArtistId(id));
    }

    @PostMapping
    public ResponseEntity<ArtistResponse> create(@Valid @RequestBody CreateArtistRequest request) {
        ArtistResponse response = artistService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
