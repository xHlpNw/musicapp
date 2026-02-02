package com.example.musicapp.dto.room;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomStateRequest {

    private Long currentTrackId;
    private Double positionSeconds;
    private Boolean playing;
}
