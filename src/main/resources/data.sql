-- Начальные данные при старте приложения.
-- Используется при spring.sql.init.mode=always. При ddl-auto=create схема пересоздаётся каждый раз, затем выполняется этот скрипт.
-- Пароль для тестовых пользователей admin и demo: password
-- BCrypt hash для "password" (10 rounds)
--
-- ========== Как привязать исполнителя к треку и к альбому ==========
-- Связь исполнитель — трек: таблица track_artists (track_id, artist_id, display_order, role).
--   Пример: вставить одного исполнителя как PRIMARY для трека по названию и имени артиста:
--   INSERT INTO track_artists (display_order, role, track_id, artist_id)
--   SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a
--   WHERE t.title = 'Название трека' AND a.name = 'Имя исполнителя' LIMIT 1;
--
-- Связь исполнитель — альбом: таблица album_artists (album_id, artist_id, display_order, role).
--   Пример: привязать исполнителя к альбому по названию альбома и имени артиста:
--   INSERT INTO album_artists (display_order, role, album_id, artist_id)
--   SELECT 0, 'PRIMARY', al.id, a.id FROM albums al, artists a
--   WHERE al.title = 'Название альбома' AND a.name = 'Имя исполнителя' LIMIT 1;
--
-- Роль: PRIMARY (основной), FEATURED (гость). Можно добавить несколько артистов с разными display_order.
-- ========================================================================================

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
    ('Тёмный принц', 'нефор', CURRENT_TIMESTAMP),
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
SELECT 1, 'PRIMARY', al.id, a.id FROM albums al, artists a WHERE al.title = 'Пески времени' AND a.name = 'Тёмный принц' LIMIT 1;
INSERT INTO album_artists (display_order, role, album_id, artist_id)
SELECT 0, 'PRIMARY', al.id, a.id FROM albums al, artists a WHERE al.title = 'Чудовище погубившее мир' AND a.name = 'Слава КПСС' LIMIT 1;
INSERT INTO album_artists (display_order, role, album_id, artist_id)
SELECT 0, 'PRIMARY', al.id, a.id FROM albums al, artists a WHERE al.title = 'Vessel' AND a.name = 'twenty one pilots' LIMIT 1;

-- Треки (без album_id, artist_id, track_number)
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'Пески времени', 142, 'PeskiVremeni.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'Чудовище погубившее мир', 169, 'KPSS_Chudovishe.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'Чучело', 206, 'KPSS_Chuchelo.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'В хрущевских и брежневских домах', 198, 'KPSS_VHrushyovskih.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'Мёртвый игрок', 229, 'KPSS_MertviyIgrok.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'Лёд выдержит', 184, 'KPSS_LedViderjit.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'ЧДПБЛ', 174, 'KPSS_ChDPBL.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'Могилам II', 154, 'KPSS_Mogilam2.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'Вечное возвращение', 219, 'KPSS_VechnoeVozvrashenye.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'Остров', 242, 'KPSS_Ostrov.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'Комната', 226, 'KPSS_Komnata.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'Мальчиш плохиш', 217, 'KPSS_MalchishPlohish.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'Похоронка', 222, 'KPSS_Pohoronka.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'Домики у моря', 200, 'KPSS_DomikiUMorya.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'Больно', 158, 'KPSS_Bolno.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'Я убью себя', 162, 'KPSS_YaUbiuSebia.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'Ни надежды, ни Бога, ни хип-хопа', 716, 'KPSS_NiNadezhdi.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'Car radio', 716, 'CarRadio.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;

