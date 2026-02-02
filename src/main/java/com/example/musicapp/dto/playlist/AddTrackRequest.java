package com.example.musicapp.dto.playlist;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddTrackRequest {

    @NotNull(message = "Track ID is required")
    private Long trackId;

    private Integer position;
}
