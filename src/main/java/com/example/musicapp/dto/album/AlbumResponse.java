package com.example.musicapp.dto.album;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlbumResponse {

    private Long id;
    private String title;
    private Integer releaseYear;
    private String coverImagePath;
    private Long artistId;
    private String artistName;
    private List<TrackSummary> tracks;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrackSummary {
        private Long id;
        private String title;
        private Integer durationSeconds;
        private Integer trackNumber;
    }
}
