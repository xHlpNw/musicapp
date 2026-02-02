package com.example.musicapp.service;

import com.example.musicapp.dto.track.CreateTrackRequest;
import com.example.musicapp.dto.track.TrackResponse;
import com.example.musicapp.entity.Album;
import com.example.musicapp.entity.Artist;
import com.example.musicapp.entity.Track;
import com.example.musicapp.entity.User;
import com.example.musicapp.exception.ResourceNotFoundException;
import com.example.musicapp.repository.AlbumRepository;
import com.example.musicapp.repository.TrackRepository;
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
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TrackService {

    private static final Logger log = LoggerFactory.getLogger(TrackService.class);
    private final TrackRepository trackRepository;
    private final ArtistService artistService;
    private final AlbumRepository albumRepository;

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
        Artist artist = resolveArtist(request.getArtistId(), request.getArtistName());
        Album album = null;
        if (request.getAlbumId() != null) {
            album = albumRepository.findById(request.getAlbumId())
                    .orElseThrow(() -> new ResourceNotFoundException("Album not found: " + request.getAlbumId()));
            if (!album.getArtist().getId().equals(artist.getId())) {
                throw new IllegalArgumentException("Album does not belong to the selected artist");
            }
        }

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
                .artist(artist)
                .album(album)
                .trackNumber(request.getTrackNumber())
                .uploadedBy(currentUser)
                .filePath(filePath)
                .mimeType(mimeType)
                .createdAt(Instant.now())
                .build();
        track = trackRepository.save(track);

        return toResponse(track);
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

    private Artist resolveArtist(Long artistId, String artistName) {
        if (artistId != null) {
            return artistService.findEntityById(artistId);
        }
        if (artistName != null && !artistName.isBlank()) {
            return artistService.findOrCreateByName(artistName.trim());
        }
        throw new IllegalArgumentException("Either artistId or artistName is required");
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
        return TrackResponse.builder()
                .id(track.getId())
                .title(track.getTitle())
                .durationSeconds(track.getDurationSeconds())
                .mimeType(track.getMimeType())
                .trackNumber(track.getTrackNumber())
                .artistId(track.getArtist().getId())
                .artistName(track.getArtist().getName())
                .albumId(track.getAlbum() != null ? track.getAlbum().getId() : null)
                .albumTitle(track.getAlbum() != null ? track.getAlbum().getTitle() : null)
                .build();
    }
}
