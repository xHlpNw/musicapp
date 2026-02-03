package com.example.musicapp.dto.track;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrackResponse {

    private Long id;
    private String title;
    private Integer durationSeconds;
    private String mimeType;
    private String coverImagePath;
    private List<TrackArtistItem> artists;
    private List<AlbumTrackItem> albumTracks;
    private Set<Long> genreIds;
}
