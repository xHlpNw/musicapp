package com.example.musicapp.controller;

import com.example.musicapp.dto.genre.CreateGenreRequest;
import com.example.musicapp.dto.genre.GenreResponse;
import com.example.musicapp.dto.genre.UpdateGenreRequest;
import com.example.musicapp.service.GenreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/genres")
@RequiredArgsConstructor
public class GenresController {

    private final GenreService genreService;

    @GetMapping
    public ResponseEntity<Page<GenreResponse>> findAll(
            @RequestParam(required = false) String q,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(genreService.findAll(q, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GenreResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(genreService.findById(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<GenreResponse> create(@Valid @RequestBody CreateGenreRequest request) {
        GenreResponse response = genreService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<GenreResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateGenreRequest request) {
        return ResponseEntity.ok(genreService.update(id, request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        genreService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
