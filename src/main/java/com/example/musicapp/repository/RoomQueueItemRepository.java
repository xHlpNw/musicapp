package com.example.musicapp.repository;

import com.example.musicapp.entity.Room;
import com.example.musicapp.entity.RoomQueueItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RoomQueueItemRepository extends JpaRepository<RoomQueueItem, Long> {

    List<RoomQueueItem> findByRoomOrderByPositionAsc(Room room);

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM RoomQueueItem q WHERE q.track.id = :trackId")
    void deleteByTrackId(@Param("trackId") Long trackId);
}
