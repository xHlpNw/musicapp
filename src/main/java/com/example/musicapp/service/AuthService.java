package com.example.musicapp.service;

import com.example.musicapp.dto.auth.LoginRequest;
import com.example.musicapp.dto.auth.LoginResponse;
import com.example.musicapp.dto.auth.RegisterRequest;
import com.example.musicapp.entity.User;
import com.example.musicapp.exception.UserAlreadyExistsException;
import com.example.musicapp.repository.UserRepository;
import com.example.musicapp.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

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
                .build();
    }
}
