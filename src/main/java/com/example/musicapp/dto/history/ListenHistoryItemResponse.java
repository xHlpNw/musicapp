package com.example.musicapp.dto.history;

import com.example.musicapp.dto.track.TrackResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListenHistoryItemResponse {

    private Long id;
    private TrackResponse playedTrack;
    private Instant playedAt;
}
