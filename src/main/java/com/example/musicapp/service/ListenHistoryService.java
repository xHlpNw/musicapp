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
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class ListenHistoryService {

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
    }

    @Transactional(readOnly = true)
    public Page<ListenHistoryItemResponse> getHistory(Long userId, Pageable pageable) {
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
