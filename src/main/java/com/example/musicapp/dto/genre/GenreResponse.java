package com.example.musicapp.dto.genre;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GenreResponse {

    private Long id;
    private String name;
    private Long parentId;
    private List<Long> childrenIds;
}
