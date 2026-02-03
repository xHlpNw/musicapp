package com.example.musicapp.repository;

import com.example.musicapp.entity.Room;
import com.example.musicapp.entity.RoomQueueItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoomQueueItemRepository extends JpaRepository<RoomQueueItem, Long> {

    List<RoomQueueItem> findByRoomOrderByPositionAsc(Room room);
}
