package com.example.musicapp.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.HandlerMapping;

import jakarta.servlet.http.HttpServletRequest;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Раздача файлов обложек (треков, альбомов, исполнителей).
 * Путь в БД (cover_image_path) задаётся в data.sql при старте.
 * Файлы в {app.storage.path}/covers/ по тому же пути (например albums/peski.jpeg).
 */
@RestController
@RequestMapping("/api/covers")
public class CoversController {

    @Value("${app.storage.path:./storage}")
    private String storagePath;

    /** GET /api/covers/albums/peski.jpeg → storage/covers/albums/peski.jpeg */
    @GetMapping("/**")
    public ResponseEntity<Resource> serveCover(HttpServletRequest request) {
        String path = (String) request.getAttribute(HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE);
        if (path == null || path.isBlank()) {
            return ResponseEntity.notFound().build();
        }
        String matchPattern = (String) request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
        String relative = new org.springframework.util.AntPathMatcher().extractPathWithinPattern(matchPattern, path);
        if (relative == null || relative.isBlank()) {
            return ResponseEntity.notFound().build();
        }
        relative = relative.replace('\\', '/');
        Path base = Paths.get(storagePath).resolve("covers").toAbsolutePath().normalize();
        Path file = base.resolve(relative).normalize();
        if (!file.startsWith(base)) {
            return ResponseEntity.notFound().build();
        }
        try {
            Resource resource = new UrlResource(file.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }
            String contentType = getContentType(relative);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CACHE_CONTROL, "max-age=86400")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    private static String getContentType(String path) {
        String lower = path.toLowerCase();
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".webp")) return "image/webp";
        return "application/octet-stream";
    }
}
