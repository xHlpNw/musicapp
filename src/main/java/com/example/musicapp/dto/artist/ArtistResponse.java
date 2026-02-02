package com.example.musicapp.dto.artist;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ArtistResponse {

    private Long id;
    private String name;
    private String description;
    private String coverImagePath;
    private List<AlbumSummary> albums;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AlbumSummary {
        private Long id;
        private String title;
        private Integer releaseYear;
    }
}
