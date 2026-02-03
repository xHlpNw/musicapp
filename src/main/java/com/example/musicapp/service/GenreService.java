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

import java.util.stream.Collectors;

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
        Genre parent = null;
        if (request.getParentId() != null) {
            parent = genreRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent genre not found: " + request.getParentId()));
        }
        Genre genre = Genre.builder()
                .name(request.getName().trim())
                .parent(parent)
                .build();
        genre = genreRepository.save(genre);
        return toResponse(genre);
    }

    @Transactional
    public GenreResponse update(Long id, UpdateGenreRequest request) {
        Genre genre = genreRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Genre not found: " + id));
        genre.setName(request.getName().trim());
        if (request.getParentId() != null) {
            Genre parent = genreRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent genre not found: " + request.getParentId()));
            if (parent.getId().equals(id)) {
                throw new IllegalArgumentException("Genre cannot be its own parent");
            }
            genre.setParent(parent);
        } else {
            genre.setParent(null);
        }
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
        Long parentId = genre.getParent() != null ? genre.getParent().getId() : null;
        var childrenIds = genre.getChildren().stream()
                .map(Genre::getId)
                .collect(Collectors.toList());
        return GenreResponse.builder()
                .id(genre.getId())
                .name(genre.getName())
                .parentId(parentId)
                .childrenIds(childrenIds)
                .build();
    }
}
