package com.example.musicapp.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rooms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Версия для optimistic locking — предотвращает потерянные обновления при параллельных запросах. */
    @Version
    private Long version;

    @Column(nullable = false)
    private String name;

    @Column(name = "position_seconds", nullable = false)
    @Builder.Default
    private double positionSeconds = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private boolean playing = false;

    @Column(name = "max_members")
    private Integer maxMembers;

    @Column(name = "cover_image_path")
    private String coverImagePath;

    /**
     * Монотонно возрастающий счётчик: инкрементируется при каждом структурном
     * изменении комнаты (состояние, очередь, участники).
     * Клиент отбрасывает WS-сообщения с revision <= уже применённой.
     */
    @Column(name = "state_revision", nullable = false)
    @Builder.Default
    private long stateRevision = 0;

    /**
     * Серверное время (epochMilli) последнего изменения positionSeconds
     * или флага playing. Позволяет клиенту вычислить актуальную позицию
     * как positionSeconds + (now - baseServerTimeMs) / 1000 когда playing=true.
     */
    @Column(name = "base_server_time_ms")
    private Long baseServerTimeMs;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "host_id", nullable = false)
    private User host;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_track_id")
    private Track currentTrack;

    /** Элемент очереди, который сейчас играет (однозначно при нескольких копиях одного трека). */
    @Column(name = "current_queue_item_id")
    private Long currentQueueItemId;

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position ASC")
    @Builder.Default
    private List<RoomQueueItem> queue = new ArrayList<>();

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<RoomMember> members = new ArrayList<>();
}
