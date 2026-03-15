package com.example.musicapp.service;

import com.example.musicapp.dto.album.*;
import com.example.musicapp.entity.Album;
import com.example.musicapp.entity.AlbumArtist;
import com.example.musicapp.entity.AlbumArtistRole;
import com.example.musicapp.entity.Artist;
import com.example.musicapp.entity.Genre;
import com.example.musicapp.exception.ResourceNotFoundException;
import com.example.musicapp.repository.AlbumRepository;
import com.example.musicapp.repository.ArtistRepository;
import com.example.musicapp.repository.GenreRepository;
import com.example.musicapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.Locale;
import java.util.Optional;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AlbumService {

    @Value("${app.storage.path:./storage}")
    private String storagePath;

    private Path albumsCoversDir;

    private final AlbumRepository albumRepository;
    private final ArtistRepository artistRepository;
    private final GenreRepository genreRepository;
    private final UserRepository userRepository;

    @PostConstruct
    public void initCoversDir() throws IOException {
        albumsCoversDir = Paths.get(storagePath).resolve("covers").resolve("albums").toAbsolutePath();
        Files.createDirectories(albumsCoversDir);
    }

    @Transactional
    public AlbumResponse uploadCover(Long id, MultipartFile file) {
        Album album = albumRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Album not found: " + id));
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }
        String ext = getImageExtension(file.getOriginalFilename()).orElse("jpg");
        String fileName = id + "." + ext;
        Path targetFile = albumsCoversDir.resolve(fileName);
        try {
            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Failed to save album cover", e);
        }
        String relativePath = "albums/" + fileName;
        album.setCoverImagePath(relativePath);
        album = albumRepository.save(album);
        return toDetailResponse(album);
    }

    private Optional<String> getImageExtension(String filename) {
        if (filename == null || filename.isBlank()) return Optional.empty();
        String lower = filename.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".jpeg") || lower.endsWith(".jpg")) return Optional.of("jpg");
        if (lower.endsWith(".png")) return Optional.of("png");
        if (lower.endsWith(".webp")) return Optional.of("webp");
        return Optional.empty();
    }

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
        return albumRepository.findByArtistIdOrderByReleaseDateDesc(artistId).stream()
                .map(this::toSummaryResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public AlbumResponse create(CreateAlbumRequest request) {
        validateAtLeastOnePrimary(request.getArtists());
        Album album = Album.builder()
                .title(request.getTitle())
                .releaseDate(request.getReleaseDate())
                .coverImagePath(request.getCoverImagePath())
                .createdAt(Instant.now())
                .artists(new ArrayList<>())
                .genres(new java.util.LinkedHashSet<>())
                .build();
        album = albumRepository.save(album);
        for (AlbumParticipantRequest pr : request.getArtists()) {
            Artist artist = artistRepository.findById(pr.getArtistId())
                    .orElseThrow(() -> new ResourceNotFoundException("Artist not found: " + pr.getArtistId()));
            AlbumArtist aa = AlbumArtist.builder()
                    .album(album)
                    .artist(artist)
                    .displayOrder(pr.getDisplayOrder())
                    .role(pr.getRole())
                    .build();
            album.getArtists().add(aa);
        }
        if (request.getGenreIds() != null && !request.getGenreIds().isEmpty()) {
            for (Long genreId : request.getGenreIds()) {
                Genre genre = genreRepository.findById(genreId)
                        .orElseThrow(() -> new ResourceNotFoundException("Genre not found: " + genreId));
                album.getGenres().add(genre);
            }
        }
        album = albumRepository.save(album);
        return toDetailResponse(album);
    }

    @Transactional
    public AlbumResponse update(Long id, UpdateAlbumRequest request) {
        Album album = albumRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Album not found: " + id));
        if (request.getTitle() != null) {
            album.setTitle(request.getTitle());
        }
        if (request.getReleaseDate() != null) {
            album.setReleaseDate(request.getReleaseDate());
        }
        if (request.getCoverImagePath() != null) {
            album.setCoverImagePath(request.getCoverImagePath());
        }
        if (request.getArtists() != null) {
            if (!request.getArtists().isEmpty()) {
                validateAtLeastOnePrimary(request.getArtists());
            }
            album.getArtists().clear();
            for (AlbumParticipantRequest pr : request.getArtists()) {
                Artist artist = artistRepository.findById(pr.getArtistId())
                        .orElseThrow(() -> new ResourceNotFoundException("Artist not found: " + pr.getArtistId()));
                AlbumArtist aa = AlbumArtist.builder()
                        .album(album)
                        .artist(artist)
                        .displayOrder(pr.getDisplayOrder())
                        .role(pr.getRole())
                        .build();
                album.getArtists().add(aa);
            }
        }
        if (request.getGenreIds() != null) {
            album.getGenres().clear();
            for (Long genreId : request.getGenreIds()) {
                Genre genre = genreRepository.findById(genreId)
                        .orElseThrow(() -> new ResourceNotFoundException("Genre not found: " + genreId));
                album.getGenres().add(genre);
            }
        }
        album = albumRepository.save(album);
        return toDetailResponse(album);
    }

    @Transactional
    public void delete(Long id) {
        if (!albumRepository.existsById(id)) {
            throw new ResourceNotFoundException("Album not found: " + id);
        }
        userRepository.removeAlbumFromAllFavorites(id);
        albumRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public Album findEntityById(Long id) {
        return albumRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Album not found: " + id));
    }

    private void validateAtLeastOnePrimary(List<AlbumParticipantRequest> artists) {
        boolean hasPrimary = artists.stream()
                .anyMatch(p -> p.getRole() == AlbumArtistRole.PRIMARY);
        if (!hasPrimary) {
            throw new IllegalArgumentException("At least one artist must have role PRIMARY");
        }
    }

    public AlbumSummaryResponse toSummaryResponse(Album album) {
        List<AlbumArtistItem> artistItems = album.getArtists().stream()
                .map(aa -> AlbumArtistItem.builder()
                        .artistId(aa.getArtist().getId())
                        .artistName(aa.getArtist().getName())
                        .displayOrder(aa.getDisplayOrder())
                        .role(aa.getRole())
                        .build())
                .collect(Collectors.toList());
        Set<Long> genreIds = album.getGenres().stream()
                .map(Genre::getId)
                .collect(Collectors.toSet());
        return AlbumSummaryResponse.builder()
                .id(album.getId())
                .title(album.getTitle())
                .releaseDate(album.getReleaseDate())
                .coverImagePath(album.getCoverImagePath())
                .artists(artistItems)
                .genreIds(genreIds)
                .build();
    }

    private AlbumResponse toDetailResponse(Album album) {
        List<AlbumArtistItem> artistItems = album.getArtists().stream()
                .map(aa -> AlbumArtistItem.builder()
                        .artistId(aa.getArtist().getId())
                        .artistName(aa.getArtist().getName())
                        .displayOrder(aa.getDisplayOrder())
                        .role(aa.getRole())
                        .build())
                .collect(Collectors.toList());
        Set<Long> genreIds = album.getGenres().stream()
                .map(Genre::getId)
                .collect(Collectors.toSet());
        return AlbumResponse.builder()
                .id(album.getId())
                .title(album.getTitle())
                .releaseDate(album.getReleaseDate())
                .coverImagePath(album.getCoverImagePath())
                .artists(artistItems)
                .genreIds(genreIds)
                .tracks(album.getAlbumTracks().stream()
                        .map(at -> new AlbumResponse.TrackSummary(
                                at.getTrack().getId(),
                                at.getTrack().getTitle(),
                                at.getTrack().getDurationSeconds(),
                                at.getPosition()))
                        .collect(Collectors.toList()))
                .build();
    }
}
