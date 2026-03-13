package com.example.musicapp.dto.room;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateRoomChatMessageRequest {

    @NotBlank
    private String text;
}

