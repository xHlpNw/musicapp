package com.example.musicapp.dto.track;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private Integer trackNumber;
    private Long artistId;
    private String artistName;
    private Long albumId;
    private String albumTitle;
    private Set<Long> genreIds;
}
