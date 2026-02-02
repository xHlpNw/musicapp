package com.example.musicapp.repository;

import com.example.musicapp.entity.Playlist;
import com.example.musicapp.entity.PlaylistTrack;
import com.example.musicapp.entity.Track;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlaylistTrackRepository extends JpaRepository<PlaylistTrack, Long> {

    List<PlaylistTrack> findByPlaylistOrderByPositionAsc(Playlist playlist);

    Optional<PlaylistTrack> findByPlaylistAndTrack(Playlist playlist, Track track);

    void deleteByPlaylistAndTrack(Playlist playlist, Track track);

    int countByPlaylist(Playlist playlist);
}
