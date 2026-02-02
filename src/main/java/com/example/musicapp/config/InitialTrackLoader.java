package com.example.musicapp.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;

/**
 * При старте приложения копирует аудиофайлы из classpath:initial-tracks/ в storage/tracks/,
 * если таких файлов там ещё нет. Это позволяет подставлять в data.sql имена файлов (sample1.mp3 и т.д.),
 * положить реальные файлы в src/main/resources/initial-tracks/ — и они появятся в storage при первом запуске.
 */
@Component
public class InitialTrackLoader implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(InitialTrackLoader.class);
    private static final String INITIAL_TRACKS_PATTERN = "classpath*:initial-tracks/*";

    @Value("${app.storage.path:./storage}")
    private String storagePath;

    private final ResourcePatternResolver resourceResolver;

    public InitialTrackLoader(ResourcePatternResolver resourceResolver) {
        this.resourceResolver = resourceResolver;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        Path tracksDir = Paths.get(storagePath).resolve("tracks").toAbsolutePath().normalize();
        Files.createDirectories(tracksDir);
        log.info("Initial tracks: target dir = {}", tracksDir);

        Set<String> audioExtensions = Set.of(".mp3", ".ogg", ".m4a", ".wav", ".flac", ".aac");
        try {
            Resource[] resources = resourceResolver.getResources(INITIAL_TRACKS_PATTERN);
            log.info("Initial tracks: found {} resource(s) for pattern {}", resources.length, INITIAL_TRACKS_PATTERN);
            for (Resource resource : resources) {
                if (!resource.isReadable()) continue;
                String filename = resource.getFilename();
                if (filename == null || filename.isBlank()) continue;
                String lower = filename.toLowerCase();
                if (!audioExtensions.stream().anyMatch(lower::endsWith)) continue;
                Path target = tracksDir.resolve(filename).normalize();
                if (!target.startsWith(tracksDir.normalize())) {
                    log.warn("Initial tracks: skip {} (path escape)", filename);
                    continue;
                }
                if (Files.exists(target)) {
                    log.debug("Initial tracks: already exists {}", filename);
                    continue;
                }
                Files.copy(resource.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
                log.info("Initial tracks: copied {} -> {}", filename, target);
            }
        } catch (IOException e) {
            log.warn("Initial tracks: could not load from classpath ({}): {}", INITIAL_TRACKS_PATTERN, e.getMessage());
        }
    }
}
