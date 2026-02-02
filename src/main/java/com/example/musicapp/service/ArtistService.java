package com.example.musicapp.service;

import com.example.musicapp.dto.artist.ArtistResponse;
import com.example.musicapp.dto.artist.CreateArtistRequest;
import com.example.musicapp.entity.Artist;
import com.example.musicapp.exception.ResourceNotFoundException;
import com.example.musicapp.repository.ArtistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ArtistService {

    private final ArtistRepository artistRepository;

    @Transactional(readOnly = true)
    public Page<ArtistResponse> findAll(String q, Pageable pageable) {
        if (q != null && !q.isBlank()) {
            return artistRepository.findByNameContainingIgnoreCase(q.trim(), pageable)
                    .map(this::toResponse);
        }
        return artistRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public ArtistResponse findById(Long id) {
        Artist artist = artistRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Artist not found: " + id));
        return toDetailResponse(artist);
    }

    @Transactional
    public ArtistResponse create(CreateArtistRequest request) {
        Artist artist = Artist.builder()
                .name(request.getName())
                .description(request.getDescription())
                .coverImagePath(request.getCoverImagePath())
                .createdAt(Instant.now())
                .build();
        artist = artistRepository.save(artist);
        return toResponse(artist);
    }

    @Transactional(readOnly = true)
    public Artist findEntityById(Long id) {
        return artistRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Artist not found: " + id));
    }

    @Transactional(readOnly = true)
    public Artist findOrCreateByName(String name) {
        return artistRepository.findByNameIgnoreCase(name.trim())
                .orElseGet(() -> {
                    Artist artist = Artist.builder()
                            .name(name.trim())
                            .createdAt(Instant.now())
                            .build();
                    return artistRepository.save(artist);
                });
    }

    private ArtistResponse toResponse(Artist artist) {
        return ArtistResponse.builder()
                .id(artist.getId())
                .name(artist.getName())
                .description(artist.getDescription())
                .coverImagePath(artist.getCoverImagePath())
                .albums(null)
                .build();
    }

    private ArtistResponse toDetailResponse(Artist artist) {
        return ArtistResponse.builder()
                .id(artist.getId())
                .name(artist.getName())
                .description(artist.getDescription())
                .coverImagePath(artist.getCoverImagePath())
                .albums(artist.getAlbums().stream()
                        .map(a -> new ArtistResponse.AlbumSummary(
                                a.getId(),
                                a.getTitle(),
                                a.getReleaseYear()))
                        .collect(Collectors.toList()))
                .build();
    }
}
