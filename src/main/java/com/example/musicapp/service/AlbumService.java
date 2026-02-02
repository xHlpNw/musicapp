package com.example.musicapp.service;

import com.example.musicapp.dto.album.AlbumResponse;
import com.example.musicapp.dto.album.AlbumSummaryResponse;
import com.example.musicapp.dto.album.CreateAlbumRequest;
import com.example.musicapp.entity.Album;
import com.example.musicapp.entity.Artist;
import com.example.musicapp.exception.ResourceNotFoundException;
import com.example.musicapp.repository.AlbumRepository;
import com.example.musicapp.repository.ArtistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AlbumService {

    private final AlbumRepository albumRepository;
    private final ArtistRepository artistRepository;

    @Transactional(readOnly = true)
    public Page<AlbumSummaryResponse> findAll(String q, Pageable pageable) {
        if (q != null && !q.isBlank()) {
            return albumRepository.findByTitleContainingIgnoreCase(q.trim(), pageable)
                    .map(this::toSummaryResponse);
        }
        return albumRepository.findAll(pageable).map(this::toSummaryResponse);
    }

    @Transactional(readOnly = true)
    public AlbumResponse findById(Long id) {
        Album album = albumRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Album not found: " + id));
        return toDetailResponse(album);
    }

    @Transactional(readOnly = true)
    public List<AlbumSummaryResponse> findByArtistId(Long artistId) {
        if (!artistRepository.existsById(artistId)) {
            throw new ResourceNotFoundException("Artist not found: " + artistId);
        }
        return albumRepository.findByArtistIdOrderByReleaseYearDesc(artistId).stream()
                .map(this::toSummaryResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public AlbumResponse create(CreateAlbumRequest request) {
        Artist artist = artistRepository.findById(request.getArtistId())
                .orElseThrow(() -> new ResourceNotFoundException("Artist not found: " + request.getArtistId()));
        Album album = Album.builder()
                .title(request.getTitle())
                .releaseYear(request.getReleaseYear())
                .coverImagePath(request.getCoverImagePath())
                .artist(artist)
                .createdAt(Instant.now())
                .build();
        album = albumRepository.save(album);
        return toDetailResponse(album);
    }

    @Transactional(readOnly = true)
    public Album findEntityById(Long id) {
        return albumRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Album not found: " + id));
    }

    private AlbumSummaryResponse toSummaryResponse(Album album) {
        return AlbumSummaryResponse.builder()
                .id(album.getId())
                .title(album.getTitle())
                .releaseYear(album.getReleaseYear())
                .coverImagePath(album.getCoverImagePath())
                .artistId(album.getArtist().getId())
                .artistName(album.getArtist().getName())
                .build();
    }

    private AlbumResponse toDetailResponse(Album album) {
        return AlbumResponse.builder()
                .id(album.getId())
                .title(album.getTitle())
                .releaseYear(album.getReleaseYear())
                .coverImagePath(album.getCoverImagePath())
                .artistId(album.getArtist().getId())
                .artistName(album.getArtist().getName())
                .tracks(album.getTracks().stream()
                        .map(t -> new AlbumResponse.TrackSummary(
                                t.getId(),
                                t.getTitle(),
                                t.getDurationSeconds(),
                                t.getTrackNumber()))
                        .collect(Collectors.toList()))
                .build();
    }
}
