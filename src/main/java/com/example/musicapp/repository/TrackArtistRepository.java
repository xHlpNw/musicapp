package com.example.musicapp.repository;

import com.example.musicapp.entity.Artist;
import com.example.musicapp.entity.Track;
import com.example.musicapp.entity.TrackArtist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TrackArtistRepository extends JpaRepository<TrackArtist, Long> {

    List<TrackArtist> findByTrackOrderByDisplayOrderAsc(Track track);

    List<TrackArtist> findByArtistOrderByDisplayOrderAsc(Artist artist);

    boolean existsByTrackAndArtist(Track track, Artist artist);

    /** ID треков, где данный артист — единственный исполнитель. */
    @Query("SELECT ta.track.id FROM TrackArtist ta WHERE ta.artist.id = :artistId " +
           "AND (SELECT COUNT(ta2) FROM TrackArtist ta2 WHERE ta2.track = ta.track) = 1")
    List<Long> findTrackIdsWhereArtistIsOnly(@Param("artistId") Long artistId);

    /** Удаляет все записи TrackArtist для данного артиста. */
    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM TrackArtist ta WHERE ta.artist.id = :artistId")
    void deleteByArtistId(@Param("artistId") Long artistId);
}
