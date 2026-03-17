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
public class UpdateTrackRequest {

    @NotNull
    @Size(max = 255)
    private String title;

    @NotNull
    private Integer durationSeconds;

    @NotNull
    private Long albumId;

    @NotNull
    private Integer position;

    @NotEmpty
    @Valid
    private List<TrackParticipantRequest> artists;

    private Set<Long> genreIds;
}
