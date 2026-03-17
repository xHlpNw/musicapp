package com.example.musicapp.repository;

import com.example.musicapp.entity.Album;
import com.example.musicapp.entity.AlbumArtist;
import com.example.musicapp.entity.Artist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AlbumArtistRepository extends JpaRepository<AlbumArtist, Long> {

    List<AlbumArtist> findByAlbumOrderByDisplayOrderAsc(Album album);

    List<AlbumArtist> findByArtistOrderByDisplayOrderAsc(Artist artist);

    boolean existsByAlbumAndArtist(Album album, Artist artist);

    /** ID альбомов, где данный артист — единственный исполнитель. */
    @Query("SELECT aa.album.id FROM AlbumArtist aa WHERE aa.artist.id = :artistId " +
           "AND (SELECT COUNT(aa2) FROM AlbumArtist aa2 WHERE aa2.album = aa.album) = 1")
    List<Long> findAlbumIdsWhereArtistIsOnly(@Param("artistId") Long artistId);

    /** Удаляет все записи AlbumArtist для данного артиста. */
    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM AlbumArtist aa WHERE aa.artist.id = :artistId")
    void deleteByArtistId(@Param("artistId") Long artistId);
}
