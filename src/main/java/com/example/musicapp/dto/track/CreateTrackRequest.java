package com.example.musicapp.dto.track;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTrackRequest {

    @NotNull(message = "Title is required")
    @Size(max = 255)
    private String title;

    private Long artistId;

    @Size(max = 255)
    private String artistName;

    private Long albumId;

    private Integer trackNumber;

    @NotNull(message = "Duration in seconds is required")
    private Integer durationSeconds;

    private Set<Long> genreIds;
}
