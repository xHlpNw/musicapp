package com.example.musicapp.controller;

import com.example.musicapp.dto.auth.LoginRequest;
import com.example.musicapp.dto.auth.LoginResponse;
import com.example.musicapp.dto.auth.RegisterRequest;
import com.example.musicapp.dto.auth.UpdatePasswordRequest;
import com.example.musicapp.dto.auth.UpdateProfileRequest;
import com.example.musicapp.service.AuthService;
import com.example.musicapp.security.SecurityUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<LoginResponse> register(@Valid @RequestBody RegisterRequest request) {
        LoginResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/me")
    public ResponseEntity<LoginResponse> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal SecurityUser securityUser) {
        LoginResponse response = authService.updateProfile(securityUser.getId(), request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/me/password")
    public ResponseEntity<LoginResponse> updatePassword(
            @Valid @RequestBody UpdatePasswordRequest request,
            @AuthenticationPrincipal SecurityUser securityUser) {
        LoginResponse response = authService.updatePassword(securityUser.getId(), request);
        return ResponseEntity.ok(response);
    }
}
