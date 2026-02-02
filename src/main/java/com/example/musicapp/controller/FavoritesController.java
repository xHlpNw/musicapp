package com.example.musicapp.controller;

import com.example.musicapp.dto.album.AlbumSummaryResponse;
import com.example.musicapp.dto.artist.ArtistResponse;
import com.example.musicapp.dto.playlist.PlaylistResponse;
import com.example.musicapp.dto.track.TrackResponse;
import com.example.musicapp.entity.User;
import com.example.musicapp.security.SecurityUser;
import com.example.musicapp.service.FavoritesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoritesController {

    private final FavoritesService favoritesService;

    @GetMapping("/tracks")
    public ResponseEntity<List<TrackResponse>> getFavoriteTracks(
            @AuthenticationPrincipal SecurityUser securityUser) {
        User user = securityUser.getUser();
        return ResponseEntity.ok(favoritesService.getFavoriteTracks(user));
    }

    @GetMapping("/albums")
    public ResponseEntity<List<AlbumSummaryResponse>> getFavoriteAlbums(
            @AuthenticationPrincipal SecurityUser securityUser) {
        User user = securityUser.getUser();
        return ResponseEntity.ok(favoritesService.getFavoriteAlbums(user));
    }

    @GetMapping("/artists")
    public ResponseEntity<List<ArtistResponse>> getFavoriteArtists(
            @AuthenticationPrincipal SecurityUser securityUser) {
        User user = securityUser.getUser();
        return ResponseEntity.ok(favoritesService.getFavoriteArtists(user));
    }

    @GetMapping("/playlists")
    public ResponseEntity<List<PlaylistResponse>> getFavoritePlaylists(
            @AuthenticationPrincipal SecurityUser securityUser) {
        User user = securityUser.getUser();
        return ResponseEntity.ok(favoritesService.getFavoritePlaylists(user));
    }

    @PostMapping("/tracks/{id}")
    public ResponseEntity<Void> addFavoriteTrack(
            @PathVariable Long id,
            @AuthenticationPrincipal SecurityUser securityUser) {
        User user = securityUser.getUser();
        favoritesService.addFavoriteTrack(id, user);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @DeleteMapping("/tracks/{id}")
    public ResponseEntity<Void> removeFavoriteTrack(
            @PathVariable Long id,
            @AuthenticationPrincipal SecurityUser securityUser) {
        User user = securityUser.getUser();
        favoritesService.removeFavoriteTrack(id, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/albums/{id}")
    public ResponseEntity<Void> addFavoriteAlbum(
            @PathVariable Long id,
            @AuthenticationPrincipal SecurityUser securityUser) {
        User user = securityUser.getUser();
        favoritesService.addFavoriteAlbum(id, user);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @DeleteMapping("/albums/{id}")
    public ResponseEntity<Void> removeFavoriteAlbum(
            @PathVariable Long id,
            @AuthenticationPrincipal SecurityUser securityUser) {
        User user = securityUser.getUser();
        favoritesService.removeFavoriteAlbum(id, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/artists/{id}")
    public ResponseEntity<Void> addFavoriteArtist(
            @PathVariable Long id,
            @AuthenticationPrincipal SecurityUser securityUser) {
        User user = securityUser.getUser();
        favoritesService.addFavoriteArtist(id, user);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @DeleteMapping("/artists/{id}")
    public ResponseEntity<Void> removeFavoriteArtist(
            @PathVariable Long id,
            @AuthenticationPrincipal SecurityUser securityUser) {
        User user = securityUser.getUser();
        favoritesService.removeFavoriteArtist(id, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/playlists/{id}")
    public ResponseEntity<Void> addFavoritePlaylist(
            @PathVariable Long id,
            @AuthenticationPrincipal SecurityUser securityUser) {
        User user = securityUser.getUser();
        favoritesService.addFavoritePlaylist(id, user);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @DeleteMapping("/playlists/{id}")
    public ResponseEntity<Void> removeFavoritePlaylist(
            @PathVariable Long id,
            @AuthenticationPrincipal SecurityUser securityUser) {
        User user = securityUser.getUser();
        favoritesService.removeFavoritePlaylist(id, user);
        return ResponseEntity.noContent().build();
    }
}
