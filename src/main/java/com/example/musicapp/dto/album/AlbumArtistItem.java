package com.example.musicapp.dto.album;

import com.example.musicapp.entity.AlbumArtistRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlbumArtistItem {

    private Long artistId;
    private String artistName;
    private int displayOrder;
    private AlbumArtistRole role;
}
