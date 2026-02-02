package com.example.musicapp.dto.playlist;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdatePlaylistRequest {

    @Size(max = 255)
    private String name;

    @Size(max = 2000)
    private String description;
}
