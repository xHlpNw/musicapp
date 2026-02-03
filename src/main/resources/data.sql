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
    ('Слава КПСС', 'a.k.a. mc птичий пепел', CURRENT_TIMESTAMP),
    ('twenty one pilots', 'Ohio`s duo', CURRENT_TIMESTAMP);

-- Жанры (опционально)
INSERT INTO genres (name) VALUES ('Hip-Hop'), ('Rock'), ('Pop') ON CONFLICT (name) DO NOTHING;

-- Альбомы (release_date — полная дата, без artist_id)
INSERT INTO albums (title, release_date, created_at)
VALUES ('Пески времени', '2025-01-01', CURRENT_TIMESTAMP);
INSERT INTO albums (title, release_date, created_at)
VALUES ('Чудовище погубившее мир', '2020-01-01', CURRENT_TIMESTAMP);
INSERT INTO albums (title, release_date, created_at)
VALUES ('Vessel', '2013-01-01', CURRENT_TIMESTAMP);

-- Участники альбомов (album_artists: альбом — артист, порядок, роль PRIMARY)
INSERT INTO album_artists (display_order, role, album_id, artist_id)
SELECT 0, 'PRIMARY', al.id, a.id FROM albums al, artists a WHERE al.title = 'Пески времени' AND a.name = 'Слава КПСС' LIMIT 1;
INSERT INTO album_artists (display_order, role, album_id, artist_id)
SELECT 0, 'PRIMARY', al.id, a.id FROM albums al, artists a WHERE al.title = 'Чудовище погубившее мир' AND a.name = 'Слава КПСС' LIMIT 1;
INSERT INTO album_artists (display_order, role, album_id, artist_id)
SELECT 0, 'PRIMARY', al.id, a.id FROM albums al, artists a WHERE al.title = 'Vessel' AND a.name = 'twenty one pilots' LIMIT 1;

-- Треки: file_path — имя файла в каталоге storage/tracks (или относительный путь).
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, track_number, artist_id, album_id, uploaded_by_id, created_at)
SELECT 'Пески времени', 142, 'PeskiVremeni.mp3', 'audio/mpeg', 1, a.id, al.id, u.id, CURRENT_TIMESTAMP
FROM artists a, albums al, users u
WHERE a.name = 'Слава КПСС' AND al.title = 'Чудовище погубившее мир' AND u.username = 'admin' LIMIT 1;

INSERT INTO tracks (title, duration_seconds, file_path, mime_type, track_number, artist_id, album_id, uploaded_by_id, created_at)
SELECT 'Чудовище погубившее мир', 169, 'KPSS_Chudovishe.mp3', 'audio/mpeg', 1, a.id, al.id, u.id, CURRENT_TIMESTAMP
FROM artists a, albums al, users u
WHERE a.name = 'Слава КПСС' AND al.title = 'Чудовище погубившее мир' AND u.username = 'admin' LIMIT 1;

INSERT INTO tracks (title, duration_seconds, file_path, mime_type, track_number, artist_id, album_id, uploaded_by_id, created_at)
SELECT 'Чучело', 206, 'KPSS_Chuchelo.mp3', 'audio/mpeg', 2, a.id, al.id, u.id, CURRENT_TIMESTAMP
FROM artists a, albums al, users u
WHERE a.name = 'Слава КПСС' AND al.title = 'Чудовище погубившее мир' AND u.username = 'admin' LIMIT 1;

INSERT INTO tracks (title, duration_seconds, file_path, mime_type, track_number, artist_id, album_id, uploaded_by_id, created_at)
SELECT 'В хрущевских и брежневских домах', 198, 'KPSS_VHrushyovskih.mp3', 'audio/mpeg', 3, a.id, al.id, u.id, CURRENT_TIMESTAMP
FROM artists a, albums al, users u
WHERE a.name = 'Слава КПСС' AND al.title = 'Чудовище погубившее мир' AND u.username = 'admin' LIMIT 1;

INSERT INTO tracks (title, duration_seconds, file_path, mime_type, track_number, artist_id, album_id, uploaded_by_id, created_at)
SELECT 'Мёртвый игрок', 229, 'KPSS_MertviyIgrok.mp3', 'audio/mpeg', 4, a.id, al.id, u.id, CURRENT_TIMESTAMP
FROM artists a, albums al, users u
WHERE a.name = 'Слава КПСС' AND al.title = 'Чудовище погубившее мир' AND u.username = 'admin' LIMIT 1;

INSERT INTO tracks (title, duration_seconds, file_path, mime_type, track_number, artist_id, album_id, uploaded_by_id, created_at)
SELECT 'Лёд выдержит', 184, 'KPSS_LedViderjit.mp3', 'audio/mpeg', 5, a.id, al.id, u.id, CURRENT_TIMESTAMP
FROM artists a, albums al, users u
WHERE a.name = 'Слава КПСС' AND al.title = 'Чудовище погубившее мир' AND u.username = 'admin' LIMIT 1;

INSERT INTO tracks (title, duration_seconds, file_path, mime_type, track_number, artist_id, album_id, uploaded_by_id, created_at)
SELECT 'ЧДПБЛ', 174, 'KPSS_ChDPBL.mp3', 'audio/mpeg', 6, a.id, al.id, u.id, CURRENT_TIMESTAMP
FROM artists a, albums al, users u
WHERE a.name = 'Слава КПСС' AND al.title = 'Чудовище погубившее мир' AND u.username = 'admin' LIMIT 1;

