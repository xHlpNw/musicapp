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
 * При старте копирует обложки из classpath:initial-covers/ в storage/covers/,
 * если файлов там ещё нет. Положите, например, peski.jpeg в src/main/resources/initial-covers/albums/
 * и укажите в data.sql cover_image_path = 'albums/peski.jpeg' — при первом запуске файл скопируется.
 */
@Component
public class InitialCoverLoader implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(InitialCoverLoader.class);
    private static final String INITIAL_COVERS_PATTERN = "classpath*:initial-covers/**/*";
    private static final Set<String> IMAGE_EXTENSIONS = Set.of(".png", ".jpg", ".jpeg", ".gif", ".webp");

    @Value("${app.storage.path:./storage}")
    private String storagePath;

    private final ResourcePatternResolver resourceResolver;

    public InitialCoverLoader(ResourcePatternResolver resourceResolver) {
        this.resourceResolver = resourceResolver;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        Path coversDir = Paths.get(storagePath).resolve("covers").toAbsolutePath().normalize();
        Files.createDirectories(coversDir);
        log.info("Initial covers: target dir = {}", coversDir);

        try {
            Resource[] resources = resourceResolver.getResources(INITIAL_COVERS_PATTERN);
            for (Resource resource : resources) {
                if (!resource.isReadable() || !resource.exists()) continue;
                String filename = resource.getFilename();
                if (filename == null || filename.isBlank()) continue;
                String lower = filename.toLowerCase();
                if (!IMAGE_EXTENSIONS.stream().anyMatch(lower::endsWith)) continue;

                String uri = resource.getURI().toString();
                int idx = uri.indexOf("initial-covers/");
                if (idx < 0) continue;
                String relative = uri.substring(idx + "initial-covers/".length())
                        .replace('\\', '/').replace("%2F", "/").replace("%2f", "/");
                if (relative.startsWith("/")) relative = relative.substring(1);

                Path target = coversDir.resolve(relative).normalize();
                if (!target.startsWith(coversDir)) {
                    log.warn("Initial covers: skip {} (path escape)", relative);
                    continue;
                }
                Files.createDirectories(target.getParent());
                if (Files.exists(target)) {
                    log.debug("Initial covers: already exists {}", relative);
                    continue;
                }
                Files.copy(resource.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
                log.info("Initial covers: copied {} -> {}", relative, target);
            }
        } catch (IOException e) {
            log.warn("Initial covers: could not load from classpath ({}): {}", INITIAL_COVERS_PATTERN, e.getMessage());
        }
    }
}
