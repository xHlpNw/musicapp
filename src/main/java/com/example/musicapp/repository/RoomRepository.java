package com.example.musicapp.repository;

import com.example.musicapp.entity.Room;
import com.example.musicapp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Long> {

    List<Room> findByHostOrderByCreatedAtDesc(User host);

    List<Room> findByMembersUserOrderByCreatedAtDesc(User user);
}