INSERT INTO tracks (title, duration_seconds, file_path, mime_type, track_number, artist_id, album_id, uploaded_by_id, created_at)
SELECT 'Могилам II', 154, 'KPSS_Mogilam2.mp3', 'audio/mpeg', 7, a.id, al.id, u.id, CURRENT_TIMESTAMP
FROM artists a, albums al, users u
WHERE a.name = 'Слава КПСС' AND al.title = 'Чудовище погубившее мир' AND u.username = 'admin' LIMIT 1;

INSERT INTO tracks (title, duration_seconds, file_path, mime_type, track_number, artist_id, album_id, uploaded_by_id, created_at)
SELECT 'Вечное возвращение', 219, 'KPSS_VechnoeVozvrashenye.mp3', 'audio/mpeg', 8, a.id, al.id, u.id, CURRENT_TIMESTAMP
FROM artists a, albums al, users u
WHERE a.name = 'Слава КПСС' AND al.title = 'Чудовище погубившее мир' AND u.username = 'admin' LIMIT 1;

INSERT INTO tracks (title, duration_seconds, file_path, mime_type, track_number, artist_id, album_id, uploaded_by_id, created_at)
SELECT 'Остров', 242, 'KPSS_Ostrov.mp3', 'audio/mpeg', 9, a.id, al.id, u.id, CURRENT_TIMESTAMP
FROM artists a, albums al, users u
WHERE a.name = 'Слава КПСС' AND al.title = 'Чудовище погубившее мир' AND u.username = 'admin' LIMIT 1;

INSERT INTO tracks (title, duration_seconds, file_path, mime_type, track_number, artist_id, album_id, uploaded_by_id, created_at)
SELECT 'Комната', 226, 'KPSS_Komnata.mp3', 'audio/mpeg', 10, a.id, al.id, u.id, CURRENT_TIMESTAMP
FROM artists a, albums al, users u
WHERE a.name = 'Слава КПСС' AND al.title = 'Чудовище погубившее мир' AND u.username = 'admin' LIMIT 1;

INSERT INTO tracks (title, duration_seconds, file_path, mime_type, track_number, artist_id, album_id, uploaded_by_id, created_at)
SELECT 'Мальчиш плохиш', 217, 'KPSS_MalchishPlohish.mp3', 'audio/mpeg', 11, a.id, al.id, u.id, CURRENT_TIMESTAMP
FROM artists a, albums al, users u
WHERE a.name = 'Слава КПСС' AND al.title = 'Чудовище погубившее мир' AND u.username = 'admin' LIMIT 1;

INSERT INTO tracks (title, duration_seconds, file_path, mime_type, track_number, artist_id, album_id, uploaded_by_id, created_at)
SELECT 'Похоронка', 222, 'KPSS_Pohoronka.mp3', 'audio/mpeg', 12, a.id, al.id, u.id, CURRENT_TIMESTAMP
FROM artists a, albums al, users u
WHERE a.name = 'Слава КПСС' AND al.title = 'Чудовище погубившее мир' AND u.username = 'admin' LIMIT 1;

INSERT INTO tracks (title, duration_seconds, file_path, mime_type, track_number, artist_id, album_id, uploaded_by_id, created_at)
SELECT 'Домики у моря', 200, 'KPSS_DomikiUMorya.mp3', 'audio/mpeg', 13, a.id, al.id, u.id, CURRENT_TIMESTAMP
FROM artists a, albums al, users u
WHERE a.name = 'Слава КПСС' AND al.title = 'Чудовище погубившее мир' AND u.username = 'admin' LIMIT 1;

INSERT INTO tracks (title, duration_seconds, file_path, mime_type, track_number, artist_id, album_id, uploaded_by_id, created_at)
SELECT 'Больно', 158, 'KPSS_Bolno.mp3', 'audio/mpeg', 14, a.id, al.id, u.id, CURRENT_TIMESTAMP
FROM artists a, albums al, users u
WHERE a.name = 'Слава КПСС' AND al.title = 'Чудовище погубившее мир' AND u.username = 'admin' LIMIT 1;

INSERT INTO tracks (title, duration_seconds, file_path, mime_type, track_number, artist_id, album_id, uploaded_by_id, created_at)
SELECT 'Я убью себя', 162, 'KPSS_YaUbiuSebia.mp3', 'audio/mpeg', 15, a.id, al.id, u.id, CURRENT_TIMESTAMP
FROM artists a, albums al, users u
WHERE a.name = 'Слава КПСС' AND al.title = 'Чудовище погубившее мир' AND u.username = 'admin' LIMIT 1;

INSERT INTO tracks (title, duration_seconds, file_path, mime_type, track_number, artist_id, album_id, uploaded_by_id, created_at)
SELECT 'Ни надежды, ни Бога, ни хип-хопа', 716, 'KPSS_NiNadezhdi.mp3', 'audio/mpeg', 16, a.id, al.id, u.id, CURRENT_TIMESTAMP
FROM artists a, albums al, users u
WHERE a.name = 'Слава КПСС' AND al.title = 'Чудовище погубившее мир' AND u.username = 'admin' LIMIT 1;

INSERT INTO tracks (title, duration_seconds, file_path, mime_type, track_number, artist_id, album_id, uploaded_by_id, created_at)
SELECT 'Car radio', 716, 'CarRadio.mp3', 'audio/mpeg', 1, a.id, al.id, u.id, CURRENT_TIMESTAMP
FROM artists a, albums al, users u
WHERE a.name = 'twenty one pilots' AND al.title = 'Vessel' AND u.username = 'admin' LIMIT 1;
