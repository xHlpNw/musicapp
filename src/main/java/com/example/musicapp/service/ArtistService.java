package com.example.musicapp.service;

import com.example.musicapp.dto.artist.ArtistResponse;
import com.example.musicapp.dto.artist.CreateArtistRequest;
import com.example.musicapp.dto.artist.UpdateArtistRequest;
import com.example.musicapp.entity.Artist;
import com.example.musicapp.entity.Genre;
import com.example.musicapp.exception.ResourceNotFoundException;
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
import com.example.musicapp.entity.Album;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ArtistService {

    @Value("${app.storage.path:./storage}")
    private String storagePath;

    private Path artistsCoversDir;

    private final ArtistRepository artistRepository;
    private final GenreRepository genreRepository;
    private final UserRepository userRepository;

    @PostConstruct
    public void init() throws IOException {
        artistsCoversDir = Paths.get(storagePath).resolve("covers").resolve("artists").toAbsolutePath();
        Files.createDirectories(artistsCoversDir);
    }

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

    @Transactional
    public ArtistResponse update(Long id, UpdateArtistRequest request) {
        Artist artist = artistRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Artist not found: " + id));
        artist.setName(request.getName());
        artist.setDescription(request.getDescription());
        artist.setCoverImagePath(request.getCoverImagePath());
        if (request.getGenreIds() != null) {
            artist.getGenres().clear();
            for (Long genreId : request.getGenreIds()) {
                Genre genre = genreRepository.findById(genreId)
                        .orElseThrow(() -> new ResourceNotFoundException("Genre not found: " + genreId));
                artist.getGenres().add(genre);
            }
        }
        artist = artistRepository.save(artist);
        return toResponse(artist);
    }

    @Transactional
    public void delete(Long id) {
        if (!artistRepository.existsById(id)) {
            throw new ResourceNotFoundException("Artist not found: " + id);
        }
        userRepository.removeArtistFromAllFavorites(id);
        artistRepository.deleteById(id);
    }

    @Transactional
    public ArtistResponse uploadCover(Long id, MultipartFile file) {
        Artist artist = artistRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Artist not found: " + id));
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }
        String ext = getImageExtension(file.getOriginalFilename()).orElse("jpg");
        String fileName = id + "." + ext;
        Path targetFile = artistsCoversDir.resolve(fileName);
        try {
            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Failed to save cover", e);
        }
        String relativePath = "artists/" + fileName;
        artist.setCoverImagePath(relativePath);
        artistRepository.save(artist);
        return toResponse(artist);
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
