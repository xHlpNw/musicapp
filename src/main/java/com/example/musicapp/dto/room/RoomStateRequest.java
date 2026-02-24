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
    /** Id элемента очереди (при переключении по очереди — однозначно задаёт текущий трек при дубликатах). */
    private Long queueItemId;
    private Double positionSeconds;
    private Boolean playing;
}
