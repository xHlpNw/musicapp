package com.example.musicapp.controller;

import com.example.musicapp.dto.history.ListenHistoryItemResponse;
import com.example.musicapp.entity.User;
import com.example.musicapp.security.SecurityUser;
import com.example.musicapp.service.ListenHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/listen-history")
@RequiredArgsConstructor
public class ListenHistoryController {

    private final ListenHistoryService listenHistoryService;

    @PostMapping("/tracks/{trackId}")
    public ResponseEntity<Void> recordPlay(
            @PathVariable Long trackId,
            @AuthenticationPrincipal SecurityUser securityUser) {
        User user = securityUser.getUser();
        listenHistoryService.recordPlay(user.getId(), trackId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<Page<ListenHistoryItemResponse>> getHistory(
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal SecurityUser securityUser) {
        User user = securityUser.getUser();
        return ResponseEntity.ok(listenHistoryService.getHistory(user.getId(), pageable));
    }
}
