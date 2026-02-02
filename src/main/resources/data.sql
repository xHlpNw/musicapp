-- Начальные данные при старте приложения.
-- Используется при spring.sql.init.mode=always. При ddl-auto=create схема пересоздаётся каждый раз, затем выполняется этот скрипт.
-- Пароль для тестовых пользователей admin и demo: password
-- BCrypt hash для "password" (10 rounds)

-- Пользователи
INSERT INTO users (username, email, password_hash, created_at)
VALUES
    ('admin', 'admin@musicapp.local', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', CURRENT_TIMESTAMP),
    ('demo', 'demo@musicapp.local', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', CURRENT_TIMESTAMP)
ON CONFLICT (username) DO NOTHING;

-- Исполнители
INSERT INTO artists (name, description, created_at)
VALUES
    ('The Beatles', 'British rock band formed in Liverpool in 1960.', CURRENT_TIMESTAMP),
    ('Pink Floyd', 'British rock band known for progressive and psychedelic music.', CURRENT_TIMESTAMP),
    ('Queen', 'British rock band formed in London in 1970.', CURRENT_TIMESTAMP),
    ('Led Zeppelin', 'British rock band formed in 1968.', CURRENT_TIMESTAMP),
    ('Radiohead', 'British rock band formed in Oxford in 1985.', CURRENT_TIMESTAMP);

-- Альбомы (привязка к исполнителям по имени)
INSERT INTO albums (title, release_year, artist_id, created_at)
SELECT 'Abbey Road', 1969, id, CURRENT_TIMESTAMP FROM artists WHERE name = 'The Beatles' LIMIT 1;
INSERT INTO albums (title, release_year, artist_id, created_at)
SELECT 'The Dark Side of the Moon', 1973, id, CURRENT_TIMESTAMP FROM artists WHERE name = 'Pink Floyd' LIMIT 1;
INSERT INTO albums (title, release_year, artist_id, created_at)
SELECT 'A Night at the Opera', 1975, id, CURRENT_TIMESTAMP FROM artists WHERE name = 'Queen' LIMIT 1;
INSERT INTO albums (title, release_year, artist_id, created_at)
SELECT 'Led Zeppelin IV', 1971, id, CURRENT_TIMESTAMP FROM artists WHERE name = 'Led Zeppelin' LIMIT 1;
INSERT INTO albums (title, release_year, artist_id, created_at)
SELECT 'OK Computer', 1997, id, CURRENT_TIMESTAMP FROM artists WHERE name = 'Radiohead' LIMIT 1;

-- Треки (заглушки: нужен хотя бы один пользователь и исполнитель)
-- file_path и mime_type — плейсхолдеры, реальные файлы загружаются через API
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, track_number, artist_id, album_id, uploaded_by_id, created_at)
SELECT 'Come Together', 259, 'storage/tracks/placeholder_1', 'audio/mpeg', 1, a.id, al.id, u.id, CURRENT_TIMESTAMP
FROM artists a, albums al, users u
WHERE a.name = 'The Beatles' AND al.title = 'Abbey Road' AND u.username = 'admin' LIMIT 1;

INSERT INTO tracks (title, duration_seconds, file_path, mime_type, track_number, artist_id, album_id, uploaded_by_id, created_at)
SELECT 'Something', 182, 'storage/tracks/placeholder_2', 'audio/mpeg', 2, a.id, al.id, u.id, CURRENT_TIMESTAMP
FROM artists a, albums al, users u
WHERE a.name = 'The Beatles' AND al.title = 'Abbey Road' AND u.username = 'admin' LIMIT 1;

INSERT INTO tracks (title, duration_seconds, file_path, mime_type, track_number, artist_id, album_id, uploaded_by_id, created_at)
SELECT 'Time', 413, 'storage/tracks/placeholder_3', 'audio/mpeg', 4, a.id, al.id, u.id, CURRENT_TIMESTAMP
FROM artists a, albums al, users u
WHERE a.name = 'Pink Floyd' AND al.title = 'The Dark Side of the Moon' AND u.username = 'admin' LIMIT 1;

INSERT INTO tracks (title, duration_seconds, file_path, mime_type, track_number, artist_id, album_id, uploaded_by_id, created_at)
SELECT 'Bohemian Rhapsody', 354, 'storage/tracks/placeholder_4', 'audio/mpeg', 11, a.id, al.id, u.id, CURRENT_TIMESTAMP
FROM artists a, albums al, users u
WHERE a.name = 'Queen' AND al.title = 'A Night at the Opera' AND u.username = 'admin' LIMIT 1;
