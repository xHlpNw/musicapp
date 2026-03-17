package com.example.musicapp.dto.album;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AddTrackToAlbumRequest {
    @NotNull
    private Long trackId;

    @NotNull
    @Min(1)
    private Integer position;
}
