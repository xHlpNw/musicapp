package com.example.musicapp.service;

import com.example.musicapp.dto.album.AlbumSummaryResponse;
import com.example.musicapp.dto.artist.ArtistResponse;
import com.example.musicapp.dto.playlist.PlaylistResponse;
import com.example.musicapp.dto.track.TrackResponse;
import com.example.musicapp.entity.*;
import com.example.musicapp.exception.ResourceNotFoundException;
import com.example.musicapp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FavoritesService {

    private final UserRepository userRepository;
    private final TrackRepository trackRepository;
    private final AlbumRepository albumRepository;
    private final ArtistRepository artistRepository;
    private final PlaylistRepository playlistRepository;
    private final TrackService trackService;
    private final AlbumService albumService;
    private final ArtistService artistService;
    private final PlaylistService playlistService;

    @Transactional(readOnly = true)
    public List<TrackResponse> getFavoriteTracks(User user) {
        User u = userRepository.findByIdWithFavoriteTracks(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return u.getFavoriteTracks().stream()
                .map(trackService::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AlbumSummaryResponse> getFavoriteAlbums(User user) {
        User u = userRepository.findByIdWithFavoriteAlbums(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return u.getFavoriteAlbums().stream()
                .map(albumService::toSummaryResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ArtistResponse> getFavoriteArtists(User user) {
        User u = userRepository.findByIdWithFavoriteArtists(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return u.getFavoriteArtists().stream()
                .map(artistService::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PlaylistResponse> getFavoritePlaylists(User user) {
        User u = userRepository.findByIdWithFavoritePlaylists(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return u.getFavoritePlaylists().stream()
                .map(playlistService::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void addFavoriteTrack(Long trackId, User user) {
        Track track = trackRepository.findById(trackId)
                .orElseThrow(() -> new ResourceNotFoundException("Track not found: " + trackId));
        User u = userRepository.findByIdWithFavoriteTracks(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        u.getFavoriteTracks().add(track);
        userRepository.save(u);
    }

    @Transactional
    public void removeFavoriteTrack(Long trackId, User user) {
        Track track = trackRepository.findById(trackId)
                .orElseThrow(() -> new ResourceNotFoundException("Track not found: " + trackId));
        User u = userRepository.findByIdWithFavoriteTracks(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        u.getFavoriteTracks().remove(track);
        userRepository.save(u);
    }

    @Transactional
    public void addFavoriteAlbum(Long albumId, User user) {
        Album album = albumRepository.findById(albumId)
                .orElseThrow(() -> new ResourceNotFoundException("Album not found: " + albumId));
        User u = userRepository.findByIdWithFavoriteAlbums(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        u.getFavoriteAlbums().add(album);
        userRepository.save(u);
    }

    @Transactional
    public void removeFavoriteAlbum(Long albumId, User user) {
        Album album = albumRepository.findById(albumId)
                .orElseThrow(() -> new ResourceNotFoundException("Album not found: " + albumId));
        User u = userRepository.findByIdWithFavoriteAlbums(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        u.getFavoriteAlbums().remove(album);
        userRepository.save(u);
    }

    @Transactional
    public void addFavoriteArtist(Long artistId, User user) {
        Artist artist = artistRepository.findById(artistId)
                .orElseThrow(() -> new ResourceNotFoundException("Artist not found: " + artistId));
        User u = userRepository.findByIdWithFavoriteArtists(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        u.getFavoriteArtists().add(artist);
        userRepository.save(u);
    }

    @Transactional
    public void removeFavoriteArtist(Long artistId, User user) {
        Artist artist = artistRepository.findById(artistId)
                .orElseThrow(() -> new ResourceNotFoundException("Artist not found: " + artistId));
        User u = userRepository.findByIdWithFavoriteArtists(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        u.getFavoriteArtists().remove(artist);
        userRepository.save(u);
    }

    @Transactional
    public void addFavoritePlaylist(Long playlistId, User user) {
        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new ResourceNotFoundException("Playlist not found: " + playlistId));
        User u = userRepository.findByIdWithFavoritePlaylists(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        u.getFavoritePlaylists().add(playlist);
        userRepository.save(u);
    }

    @Transactional
    public void removeFavoritePlaylist(Long playlistId, User user) {
        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new ResourceNotFoundException("Playlist not found: " + playlistId));
        User u = userRepository.findByIdWithFavoritePlaylists(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        u.getFavoritePlaylists().remove(playlist);
        userRepository.save(u);
    }
}
