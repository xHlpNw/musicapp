package com.example.musicapp.controller;

import com.example.musicapp.dto.track.CreateTrackRequest;
import com.example.musicapp.dto.track.TrackResponse;
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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
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

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TrackResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam(value = "artistId", required = false) Long artistId,
            @RequestParam(value = "artistName", required = false) String artistName,
            @RequestParam(value = "albumId", required = false) Long albumId,
            @RequestParam(value = "trackNumber", required = false) Integer trackNumber,
            @RequestParam("durationSeconds") Integer durationSeconds,
            @AuthenticationPrincipal SecurityUser securityUser) {
        User user = securityUser.getUser();
        CreateTrackRequest request = CreateTrackRequest.builder()
                .title(title)
                .artistId(artistId)
                .artistName(artistName)
                .albumId(albumId)
                .trackNumber(trackNumber)
                .durationSeconds(durationSeconds)
                .build();
        TrackResponse response = trackService.upload(file, request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
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
