package com.example.musicapp.service;

import com.example.musicapp.dto.auth.LoginRequest;
import com.example.musicapp.dto.auth.LoginResponse;
import com.example.musicapp.dto.auth.RegisterRequest;
import com.example.musicapp.dto.auth.UpdateAvatarRequest;
import com.example.musicapp.dto.auth.UpdatePasswordRequest;
import com.example.musicapp.dto.auth.UpdateProfileRequest;
import com.example.musicapp.entity.User;
import com.example.musicapp.exception.UserAlreadyExistsException;
import com.example.musicapp.repository.UserRepository;
import com.example.musicapp.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String AVATAR_PREFIX = "data:image/png;base64,";
    private static final int MAX_AVATAR_BYTES = 300 * 1024;
    private static final int MAX_AVATAR_DIMENSION = 512;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Value("${app.storage.path:./storage}")
    private String storagePath;

    @Transactional
    public LoginResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new UserAlreadyExistsException("Username already taken: " + request.getUsername());
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Email already registered: " + request.getEmail());
        }
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .createdAt(Instant.now())
                .build();
        user = userRepository.save(user);
        String token = jwtUtil.generateToken(user.getUsername());
        return LoginResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .expiresInSeconds(jwtUtil.getExpirationMs() / 1000)
                .userId(user.getId())
                .username(user.getUsername())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid username or password");
        }
        String token = jwtUtil.generateToken(user.getUsername());
        return LoginResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .expiresInSeconds(jwtUtil.getExpirationMs() / 1000)
                .userId(user.getId())
                .username(user.getUsername())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }

    @Transactional
    public LoginResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new BadCredentialsException("User not found"));
        String newUsername = request.getUsername().trim();
        if (!currentUser.getUsername().equals(newUsername)) {
            if (userRepository.existsByUsername(newUsername)) {
                throw new UserAlreadyExistsException("Username already taken: " + newUsername);
            }
            currentUser.setUsername(newUsername);
            currentUser = userRepository.save(currentUser);
        }
        String token = jwtUtil.generateToken(currentUser.getUsername());
        return toLoginResponse(currentUser, token);
    }

    @Transactional
    public LoginResponse updatePassword(Long userId, UpdatePasswordRequest request) {
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new BadCredentialsException("User not found"));
        if (!passwordEncoder.matches(request.getCurrentPassword(), currentUser.getPasswordHash())) {
            throw new BadCredentialsException("Invalid current password");
        }
        currentUser.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        currentUser = userRepository.save(currentUser);
        String token = jwtUtil.generateToken(currentUser.getUsername());
        return toLoginResponse(currentUser, token);
    }

    @Transactional
    public LoginResponse updateAvatar(Long userId, UpdateAvatarRequest request) {
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new BadCredentialsException("User not found"));
        String data = request.getImageData().trim();
        if (!data.startsWith(AVATAR_PREFIX)) {
            throw new IllegalArgumentException("Invalid image data: expected base64 PNG");
        }
        String base64 = data.substring(AVATAR_PREFIX.length());
        byte[] bytes;
        try {
            bytes = Base64.getDecoder().decode(base64);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid base64 image data");
        }
        if (bytes == null || bytes.length == 0) {
            throw new IllegalArgumentException("Empty image data");
        }
        if (bytes.length > MAX_AVATAR_BYTES) {
            throw new IllegalArgumentException("Image too large; max " + (MAX_AVATAR_BYTES / 1024) + " KB");
        }
        BufferedImage image;
        try {
            image = ImageIO.read(new ByteArrayInputStream(bytes));
        } catch (IOException e) {
            throw new IllegalArgumentException("Invalid image format");
        }
        if (image == null) {
            throw new IllegalArgumentException("Invalid image format");
        }
        int w = image.getWidth();
        int h = image.getHeight();
        if (w > MAX_AVATAR_DIMENSION || h > MAX_AVATAR_DIMENSION) {
            throw new IllegalArgumentException("Image dimensions must not exceed " + MAX_AVATAR_DIMENSION + "x" + MAX_AVATAR_DIMENSION);
        }
        Path avatarsDir = Paths.get(storagePath).resolve("covers").resolve("avatars").toAbsolutePath().normalize();
        try {
            Files.createDirectories(avatarsDir);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to create avatars directory", e);
        }
        Path file = avatarsDir.resolve(currentUser.getId() + ".png").normalize();
        if (!file.startsWith(avatarsDir)) {
            throw new IllegalArgumentException("Invalid path");
        }
        try {
            Files.write(file, bytes);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to save avatar", e);
        }
        String avatarUrl = "avatars/" + currentUser.getId() + ".png";
        currentUser.setAvatarUrl(avatarUrl);
        currentUser = userRepository.save(currentUser);
        String token = jwtUtil.generateToken(currentUser.getUsername());
        return toLoginResponse(currentUser, token);
    }

    @Transactional
    public LoginResponse clearAvatar(Long userId) {
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new BadCredentialsException("User not found"));
        currentUser.setAvatarUrl(null);
        currentUser = userRepository.save(currentUser);
        Path avatarFile = Paths.get(storagePath).resolve("covers").resolve("avatars").resolve(currentUser.getId() + ".png");
        try {
            Files.deleteIfExists(avatarFile);
        } catch (IOException ignored) {
            // best effort
        }
        String token = jwtUtil.generateToken(currentUser.getUsername());
        return toLoginResponse(currentUser, token);
    }

    private LoginResponse toLoginResponse(User user, String token) {
        return LoginResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .expiresInSeconds(jwtUtil.getExpirationMs() / 1000)
                .userId(user.getId())
                .username(user.getUsername())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }
}
