package com.example.musicapp.dto.album;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
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
public class UpdateAlbumRequest {

    @Size(max = 255)
    private String title;

    private LocalDate releaseDate;

    @Size(max = 500)
    private String coverImagePath;

    @Valid
    private List<AlbumParticipantRequest> artists;

    private Set<Long> genreIds;
}
