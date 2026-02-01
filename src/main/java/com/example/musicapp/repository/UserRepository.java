package com.example.musicapp.repository;

import com.example.musicapp.entity.User;

import java.util.Optional;

public interface UserRepository extends org.springframework.data.jpa.repository.JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);
}
