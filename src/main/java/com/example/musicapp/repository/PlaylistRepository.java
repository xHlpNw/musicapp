package com.example.musicapp.repository;

import com.example.musicapp.entity.Playlist;
import com.example.musicapp.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlaylistRepository extends JpaRepository<Playlist, Long> {

    List<Playlist> findByOwnerOrderByCreatedAtDesc(User owner);

    Page<Playlist> findByOwner(User owner, Pageable pageable);

    Page<Playlist> findByNameContainingIgnoreCase(String name, Pageable pageable);

    Page<Playlist> findByOwnerAndNameContainingIgnoreCase(User owner, String name, Pageable pageable);

    Page<Playlist> findAllByOrderByCreatedAtDesc(Pageable pageable);

    boolean existsByIdAndOwner(Long id, User owner);
}
