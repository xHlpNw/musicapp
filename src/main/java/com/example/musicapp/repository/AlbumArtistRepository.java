package com.example.musicapp.repository;

import com.example.musicapp.entity.Album;
import com.example.musicapp.entity.AlbumArtist;
import com.example.musicapp.entity.Artist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlbumArtistRepository extends JpaRepository<AlbumArtist, Long> {

    List<AlbumArtist> findByAlbumOrderByDisplayOrderAsc(Album album);

    List<AlbumArtist> findByArtistOrderByDisplayOrderAsc(Artist artist);

    boolean existsByAlbumAndArtist(Album album, Artist artist);
}
