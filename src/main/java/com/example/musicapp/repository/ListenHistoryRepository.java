package com.example.musicapp.repository;

import com.example.musicapp.entity.ListenHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;

public interface ListenHistoryRepository extends JpaRepository<ListenHistory, Long> {

    Page<ListenHistory> findByUserIdOrderByPlayedAtDesc(Long userId, Pageable pageable);

    /** Удалить записи пользователя, id которых не входят в переданный список (для ограничения истории 50 записями). */
    void deleteByUserIdAndIdNotIn(Long userId, Collection<Long> ids);
}
