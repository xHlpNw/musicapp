package com.example.musicapp.controller;

import com.example.musicapp.dto.track.CreateTrackRequest;
import com.example.musicapp.dto.track.TrackParticipantRequest;
import com.example.musicapp.dto.track.TrackResponse;
import com.example.musicapp.dto.track.UpdateTrackRequest;
import com.example.musicapp.entity.AlbumArtistRole;
import com.example.musicapp.entity.User;
import com.example.musicapp.security.SecurityUser;
import com.example.musicapp.service.TrackService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/tracks")
@RequiredArgsConstructor
public class TracksController {

    private static final Pattern RANGE_PATTERN = Pattern.compile("bytes=(\\d+)-(\\d*)");

    private final TrackService trackService;

    @GetMapping
    public ResponseEntity<Page<TrackResponse>> findAll(
            @RequestParam(required = false) String q,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(trackService.findAll(q, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TrackResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(trackService.findById(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TrackResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam("albumId") Long albumId,
            @RequestParam("position") Integer position,
            @RequestParam("artistIds") List<Long> artistIds,
            @RequestParam(value = "roles", required = false) List<String> roles,
            @RequestParam("durationSeconds") Integer durationSeconds,
            @RequestParam(value = "genreIds", required = false) List<Long> genreIds,
            @AuthenticationPrincipal SecurityUser securityUser) {
        User user = securityUser.getUser();
        if (artistIds == null || artistIds.isEmpty()) {
            throw new IllegalArgumentException("At least one artist is required");
        }
        List<TrackParticipantRequest> artists = new ArrayList<>();
        for (int i = 0; i < artistIds.size(); i++) {
            AlbumArtistRole role = AlbumArtistRole.FEATURED;
            if (roles != null && i < roles.size()) {
                try {
                    role = AlbumArtistRole.valueOf(roles.get(i).trim().toUpperCase());
                } catch (Exception ignored) {
                    role = i == 0 ? AlbumArtistRole.PRIMARY : AlbumArtistRole.FEATURED;
                }
            } else {
                role = i == 0 ? AlbumArtistRole.PRIMARY : AlbumArtistRole.FEATURED;
            }
            artists.add(TrackParticipantRequest.builder()
                    .artistId(artistIds.get(i))
                    .displayOrder(i)
                    .role(role)
                    .build());
        }
        Set<Long> genreIdSet = (genreIds != null && !genreIds.isEmpty()) ? new HashSet<>(genreIds) : null;
        CreateTrackRequest request = CreateTrackRequest.builder()
                .title(title)
                .albumId(albumId)
                .position(position)
                .artists(artists)
                .durationSeconds(durationSeconds)
                .genreIds(genreIdSet)
                .build();
        TrackResponse response = trackService.upload(file, request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(value = "/{id}/cover", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TrackResponse> uploadCover(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(trackService.uploadCover(id, file));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(value = "/{id}/audio", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TrackResponse> replaceAudio(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(trackService.replaceAudioFile(id, file));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<TrackResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTrackRequest request) {
        return ResponseEntity.ok(trackService.update(id, request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        trackService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/stream")
    public ResponseEntity<Resource> stream(
            @PathVariable Long id,
            @RequestHeader(value = "Range", required = false) String rangeHeader) throws IOException {
        var streamResult = trackService.getStreamResourceAndMimeType(id);
        Resource resource = streamResult.resource();
        String mimeType = streamResult.mimeType();
        long contentLength = resource.contentLength();

        if (rangeHeader == null || rangeHeader.isEmpty()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(mimeType))
                    .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(contentLength))
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .body(resource);
        }

        Matcher matcher = RANGE_PATTERN.matcher(rangeHeader);
        if (!matcher.matches()) {
            return ResponseEntity.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE).build();
        }
        long start = Long.parseLong(matcher.group(1));
        long end = matcher.group(2).isEmpty() ? contentLength - 1 : Long.parseLong(matcher.group(2));
        end = Math.min(end, contentLength - 1);
        if (start > end || start < 0) {
            return ResponseEntity.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE).build();
        }

        long rangeLength = end - start + 1;
        InputStream inputStream = resource.getInputStream();
        inputStream.skip(start);
        byte[] bytes = inputStream.readNBytes((int) rangeLength);
        inputStream.close();

        Resource rangeResource = new org.springframework.core.io.ByteArrayResource(bytes);
        String contentRange = "bytes " + start + "-" + end + "/" + contentLength;

        return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                .contentType(MediaType.parseMediaType(mimeType))
                .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(rangeLength))
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header(HttpHeaders.CONTENT_RANGE, contentRange)
                .body(rangeResource);
    }
}
