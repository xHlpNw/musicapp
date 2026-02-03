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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlaylistService {

    private final PlaylistRepository playlistRepository;
    private final PlaylistTrackRepository playlistTrackRepository;
    private final TrackRepository trackRepository;
    private final TrackService trackService;

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
    public PlaylistResponse findById(Long id, User currentUser) {
        Playlist playlist = playlistRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Playlist not found: " + id));
        if (!playlist.getOwner().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Not the owner of this playlist");
        }
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
    public List<TrackResponse> getTracks(Long playlistId, User currentUser) {
        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new ResourceNotFoundException("Playlist not found: " + playlistId));
        if (!playlist.getOwner().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Not the owner of this playlist");
        }
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
                .ownerId(playlist.getOwner().getId())
                .ownerUsername(playlist.getOwner().getUsername())
                .tracks(tracks)
                .trackCount(tracks.size())
                .build();
    }

}
