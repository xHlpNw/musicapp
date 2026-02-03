package com.example.musicapp.dto.track;

import com.example.musicapp.entity.AlbumArtistRole;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrackParticipantRequest {

    @NotNull(message = "Artist ID is required")
    private Long artistId;

    private int displayOrder;

    @NotNull(message = "Role is required")
    private AlbumArtistRole role;
}
