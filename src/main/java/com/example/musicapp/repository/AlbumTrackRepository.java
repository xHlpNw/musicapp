package com.example.musicapp.repository;

import com.example.musicapp.entity.Album;
import com.example.musicapp.entity.AlbumTrack;
import com.example.musicapp.entity.Track;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AlbumTrackRepository extends JpaRepository<AlbumTrack, Long> {

    List<AlbumTrack> findByAlbumOrderByPositionAsc(Album album);

    List<AlbumTrack> findByTrackOrderByPositionAsc(Track track);

    Optional<AlbumTrack> findByAlbumAndTrack(Album album, Track track);

    boolean existsByAlbumAndTrack(Album album, Track track);
}
