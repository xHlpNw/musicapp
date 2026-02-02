package com.example.musicapp.dto.album;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlbumSummaryResponse {

    private Long id;
    private String title;
    private Integer releaseYear;
    private String coverImagePath;
    private Long artistId;
    private String artistName;
}
