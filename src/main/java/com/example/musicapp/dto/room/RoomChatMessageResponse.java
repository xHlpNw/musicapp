package com.example.musicapp.dto.room;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomChatMessageResponse {

    private Long id;
    private Long roomId;
    private Long userId;
    private String username;
    private boolean host;
    private String text;
    private Instant createdAt;
}

