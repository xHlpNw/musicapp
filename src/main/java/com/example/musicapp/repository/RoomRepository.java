package com.example.musicapp.repository;

import com.example.musicapp.entity.Room;
import com.example.musicapp.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Long> {

    List<Room> findByHostOrderByCreatedAtDesc(User host);

    List<Room> findByMembersUserOrderByCreatedAtDesc(User user);

    Page<Room> findAll(Pageable pageable);

    Page<Room> findByNameContainingIgnoreCaseOrHost_UsernameContainingIgnoreCase(String name, String hostUsername, Pageable pageable);

    /** Комнаты, в которые можно войти (нет лимита или есть свободные места). */
    @Query("SELECT r FROM Room r WHERE r.maxMembers IS NULL OR (SELECT COUNT(m) FROM RoomMember m WHERE m.room = r) < r.maxMembers")
    Page<Room> findOpenRooms(Pageable pageable);

    @Query("SELECT r FROM Room r WHERE (r.maxMembers IS NULL OR (SELECT COUNT(m) FROM RoomMember m WHERE m.room = r) < r.maxMembers) AND (LOWER(r.name) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(r.host.username) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<Room> findOpenRoomsWithSearch(@Param("q") String q, Pageable pageable);

    @Query(value = "SELECT r FROM Room r LEFT JOIN r.members m GROUP BY r ORDER BY COUNT(m) DESC",
           countQuery = "SELECT COUNT(r) FROM Room r")
    Page<Room> findPopularRooms(Pageable pageable);
}