-- Связь трек–альбом (album_tracks: альбом, трек, позиция)
INSERT INTO album_tracks (position, album_id, track_id) SELECT 1, al.id, t.id FROM albums al, tracks t WHERE al.title = 'Пески времени' AND t.title = 'Пески времени' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 1, al.id, t.id FROM albums al, tracks t WHERE al.title = 'Чудовище погубившее мир' AND t.title = 'Чудовище погубившее мир' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 2, al.id, t.id FROM albums al, tracks t WHERE al.title = 'Чудовище погубившее мир' AND t.title = 'Чучело' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 3, al.id, t.id FROM albums al, tracks t WHERE al.title = 'Чудовище погубившее мир' AND t.title = 'В хрущевских и брежневских домах' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 4, al.id, t.id FROM albums al, tracks t WHERE al.title = 'Чудовище погубившее мир' AND t.title = 'Мёртвый игрок' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 5, al.id, t.id FROM albums al, tracks t WHERE al.title = 'Чудовище погубившее мир' AND t.title = 'Лёд выдержит' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 6, al.id, t.id FROM albums al, tracks t WHERE al.title = 'Чудовище погубившее мир' AND t.title = 'ЧДПБЛ' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 7, al.id, t.id FROM albums al, tracks t WHERE al.title = 'Чудовище погубившее мир' AND t.title = 'Могилам II' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 8, al.id, t.id FROM albums al, tracks t WHERE al.title = 'Чудовище погубившее мир' AND t.title = 'Вечное возвращение' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 9, al.id, t.id FROM albums al, tracks t WHERE al.title = 'Чудовище погубившее мир' AND t.title = 'Остров' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 10, al.id, t.id FROM albums al, tracks t WHERE al.title = 'Чудовище погубившее мир' AND t.title = 'Комната' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 11, al.id, t.id FROM albums al, tracks t WHERE al.title = 'Чудовище погубившее мир' AND t.title = 'Мальчиш плохиш' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 12, al.id, t.id FROM albums al, tracks t WHERE al.title = 'Чудовище погубившее мир' AND t.title = 'Похоронка' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 13, al.id, t.id FROM albums al, tracks t WHERE al.title = 'Чудовище погубившее мир' AND t.title = 'Домики у моря' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 14, al.id, t.id FROM albums al, tracks t WHERE al.title = 'Чудовище погубившее мир' AND t.title = 'Больно' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 15, al.id, t.id FROM albums al, tracks t WHERE al.title = 'Чудовище погубившее мир' AND t.title = 'Я убью себя' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 16, al.id, t.id FROM albums al, tracks t WHERE al.title = 'Чудовище погубившее мир' AND t.title = 'Ни надежды, ни Бога, ни хип-хопа' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 1, al.id, t.id FROM albums al, tracks t WHERE al.title = 'Vessel' AND t.title = 'Car radio' LIMIT 1;

-- Участники треков (track_artists: трек — артист, порядок, роль PRIMARY)
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'Пески времени' AND a.name = 'Слава КПСС' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 1, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'Пески времени' AND a.name = 'Тёмный принц' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'Чудовище погубившее мир' AND a.name = 'Слава КПСС' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'Чучело' AND a.name = 'Слава КПСС' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'В хрущевских и брежневских домах' AND a.name = 'Слава КПСС' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'Мёртвый игрок' AND a.name = 'Слава КПСС' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'Лёд выдержит' AND a.name = 'Слава КПСС' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'ЧДПБЛ' AND a.name = 'Слава КПСС' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'Могилам II' AND a.name = 'Слава КПСС' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'Вечное возвращение' AND a.name = 'Слава КПСС' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'Остров' AND a.name = 'Слава КПСС' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'Комната' AND a.name = 'Слава КПСС' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'Мальчиш плохиш' AND a.name = 'Слава КПСС' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'Похоронка' AND a.name = 'Слава КПСС' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'Домики у моря' AND a.name = 'Слава КПСС' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'Больно' AND a.name = 'Слава КПСС' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'Я убью себя' AND a.name = 'Слава КПСС' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'Ни надежды, ни Бога, ни хип-хопа' AND a.name = 'Слава КПСС' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'Car radio' AND a.name = 'twenty one pilots' LIMIT 1;

