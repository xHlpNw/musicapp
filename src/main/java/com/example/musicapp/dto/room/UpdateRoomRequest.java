package com.example.musicapp.dto.room;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateRoomRequest {

    @Size(max = 255)
    private String name;

    private Integer maxMembers;
}
