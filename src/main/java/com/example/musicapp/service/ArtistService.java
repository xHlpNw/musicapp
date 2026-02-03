package com.example.musicapp.service;

import com.example.musicapp.dto.artist.ArtistResponse;
import com.example.musicapp.dto.artist.CreateArtistRequest;
import com.example.musicapp.entity.Artist;
import com.example.musicapp.entity.Genre;
import com.example.musicapp.exception.ResourceNotFoundException;
import com.example.musicapp.repository.ArtistRepository;
import com.example.musicapp.repository.GenreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.musicapp.entity.Album;

import java.time.Instant;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ArtistService {

    private final ArtistRepository artistRepository;
    private final GenreRepository genreRepository;

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
        if (request.getGenreIds() != null && !request.getGenreIds().isEmpty()) {
            for (Long genreId : request.getGenreIds()) {
                Genre genre = genreRepository.findById(genreId)
                        .orElseThrow(() -> new ResourceNotFoundException("Genre not found: " + genreId));
                artist.getGenres().add(genre);
            }
            artist = artistRepository.save(artist);
        }
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

    public ArtistResponse toResponse(Artist artist) {
        Set<Long> genreIds = artist.getGenres().stream()
                .map(Genre::getId)
                .collect(Collectors.toSet());
        return ArtistResponse.builder()
                .id(artist.getId())
                .name(artist.getName())
                .description(artist.getDescription())
                .coverImagePath(artist.getCoverImagePath())
                .albums(null)
                .genreIds(genreIds)
                .build();
    }

    private ArtistResponse toDetailResponse(Artist artist) {
        Set<Long> genreIds = artist.getGenres().stream()
                .map(Genre::getId)
                .collect(Collectors.toSet());
        Set<Long> seenAlbumIds = new HashSet<>();
        List<ArtistResponse.AlbumSummary> albumSummaries = artist.getAlbumParticipations().stream()
                .map(ap -> ap.getAlbum())
                .filter(a -> seenAlbumIds.add(a.getId()))
                .sorted(Comparator.comparing(Album::getReleaseDate).reversed())
                .map(a -> new ArtistResponse.AlbumSummary(
                        a.getId(),
                        a.getTitle(),
                        a.getReleaseDate()))
                .collect(Collectors.toList());
        return ArtistResponse.builder()
                .id(artist.getId())
                .name(artist.getName())
                .description(artist.getDescription())
                .coverImagePath(artist.getCoverImagePath())
                .albums(albumSummaries)
                .genreIds(genreIds)
                .build();
    }
}