-- Обложки треков, альбомов и исполнителей (задаются при старте).
-- Файлы класть в {app.storage.path}/covers/ по указанному пути (например storage/covers/tracks/1.png).
-- Раздача: GET /api/covers/{path}
UPDATE tracks SET cover_image_path = 'albums/peski.jpeg' WHERE title = 'Пески времени';
UPDATE tracks SET cover_image_path = 'albums/blade.jpeg' WHERE title = 'Чудовище погубившее мир';
UPDATE tracks SET cover_image_path = 'albums/chudovishe.jpeg' WHERE title = 'Чучело';
UPDATE tracks SET cover_image_path = 'albums/chudovishe.jpeg' WHERE title = 'В хрущевских и брежневских домах';
UPDATE tracks SET cover_image_path = 'albums/chudovishe.jpeg' WHERE title = 'Мёртвый игрок';
UPDATE tracks SET cover_image_path = 'albums/chudovishe.jpeg' WHERE title = 'Лёд выдержит';
UPDATE tracks SET cover_image_path = 'albums/chudovishe.jpeg' WHERE title = 'ЧДПБЛ';
UPDATE tracks SET cover_image_path = 'albums/chudovishe.jpeg' WHERE title = 'Могилам II';
UPDATE tracks SET cover_image_path = 'albums/chudovishe.jpeg' WHERE title = 'Вечное возвращение';
UPDATE tracks SET cover_image_path = 'albums/chudovishe.jpeg' WHERE title = 'Остров';
UPDATE tracks SET cover_image_path = 'albums/chudovishe.jpeg' WHERE title = 'Комната';
UPDATE tracks SET cover_image_path = 'albums/chudovishe.jpeg' WHERE title = 'Мальчиш плохиш';
UPDATE tracks SET cover_image_path = 'albums/chudovishe.jpeg' WHERE title = 'Похоронка';
UPDATE tracks SET cover_image_path = 'albums/chudovishe.jpeg' WHERE title = 'Домики у моря';
UPDATE tracks SET cover_image_path = 'albums/chudovishe.jpeg' WHERE title = 'Больно';
UPDATE tracks SET cover_image_path = 'albums/chudovishe.jpeg' WHERE title = 'Я убью себя';
UPDATE tracks SET cover_image_path = 'albums/chudovishe.jpeg' WHERE title = 'Ни надежды, ни Бога, ни хип-хопа';
UPDATE tracks SET cover_image_path = 'albums/vessel.jpeg' WHERE title = 'Car radio';
UPDATE albums SET cover_image_path = 'albums/peski.jpeg' WHERE title = 'Пески времени';
UPDATE albums SET cover_image_path = 'albums/chudovishe.jpeg' WHERE title = 'Чудовище погубившее мир';
UPDATE albums SET cover_image_path = 'albums/vessel.jpeg' WHERE title = 'Vessel';
UPDATE artists SET cover_image_path = 'artists/kpss.jpeg' WHERE name = 'Слава КПСС';
UPDATE artists SET cover_image_path = 'artists/21pilots.jpeg' WHERE name = 'twenty one pilots';
UPDATE artists SET cover_image_path = 'artists/tyomniy.jpeg' WHERE name = 'Тёмный принц';

-- Избранное пользователя admin: пара треков, пара альбомов, один исполнитель
INSERT INTO user_favorite_tracks (user_id, track_id)
SELECT u.id, t.id FROM users u, tracks t WHERE u.username = 'admin' AND t.title = 'Пески времени' LIMIT 1;
INSERT INTO user_favorite_tracks (user_id, track_id)
SELECT u.id, t.id FROM users u, tracks t WHERE u.username = 'admin' AND t.title = 'Чудовище погубившее мир' LIMIT 1;
INSERT INTO user_favorite_albums (user_id, album_id)
SELECT u.id, al.id FROM users u, albums al WHERE u.username = 'admin' AND al.title = 'Пески времени' LIMIT 1;
INSERT INTO user_favorite_albums (user_id, album_id)
SELECT u.id, al.id FROM users u, albums al WHERE u.username = 'admin' AND al.title = 'Vessel' LIMIT 1;
INSERT INTO user_favorite_artists (user_id, artist_id)
SELECT u.id, a.id FROM users u, artists a WHERE u.username = 'admin' AND a.name = 'Слава КПСС' LIMIT 1;
