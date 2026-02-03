package com.example.musicapp.dto.album;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateAlbumRequest {

    @NotNull(message = "Title is required")
    @Size(max = 255)
    private String title;

    @NotNull(message = "Release date is required")
    private LocalDate releaseDate;

    @Size(max = 500)
    private String coverImagePath;

    @NotEmpty(message = "At least one artist is required")
    @Valid
    private List<AlbumParticipantRequest> artists;

    private Set<Long> genreIds;
}
