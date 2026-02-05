package com.example.musicapp.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @NotBlank(message = "Username is required")
    @Size(min = 2, max = 50)
    private String username;
}
