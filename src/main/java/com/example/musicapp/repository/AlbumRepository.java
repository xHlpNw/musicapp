package com.example.musicapp.repository;

import com.example.musicapp.entity.Album;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AlbumRepository extends JpaRepository<Album, Long> {

    Page<Album> findByTitleContainingIgnoreCase(String title, Pageable pageable);

    @Query("SELECT DISTINCT a FROM Album a JOIN a.artists aa WHERE aa.artist.id = :artistId ORDER BY a.releaseDate DESC")
    List<Album> findByArtistIdOrderByReleaseDateDesc(@Param("artistId") Long artistId);
}
