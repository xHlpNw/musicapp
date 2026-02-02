package com.example.musicapp.dto.playlist;

import com.example.musicapp.dto.track.TrackResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlaylistResponse {

    private Long id;
    private String name;
    private String description;
    private Long ownerId;
    private String ownerUsername;
    private List<TrackResponse> tracks;
    private int trackCount;
}
