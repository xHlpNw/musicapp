package com.example.musicapp.service;

import com.example.musicapp.dto.history.ListenHistoryItemResponse;
import com.example.musicapp.dto.track.TrackResponse;
import com.example.musicapp.entity.ListenHistory;
import com.example.musicapp.entity.Track;
import com.example.musicapp.entity.User;
import com.example.musicapp.repository.ListenHistoryRepository;
import com.example.musicapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ListenHistoryService {

    private static final int MAX_HISTORY_PER_USER = 50;

    private final ListenHistoryRepository listenHistoryRepository;
    private final TrackService trackService;
    private final UserRepository userRepository;

    @Transactional
    public void recordPlay(Long userId, Long trackId) {
        Track track = trackService.getEntityById(trackId);
        User user = userRepository.getReferenceById(userId);
        ListenHistory history = ListenHistory.builder()
                .user(user)
                .track(track)
                .playedAt(Instant.now())
                .build();
        listenHistoryRepository.save(history);
        doTrimHistoryToLimit(userId);
    }

    /** Логика обрезки: оставить только 50 последних. Без своей транзакции — выполняется в текущей. */
    private void doTrimHistoryToLimit(Long userId) {
        Page<ListenHistory> top50 = listenHistoryRepository.findByUserIdOrderByPlayedAtDesc(
                userId, PageRequest.of(0, MAX_HISTORY_PER_USER));
        if (top50.getTotalElements() > MAX_HISTORY_PER_USER) {
            Set<Long> keepIds = top50.getContent().stream()
                    .map(ListenHistory::getId)
                    .collect(Collectors.toSet());
            listenHistoryRepository.deleteByUserIdAndIdNotIn(userId, keepIds);
        }
    }

    /** Обрезка в отдельной транзакции (для вызова из read-only getHistory). */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void trimHistoryToLimit(Long userId) {
        doTrimHistoryToLimit(userId);
    }

    @Transactional(readOnly = true)
    public Page<ListenHistoryItemResponse> getHistory(Long userId, Pageable pageable) {
        trimHistoryToLimit(userId);
        return listenHistoryRepository.findByUserIdOrderByPlayedAtDesc(userId, pageable)
                .map(lh -> {
                    TrackResponse trackResponse = trackService.findById(lh.getTrack().getId());
                    return ListenHistoryItemResponse.builder()
                            .id(lh.getId())
                            .playedTrack(trackResponse)
                            .playedAt(lh.getPlayedAt())
                            .build();
                });
    }
}
