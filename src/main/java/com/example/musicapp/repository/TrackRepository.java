package com.example.musicapp.repository;

import com.example.musicapp.entity.Track;
import com.example.musicapp.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TrackRepository extends JpaRepository<Track, Long> {

    Page<Track> findByTitleContainingIgnoreCase(String title, Pageable pageable);

    Page<Track> findByUploadedBy(User user, Pageable pageable);
}
