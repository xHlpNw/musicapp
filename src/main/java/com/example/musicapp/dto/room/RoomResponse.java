package com.example.musicapp.dto.room;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
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
    /** Id элемента очереди, который сейчас играет (если есть — однозначно при дубликатах трека). */
    private Long currentQueueItemId;
    private String currentTrackTitle;
    private String currentTrackCoverPath;
    private String currentTrackArtistName;
    private Double positionSeconds;
    private Boolean playing;
    private Integer memberCount;
    private Integer maxMembers;
    /** Обложка комнаты (путь относительно covers/). Если null — показывать обложку текущего трека. */
    private String coverImagePath;
    /** Участник ли текущий пользователь (хост или в списке участников). */
    private Boolean isMember;
    private Instant createdAt;
    private Instant updatedAt;
    private List<QueueItemInfo> queue;
    private List<MemberInfo> members;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MemberInfo {
        private Long userId;
        private String username;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QueueItemInfo {
        private Long id;
        private int position;
        private Long trackId;
        private String trackTitle;
        private String trackArtistName;
        private Integer durationSeconds;
        private String trackCoverPath;
    }
}
