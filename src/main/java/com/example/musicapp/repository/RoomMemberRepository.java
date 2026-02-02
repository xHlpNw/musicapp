package com.example.musicapp.repository;

import com.example.musicapp.entity.Room;
import com.example.musicapp.entity.RoomMember;
import com.example.musicapp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoomMemberRepository extends JpaRepository<RoomMember, Long> {

    List<RoomMember> findByRoomOrderByJoinedAtAsc(Room room);

    Optional<RoomMember> findByRoomAndUser(Room room, User user);

    boolean existsByRoomAndUser(Room room, User user);

    void deleteByRoomAndUser(Room room, User user);

    long countByRoom(Room room);

    Optional<RoomMember> findByUser(User user);
}
