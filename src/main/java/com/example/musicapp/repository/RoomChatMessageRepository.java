package com.example.musicapp.repository;

import com.example.musicapp.entity.Room;
import com.example.musicapp.entity.RoomChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface RoomChatMessageRepository extends JpaRepository<RoomChatMessage, Long> {

    @Query("select m from RoomChatMessage m where m.room = :room order by m.createdAt desc")
    List<RoomChatMessage> findRecentByRoom(Room room, Pageable pageable);
}

