package com.example.musicapp.dto.artist;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateArtistRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 255)
    private String name;

    @Size(max = 2000)
    private String description;

    @Size(max = 500)
    private String coverImagePath;
}
