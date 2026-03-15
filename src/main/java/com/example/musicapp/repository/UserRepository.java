package com.example.musicapp.repository;

import com.example.musicapp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.favoriteTracks WHERE u.id = :id")
    Optional<User> findByIdWithFavoriteTracks(@Param("id") Long id);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.favoriteAlbums WHERE u.id = :id")
    Optional<User> findByIdWithFavoriteAlbums(@Param("id") Long id);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.favoriteArtists WHERE u.id = :id")
    Optional<User> findByIdWithFavoriteArtists(@Param("id") Long id);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.favoritePlaylists WHERE u.id = :id")
    Optional<User> findByIdWithFavoritePlaylists(@Param("id") Long id);

    @Modifying(clearAutomatically = true)
    @Query(value = "DELETE FROM user_favorite_artists WHERE artist_id = :artistId", nativeQuery = true)
    void removeArtistFromAllFavorites(@Param("artistId") Long artistId);
}
