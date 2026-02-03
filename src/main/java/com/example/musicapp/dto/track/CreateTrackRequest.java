package com.example.musicapp.dto.track;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTrackRequest {

    @NotNull(message = "Title is required")
    @Size(max = 255)
    private String title;

    @NotNull(message = "Album ID is required")
    private Long albumId;

    @NotNull(message = "Position in album is required")
    private Integer position;

    @NotEmpty(message = "At least one artist is required")
    @Valid
    private List<TrackParticipantRequest> artists;

    @NotNull(message = "Duration in seconds is required")
    private Integer durationSeconds;

    private Set<Long> genreIds;
}
