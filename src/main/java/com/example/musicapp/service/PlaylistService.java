package com.example.musicapp.service;

import com.example.musicapp.dto.playlist.*;
import com.example.musicapp.dto.track.TrackResponse;
import com.example.musicapp.entity.Playlist;
import com.example.musicapp.entity.PlaylistTrack;
import com.example.musicapp.entity.Track;
import com.example.musicapp.entity.User;
import com.example.musicapp.exception.ForbiddenException;
import com.example.musicapp.exception.ResourceNotFoundException;
import com.example.musicapp.repository.PlaylistRepository;
import com.example.musicapp.repository.PlaylistTrackRepository;
import com.example.musicapp.repository.TrackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.beans.factory.annotation.Value;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlaylistService {

    @Value("${app.storage.path:./storage}")
    private String storagePath;

    private Path playlistsCoversDir;

    private final PlaylistRepository playlistRepository;
    private final PlaylistTrackRepository playlistTrackRepository;
    private final TrackRepository trackRepository;
    private final TrackService trackService;

    @Transactional(readOnly = true)
    public Page<PlaylistResponse> findAll(Pageable pageable) {
        return playlistRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<PlaylistResponse> findByOwner(User owner, Pageable pageable) {
        return playlistRepository.findByOwner(owner, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<PlaylistResponse> search(String q, User owner, Pageable pageable) {
        if (q != null && !q.isBlank()) {
            return playlistRepository.findByOwnerAndNameContainingIgnoreCase(owner, q.trim(), pageable)
                    .map(this::toResponse);
        }
        return playlistRepository.findByOwner(owner, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public PlaylistResponse findById(Long id) {
        Playlist playlist = playlistRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Playlist not found: " + id));
        return toDetailResponse(playlist);
    }

    @Transactional
    public PlaylistResponse create(CreatePlaylistRequest request, User currentUser) {
        Playlist playlist = Playlist.builder()
                .name(request.getName())
                .description(request.getDescription())
                .owner(currentUser)
                .createdAt(Instant.now())
                .build();
        playlist = playlistRepository.save(playlist);
        return toResponse(playlist);
    }

    @Transactional
    public PlaylistResponse update(Long id, UpdatePlaylistRequest request, User currentUser) {
        Playlist playlist = playlistRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Playlist not found: " + id));
        if (!playlist.getOwner().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Not the owner of this playlist");
        }
        if (request.getName() != null) {
            playlist.setName(request.getName());
        }
        if (request.getDescription() != null) {
            playlist.setDescription(request.getDescription());
        }
        playlist = playlistRepository.save(playlist);
        return toDetailResponse(playlist);
    }

    @PostConstruct
    public void init() throws IOException {
        playlistsCoversDir = Paths.get(storagePath).resolve("covers").resolve("playlists").toAbsolutePath();
        Files.createDirectories(playlistsCoversDir);
    }

    @Transactional
    public void delete(Long id, User currentUser) {
        Playlist playlist = playlistRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Playlist not found: " + id));
        if (!playlist.getOwner().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Not the owner of this playlist");
        }
        playlistRepository.delete(playlist);
    }

    @Transactional
    public PlaylistResponse uploadCover(Long id, MultipartFile file, User currentUser) {
        Playlist playlist = playlistRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Playlist not found: " + id));
        if (!playlist.getOwner().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Not the owner of this playlist");
        }
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }
        String ext = getImageExtension(file.getOriginalFilename()).orElse("jpg");
        String fileName = id + "." + ext;
        Path targetFile = playlistsCoversDir.resolve(fileName);
        try {
            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Failed to save cover", e);
        }
        String relativePath = "playlists/" + fileName;
        playlist.setCoverImagePath(relativePath);
        playlistRepository.save(playlist);
        return toDetailResponse(playlist);
    }

    private Optional<String> getImageExtension(String filename) {
        if (filename == null || filename.isBlank()) return Optional.empty();
        String lower = filename.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".jpeg") || lower.endsWith(".jpg")) return Optional.of("jpg");
        if (lower.endsWith(".png")) return Optional.of("png");
        if (lower.endsWith(".webp")) return Optional.of("webp");
        return Optional.empty();
    }

    @Transactional
    public void addTrack(Long playlistId, AddTrackRequest request, User currentUser) {
        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new ResourceNotFoundException("Playlist not found: " + playlistId));
        if (!playlist.getOwner().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Not the owner of this playlist");
        }
        Track track = trackRepository.findById(request.getTrackId())
                .orElseThrow(() -> new ResourceNotFoundException("Track not found: " + request.getTrackId()));

        if (playlistTrackRepository.findByPlaylistAndTrack(playlist, track).isPresent()) {
            return;
        }

        List<PlaylistTrack> items = new ArrayList<>(playlistTrackRepository.findByPlaylistOrderByPositionAsc(playlist));
        int insertPosition = request.getPosition() != null
                ? Math.min(Math.max(0, request.getPosition()), items.size())
                : items.size();
        for (int i = insertPosition; i < items.size(); i++) {
            items.get(i).setPosition(i + 1);
        }
        if (insertPosition < items.size()) {
            playlistTrackRepository.saveAll(items.subList(insertPosition, items.size()));
        }

        PlaylistTrack pt = PlaylistTrack.builder()
                .playlist(playlist)
                .track(track)
                .position(insertPosition)
                .build();
        playlistTrackRepository.save(pt);
    }

    @Transactional
    public void removeTrack(Long playlistId, Long trackId, User currentUser) {
        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new ResourceNotFoundException("Playlist not found: " + playlistId));
        if (!playlist.getOwner().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Not the owner of this playlist");
        }
        Track track = trackRepository.findById(trackId)
                .orElseThrow(() -> new ResourceNotFoundException("Track not found: " + trackId));
        playlistTrackRepository.deleteByPlaylistAndTrack(playlist, track);

        List<PlaylistTrack> remaining = playlistTrackRepository.findByPlaylistOrderByPositionAsc(playlist);
        for (int i = 0; i < remaining.size(); i++) {
            remaining.get(i).setPosition(i);
            playlistTrackRepository.save(remaining.get(i));
        }
    }

    @Transactional(readOnly = true)
    public List<TrackResponse> getTracks(Long playlistId) {
        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new ResourceNotFoundException("Playlist not found: " + playlistId));
        return playlistTrackRepository.findByPlaylistOrderByPositionAsc(playlist).stream()
                .map(pt -> trackService.toResponse(pt.getTrack()))
                .collect(Collectors.toList());
    }

    public PlaylistResponse toResponse(Playlist playlist) {
        int count = playlistTrackRepository.countByPlaylist(playlist);
        return PlaylistResponse.builder()
                .id(playlist.getId())
                .name(playlist.getName())
                .description(playlist.getDescription())
                .coverImagePath(playlist.getCoverImagePath())
                .ownerId(playlist.getOwner().getId())
                .ownerUsername(playlist.getOwner().getUsername())
                .trackCount(count)
                .tracks(null)
                .build();
    }

    private PlaylistResponse toDetailResponse(Playlist playlist) {
        List<TrackResponse> tracks = playlistTrackRepository.findByPlaylistOrderByPositionAsc(playlist).stream()
                .map(pt -> trackService.toResponse(pt.getTrack()))
                .collect(Collectors.toList());
        return PlaylistResponse.builder()
                .id(playlist.getId())
                .name(playlist.getName())
                .description(playlist.getDescription())
                .coverImagePath(playlist.getCoverImagePath())
                .ownerId(playlist.getOwner().getId())
                .ownerUsername(playlist.getOwner().getUsername())
                .tracks(tracks)
                .trackCount(tracks.size())
                .build();
    }

}
