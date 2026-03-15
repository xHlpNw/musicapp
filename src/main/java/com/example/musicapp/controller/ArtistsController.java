package com.example.musicapp.controller;

import com.example.musicapp.dto.artist.ArtistResponse;
import com.example.musicapp.dto.artist.CreateArtistRequest;
import com.example.musicapp.dto.artist.UpdateArtistRequest;
import com.example.musicapp.dto.album.AlbumSummaryResponse;
import com.example.musicapp.service.ArtistService;
import com.example.musicapp.service.AlbumService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ArtistResponse> create(@Valid @RequestBody CreateArtistRequest request) {
        ArtistResponse response = artistService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ArtistResponse> update(@PathVariable Long id, @Valid @RequestBody UpdateArtistRequest request) {
        return ResponseEntity.ok(artistService.update(id, request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        artistService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(value = "/{id}/cover", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ArtistResponse> uploadCover(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(artistService.uploadCover(id, file));
    }
}
