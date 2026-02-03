package com.example.musicapp.service;

import com.example.musicapp.dto.genre.CreateGenreRequest;
import com.example.musicapp.dto.genre.GenreResponse;
import com.example.musicapp.dto.genre.UpdateGenreRequest;
import com.example.musicapp.entity.Genre;
import com.example.musicapp.exception.ResourceNotFoundException;
import com.example.musicapp.repository.GenreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GenreService {

    private final GenreRepository genreRepository;

    @Transactional(readOnly = true)
    public Page<GenreResponse> findAll(String q, Pageable pageable) {
        if (q != null && !q.isBlank()) {
            return genreRepository.findByNameContainingIgnoreCase(q.trim(), pageable)
                    .map(this::toResponse);
        }
        return genreRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public GenreResponse findById(Long id) {
        Genre genre = genreRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Genre not found: " + id));
        return toResponse(genre);
    }

    @Transactional
    public GenreResponse create(CreateGenreRequest request) {
        Genre genre = Genre.builder()
                .name(request.getName().trim())
                .build();
        genre = genreRepository.save(genre);
        return toResponse(genre);
    }

    @Transactional
    public GenreResponse update(Long id, UpdateGenreRequest request) {
        Genre genre = genreRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Genre not found: " + id));
        genre.setName(request.getName().trim());
        genre = genreRepository.save(genre);
        return toResponse(genre);
    }

    @Transactional
    public void delete(Long id) {
        if (!genreRepository.existsById(id)) {
            throw new ResourceNotFoundException("Genre not found: " + id);
        }
        genreRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public Genre findEntityById(Long id) {
        return genreRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Genre not found: " + id));
    }

    private GenreResponse toResponse(Genre genre) {
        return GenreResponse.builder()
                .id(genre.getId())
                .name(genre.getName())
                .build();
    }
}
