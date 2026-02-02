package com.example.musicapp.dto.room;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomResponse {

    private Long id;
    private String name;
    private Long hostId;
    private String hostUsername;
    private Long currentTrackId;
    private Double positionSeconds;
    private Boolean playing;
    private Integer memberCount;
    private Integer maxMembers;
    private List<MemberInfo> members;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MemberInfo {
        private Long userId;
        private String username;
    }
}
