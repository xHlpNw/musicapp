package com.example.musicapp.dto.album;

import com.example.musicapp.dto.track.TrackArtistItem;
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
public class AlbumResponse {

    private Long id;
    private String title;
    private LocalDate releaseDate;
    private String coverImagePath;
    private List<AlbumArtistItem> artists;
    private Set<Long> genreIds;
    private List<TrackSummary> tracks;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TrackSummary {
        private Long id;
        private String title;
        private Integer durationSeconds;
        private Integer position;
        private List<TrackArtistItem> artists;
    }
}
