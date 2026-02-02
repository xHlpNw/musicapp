package com.example.musicapp.repository;

import com.example.musicapp.entity.Artist;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ArtistRepository extends JpaRepository<Artist, Long> {

    Page<Artist> findByNameContainingIgnoreCase(String name, Pageable pageable);

    Optional<Artist> findByNameIgnoreCase(String name);
}
