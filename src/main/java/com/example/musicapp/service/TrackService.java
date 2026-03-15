package com.example.musicapp.service;

import com.example.musicapp.dto.track.AlbumTrackItem;
import com.example.musicapp.dto.track.CreateTrackRequest;
import com.example.musicapp.dto.track.TrackArtistItem;
import com.example.musicapp.dto.track.TrackResponse;
import com.example.musicapp.dto.track.UpdateTrackRequest;
import com.example.musicapp.entity.Album;
import com.example.musicapp.entity.AlbumTrack;
import com.example.musicapp.entity.AlbumArtistRole;
import com.example.musicapp.entity.Artist;
import com.example.musicapp.entity.Genre;
import com.example.musicapp.entity.Track;
import com.example.musicapp.entity.TrackArtist;
import com.example.musicapp.entity.User;
import com.example.musicapp.exception.ResourceNotFoundException;
import com.example.musicapp.repository.AlbumRepository;
import com.example.musicapp.repository.AlbumTrackRepository;
import com.example.musicapp.repository.GenreRepository;
import com.example.musicapp.repository.ListenHistoryRepository;
import com.example.musicapp.repository.RoomQueueItemRepository;
import com.example.musicapp.repository.RoomRepository;
import com.example.musicapp.repository.TrackArtistRepository;
import com.example.musicapp.repository.TrackRepository;
import com.example.musicapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TrackService {

    private static final Logger log = LoggerFactory.getLogger(TrackService.class);
    private final TrackRepository trackRepository;
    private final ArtistService artistService;
    private final AlbumRepository albumRepository;
    private final AlbumTrackRepository albumTrackRepository;
    private final TrackArtistRepository trackArtistRepository;
    private final GenreRepository genreRepository;
    private final UserRepository userRepository;
    private final ListenHistoryRepository listenHistoryRepository;
    private final RoomRepository roomRepository;
    private final RoomQueueItemRepository roomQueueItemRepository;

    @Value("${app.storage.path:./storage}")
    private String storagePath;

    private Path tracksDir;

    @PostConstruct
    public void init() throws IOException {
        tracksDir = Paths.get(storagePath).resolve("tracks").toAbsolutePath();
        Files.createDirectories(tracksDir);
    }

    @Transactional(readOnly = true)
    public Page<TrackResponse> findAll(String q, Pageable pageable) {
        if (q != null && !q.isBlank()) {
            return trackRepository.findByTitleContainingIgnoreCase(q.trim(), pageable)
                    .map(this::toResponse);
        }
        return trackRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public TrackResponse findById(Long id) {
        Track track = trackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Track not found: " + id));
        return toResponse(track);
    }

    @Transactional
    public TrackResponse upload(MultipartFile file, CreateTrackRequest request, User currentUser) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }
        validateAtLeastOnePrimary(request.getArtists());
        Album album = albumRepository.findById(request.getAlbumId())
                .orElseThrow(() -> new ResourceNotFoundException("Album not found: " + request.getAlbumId()));

        String ext = getExtension(file.getOriginalFilename()).orElse("bin");
        String fileName = UUID.randomUUID() + "." + ext;
        Path targetFile = tracksDir.resolve(fileName);
        try {
            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Failed to save file", e);
        }
        String mimeType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
        String filePath = targetFile.toAbsolutePath().toString();

        Track track = Track.builder()
                .title(request.getTitle())
                .durationSeconds(request.getDurationSeconds())
                .uploadedBy(currentUser)
                .filePath(filePath)
                .mimeType(mimeType)
                .createdAt(Instant.now())
                .albumTracks(new ArrayList<>())
                .artists(new ArrayList<>())
                .genres(new java.util.LinkedHashSet<>())
                .build();
        track = trackRepository.save(track);

        AlbumTrack at = AlbumTrack.builder()
                .album(album)
                .track(track)
                .position(request.getPosition())
                .build();
        albumTrackRepository.save(at);
        track.getAlbumTracks().add(at);

        for (var pr : request.getArtists()) {
            Artist artist = artistService.findEntityById(pr.getArtistId());
            TrackArtist ta = TrackArtist.builder()
                    .track(track)
                    .artist(artist)
                    .displayOrder(pr.getDisplayOrder())
                    .role(pr.getRole())
                    .build();
            trackArtistRepository.save(ta);
            track.getArtists().add(ta);
        }

        if (request.getGenreIds() != null && !request.getGenreIds().isEmpty()) {
            for (Long genreId : request.getGenreIds()) {
                Genre genre = genreRepository.findById(genreId)
                        .orElseThrow(() -> new ResourceNotFoundException("Genre not found: " + genreId));
                track.getGenres().add(genre);
            }
            track = trackRepository.save(track);
        }
        return toResponse(track);
    }

    /**
     * Заменить аудиофайл трека (путь и mime обновляются; метаданные — отдельным update).
     */
    @Transactional
    public TrackResponse replaceAudioFile(Long id, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }
        Track track = trackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Track not found: " + id));
        String oldPathStr = track.getFilePath();

        String ext = getExtension(file.getOriginalFilename()).orElse("bin");
        String fileName = UUID.randomUUID() + "." + ext;
        Path targetFile = tracksDir.resolve(fileName);
        try {
            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Failed to save file", e);
        }

        try {
            Path oldResolved = resolveTrackPath(oldPathStr);
            Path newAbs = targetFile.toAbsolutePath().normalize();
            if (Files.exists(oldResolved) && !oldResolved.normalize().equals(newAbs)) {
                Files.deleteIfExists(oldResolved);
            }
        } catch (IOException e) {
            log.warn("Could not delete old track file: {}", e.getMessage());
        }

        String mimeType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
        track.setFilePath(targetFile.toAbsolutePath().toString());
        track.setMimeType(mimeType);
        return toResponse(trackRepository.save(track));
    }

    @Transactional
    public TrackResponse update(Long id, UpdateTrackRequest request) {
        Track track = trackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Track not found: " + id));
        validateAtLeastOnePrimary(request.getArtists());
        Album album = albumRepository.findById(request.getAlbumId())
                .orElseThrow(() -> new ResourceNotFoundException("Album not found: " + request.getAlbumId()));

        track.setTitle(request.getTitle());
        track.setDurationSeconds(request.getDurationSeconds());

        track.getAlbumTracks().clear();
        trackRepository.flush();
        AlbumTrack at = AlbumTrack.builder()
                .album(album)
                .track(track)
                .position(request.getPosition())
                .build();
        albumTrackRepository.save(at);
        track.getAlbumTracks().add(at);

        track.getArtists().clear();
        trackRepository.flush();
        for (var pr : request.getArtists()) {
            Artist artist = artistService.findEntityById(pr.getArtistId());
            TrackArtist ta = TrackArtist.builder()
                    .track(track)
                    .artist(artist)
                    .displayOrder(pr.getDisplayOrder())
                    .role(pr.getRole())
                    .build();
            trackArtistRepository.save(ta);
            track.getArtists().add(ta);
        }
        return toResponse(trackRepository.save(track));
    }

    @Transactional
    public void delete(Long id) {
        Track track = trackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Track not found: " + id));
        userRepository.removeTrackFromAllFavorites(id);
        listenHistoryRepository.deleteByTrack_Id(id);
        roomRepository.clearCurrentTrackByTrackId(id);
        roomQueueItemRepository.deleteByTrackId(id);
        try {
            Path path = resolveTrackPath(track.getFilePath());
            Files.deleteIfExists(path);
        } catch (IOException e) {
            log.warn("Could not delete track file: {}", e.getMessage());
        }
        trackRepository.delete(track);
    }

    private void validateAtLeastOnePrimary(List<com.example.musicapp.dto.track.TrackParticipantRequest> artists) {
        long n = artists.stream().filter(p -> p.getRole() == AlbumArtistRole.PRIMARY).count();
        if (n != 1) {
            throw new IllegalArgumentException("Exactly one artist must have role PRIMARY");
        }
    }

    @Transactional(readOnly = true)
    public Resource getStreamResource(Long trackId) {
        return getStreamResourceAndMimeType(trackId).resource();
    }

    @Transactional(readOnly = true)
    public StreamResult getStreamResourceAndMimeType(Long trackId) {
        Track track = trackRepository.findById(trackId)
                .orElseThrow(() -> new ResourceNotFoundException("Track not found: " + trackId));
        Path path = resolveTrackPath(track.getFilePath());
        if (!Files.exists(path)) {
            log.warn("Track file not found: {} (resolved to {})", track.getFilePath(), path.toAbsolutePath());
            throw new ResourceNotFoundException("Track file not found");
        }
        try {
            return new StreamResult(new UrlResource(path.toUri()), track.getMimeType());
        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("Invalid track path");
        }
    }

    public record StreamResult(Resource resource, String mimeType) {}

    @Transactional(readOnly = true)
    public Track getEntityById(Long id) {
        return trackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Track not found: " + id));
    }

    /** Относительный путь (например из data.sql) разрешается относительно каталога треков. */
    private Path resolveTrackPath(String filePath) {
        Path p = Paths.get(filePath);
        return p.isAbsolute() ? p : tracksDir.resolve(p).normalize();
    }

    private Optional<String> getExtension(String filename) {
        if (filename == null || filename.indexOf('.') < 0) return Optional.empty();
        return Optional.of(filename.substring(filename.lastIndexOf('.') + 1));
    }

    public TrackResponse toResponse(Track track) {
        List<TrackArtistItem> artistItems = track.getArtists().stream()
                .map(ta -> TrackArtistItem.builder()
                        .artistId(ta.getArtist().getId())
                        .artistName(ta.getArtist().getName())
                        .displayOrder(ta.getDisplayOrder())
                        .role(ta.getRole())
                        .build())
                .collect(Collectors.toList());
        List<AlbumTrackItem> albumTrackItems = track.getAlbumTracks().stream()
                .map(at -> AlbumTrackItem.builder()
                        .albumId(at.getAlbum().getId())
                        .albumTitle(at.getAlbum().getTitle())
                        .position(at.getPosition())
                        .build())
                .collect(Collectors.toList());
        Set<Long> genreIds = track.getGenres().stream()
                .map(Genre::getId)
                .collect(Collectors.toSet());
        return TrackResponse.builder()
                .id(track.getId())
                .title(track.getTitle())
                .durationSeconds(track.getDurationSeconds())
                .mimeType(track.getMimeType())
                .coverImagePath(track.getCoverImagePath())
                .artists(artistItems)
                .albumTracks(albumTrackItems)
                .genreIds(genreIds)
                .build();
    }
}
