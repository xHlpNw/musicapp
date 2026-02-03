package com.example.musicapp.dto.track;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlbumTrackItem {

    private Long albumId;
    private String albumTitle;
    private int position;
}
