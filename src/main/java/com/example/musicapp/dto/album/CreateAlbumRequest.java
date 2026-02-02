package com.example.musicapp.dto.album;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateAlbumRequest {

    @NotNull(message = "Artist ID is required")
    private Long artistId;

    @NotNull(message = "Title is required")
    @Size(max = 255)
    private String title;

    private Integer releaseYear;

    @Size(max = 500)
    private String coverImagePath;
}
