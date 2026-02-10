package com.example.musicapp.repository;

import com.example.musicapp.entity.ListenHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ListenHistoryRepository extends JpaRepository<ListenHistory, Long> {

    Page<ListenHistory> findByUserIdOrderByPlayedAtDesc(Long userId, Pageable pageable);
}
