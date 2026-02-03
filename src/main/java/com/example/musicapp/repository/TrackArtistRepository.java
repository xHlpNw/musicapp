package com.example.musicapp.repository;

import com.example.musicapp.entity.Artist;
import com.example.musicapp.entity.Track;
import com.example.musicapp.entity.TrackArtist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TrackArtistRepository extends JpaRepository<TrackArtist, Long> {

    List<TrackArtist> findByTrackOrderByDisplayOrderAsc(Track track);

    List<TrackArtist> findByArtistOrderByDisplayOrderAsc(Artist artist);

    boolean existsByTrackAndArtist(Track track, Artist artist);
}
