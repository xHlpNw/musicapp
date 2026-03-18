package com.example.musicapp.dto.artist;

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
public class ArtistResponse {

    private Long id;
    private String name;
    private String description;
    private String coverImagePath;
    private List<AlbumSummary> albums;
    private Set<Long> genreIds;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AlbumSummary {
        private Long id;
        private String title;
        private LocalDate releaseDate;
        private String coverImagePath;
    }
}
