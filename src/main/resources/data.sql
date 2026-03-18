
-- Пользователи (admin = true для пользователя admin)
INSERT INTO users (username, email, password_hash, created_at, admin)
VALUES
    ('admin', 'admin@musicapp.local', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', CURRENT_TIMESTAMP, true),
    ('demo', 'demo@musicapp.local', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', CURRENT_TIMESTAMP, false)
ON CONFLICT (username) DO NOTHING;
UPDATE users SET admin = true WHERE username = 'admin';

-- Исполнители
INSERT INTO artists (name, description, created_at)
VALUES
    ('le biptune', 'le biptune est un jeux forain musical reposant sur le principe des Trackers. Ce qui s`écoute ici est l résultat d`une participation collective sur ce jeux.', CURRENT_TIMESTAMP),
    ('gasnOprOd', '', CURRENT_TIMESTAMP),
    ('Вольфганг Амадей Моцарт', 'Австрийский композитор и музыкант-виртуоз', CURRENT_TIMESTAMP);

-- Жанры (опционально)
INSERT INTO genres (name) VALUES
    ('Jazz'), ('Rock'), ('Pop'), ('Blues'), ('Classical music'), ('Hip-Hop'), ('Rap'), ('Electronic'), ('Country'), ('Reggae'),
    ('Soul'), ('Funk'), ('Heavy metal'), ('Punk Rock'), ('Disco'), ('Folk'), ('Alternative'), ('Indie'), ('Ambient'), ('Techno'),
    ('House'), ('Dubstep'), ('R&B'), ('Grunge'), ('Fusion'), ('Soundtrack') ON CONFLICT (name) DO NOTHING;

-- Альбомы (release_date — полная дата, без artist_id)
INSERT INTO albums (title, release_date, created_at)
VALUES
    ('zs', '2024-01-01', CURRENT_TIMESTAMP),
    ('DEM`IL Douce', '2012-01-01', CURRENT_TIMESTAMP),
    ('unknown', '2012-01-01', CURRENT_TIMESTAMP),
    ('Реквием', '1791-01-01', CURRENT_TIMESTAMP),
    ('Турецкий марш', '1783-01-01', CURRENT_TIMESTAMP),
    ('Симфония №40', '1788-01-01', CURRENT_TIMESTAMP),
    ('Концерт для фортепиано', '1777-01-01', CURRENT_TIMESTAMP);

-- Участники альбомов (album_artists: альбом — артист, порядок, роль PRIMARY)
INSERT INTO album_artists (display_order, role, album_id, artist_id)
SELECT 0, 'PRIMARY', al.id, a.id FROM albums al, artists a WHERE al.title = 'zs' AND a.name = 'le biptune' LIMIT 1;
INSERT INTO album_artists (display_order, role, album_id, artist_id)
SELECT 0, 'PRIMARY', al.id, a.id FROM albums al, artists a WHERE al.title = 'DEM`IL Douce' AND a.name = 'gasnOprOd' LIMIT 1;
INSERT INTO album_artists (display_order, role, album_id, artist_id)
SELECT 0, 'PRIMARY', al.id, a.id FROM albums al, artists a WHERE al.title = 'unknown' AND a.name = 'gasnOprOd' LIMIT 1;

INSERT INTO album_artists (display_order, role, album_id, artist_id)
SELECT 0, 'PRIMARY', al.id, a.id FROM albums al, artists a WHERE al.title = 'Реквием' AND a.name = 'Вольфганг Амадей Моцарт' LIMIT 1;
INSERT INTO album_artists (display_order, role, album_id, artist_id)
SELECT 0, 'PRIMARY', al.id, a.id FROM albums al, artists a WHERE al.title = 'Турецкий марш' AND a.name = 'Вольфганг Амадей Моцарт' LIMIT 1;
INSERT INTO album_artists (display_order, role, album_id, artist_id)
SELECT 0, 'PRIMARY', al.id, a.id FROM albums al, artists a WHERE al.title = 'Симфония №40' AND a.name = 'Вольфганг Амадей Моцарт' LIMIT 1;
INSERT INTO album_artists (display_order, role, album_id, artist_id)
SELECT 0, 'PRIMARY', al.id, a.id FROM albums al, artists a WHERE al.title = 'Концерт для фортепиано' AND a.name = 'Вольфганг Амадей Моцарт' LIMIT 1;

-- Треки (без album_id, artist_id, track_number)
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'microcontact', 708, 'microcontact.ogg', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'microfficine', 175, 'microfficine.ogg', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'bazr', 489, 'bazr.ogg', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'gz', 198, 'gz.ogg', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'bvve', 107, 'bvve.ogg', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'chene pointu', 225, 'chene-pointu.ogg', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'hydre', 81, 'hydre.ogg', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'or des bennes', 103, 'or-des-bennes.ogg', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'passere', 253, 'passere.ogg', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;

INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'Sauves-toi', 352, 'DEM`IL1.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'ouch ach chou cha ba da', 101, 'DEM`IL2.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'World trip inlive one_coupage 255 (instrumental)', 175, 'DEM`IL3.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'Neither tOO little', 349, 'DEM`IL4.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT '2 de Tens` [Instrumental]', 369, 'DEM`IL5.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'L`envie de la vie est un jeu qui peut tuer', 168, 'DEM`IL6.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'In progresso [blues poetry without blues sound]', 331, 'DEM`IL7.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT '2 de Tens`', 366, 'DEM`IL8.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'Chinoiseries', 306, 'DEM`IL9.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'World trip inlive 2 vocaux', 291, 'DEM`IL10.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'Un chapital des Capitaux', 186, 'DEM`IL11.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'Ne laisse pas tes fesses téléphoner à ta place _ les choristes en voiture pour le Ouch ach chou cha ba da', 365, 'DEM`IL12.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'East Search in Groove', 293, 'DEM`IL13.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'Cgrataae', 270, 'DEM`IL14.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'World trip inlive _worldtrip One vs INSTRU', 264, 'DEM`IL15.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'AguadunFk', 98, 'DEM`IL16.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'Basse Besoin', 187, 'DEM`IL17.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT '3eme Jour', 200, 'DEM`IL18.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'World trip inlive ccby drums vs INSTRU', 249, 'DEM`IL19.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'la bof des vacances _ tu as les pieds mouillés n`es-tu pas allé dans l`eau... fais attention aux embruns tu risquerais de te tacher', 3451, 'DEM`IL20.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;

INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'World trip inlive_ONe COUPAGE 237', 157, 'unknown.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;

INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'Симфония №40', 368, 'simfonija-40.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'Турецкий марш', 214, 'tureckijj-marsh.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'Реквием 1', 111, 'rekviem-1.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'Реквием 2', 144, 'rekviem-2.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'Реквием 3', 201, 'rekviem-3.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;
INSERT INTO tracks (title, duration_seconds, file_path, mime_type, uploaded_by_id, created_at)
SELECT 'Концерт для фортепиано', 296, 'koncert.mp3', 'audio/mpeg', u.id, CURRENT_TIMESTAMP FROM users u WHERE u.username = 'admin' LIMIT 1;

-- Связь трек–альбом (album_tracks: альбом, трек, позиция)
INSERT INTO album_tracks (position, album_id, track_id) SELECT 1, al.id, t.id FROM albums al, tracks t WHERE al.title = 'zs' AND t.title = 'microcontact' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 2, al.id, t.id FROM albums al, tracks t WHERE al.title = 'zs' AND t.title = 'microfficine' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 3, al.id, t.id FROM albums al, tracks t WHERE al.title = 'zs' AND t.title = 'bazr' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 4, al.id, t.id FROM albums al, tracks t WHERE al.title = 'zs' AND t.title = 'gz' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 5, al.id, t.id FROM albums al, tracks t WHERE al.title = 'zs' AND t.title = 'bvve' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 6, al.id, t.id FROM albums al, tracks t WHERE al.title = 'zs' AND t.title = 'chene pointu' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 7, al.id, t.id FROM albums al, tracks t WHERE al.title = 'zs' AND t.title = 'hydre' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 8, al.id, t.id FROM albums al, tracks t WHERE al.title = 'zs' AND t.title = 'or des bennes' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 9, al.id, t.id FROM albums al, tracks t WHERE al.title = 'zs' AND t.title = 'passere' LIMIT 1;

INSERT INTO album_tracks (position, album_id, track_id) SELECT 1, al.id, t.id FROM albums al, tracks t WHERE al.title = 'DEM`IL Douce' AND t.title = 'Sauves-toi' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 2, al.id, t.id FROM albums al, tracks t WHERE al.title = 'DEM`IL Douce' AND t.title = 'ouch ach chou cha ba da' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 3, al.id, t.id FROM albums al, tracks t WHERE al.title = 'DEM`IL Douce' AND t.title = 'World trip inlive one_coupage 255 (instrumental)' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 4, al.id, t.id FROM albums al, tracks t WHERE al.title = 'DEM`IL Douce' AND t.title = 'Neither tOO little' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 5, al.id, t.id FROM albums al, tracks t WHERE al.title = 'DEM`IL Douce' AND t.title = '2 de Tens` [Instrumental]' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 6, al.id, t.id FROM albums al, tracks t WHERE al.title = 'DEM`IL Douce' AND t.title = 'L`envie de la vie est un jeu qui peut tuer' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 7, al.id, t.id FROM albums al, tracks t WHERE al.title = 'DEM`IL Douce' AND t.title = 'In progresso [blues poetry without blues sound]' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 8, al.id, t.id FROM albums al, tracks t WHERE al.title = 'DEM`IL Douce' AND t.title = '2 de Tens`' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 9, al.id, t.id FROM albums al, tracks t WHERE al.title = 'DEM`IL Douce' AND t.title = 'Chinoiseries' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 10, al.id, t.id FROM albums al, tracks t WHERE al.title = 'DEM`IL Douce' AND t.title = 'World trip inlive 2 vocaux' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 11, al.id, t.id FROM albums al, tracks t WHERE al.title = 'DEM`IL Douce' AND t.title = 'Un chapital des Capitaux' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 12, al.id, t.id FROM albums al, tracks t WHERE al.title = 'DEM`IL Douce' AND t.title = 'Ne laisse pas tes fesses téléphoner à ta place _ les choristes en voiture pour le Ouch ach chou cha ba da' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 13, al.id, t.id FROM albums al, tracks t WHERE al.title = 'DEM`IL Douce' AND t.title = 'East Search in Groove' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 14, al.id, t.id FROM albums al, tracks t WHERE al.title = 'DEM`IL Douce' AND t.title = 'Cgrataae' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 15, al.id, t.id FROM albums al, tracks t WHERE al.title = 'DEM`IL Douce' AND t.title = 'World trip inlive _worldtrip One vs INSTRU' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 16, al.id, t.id FROM albums al, tracks t WHERE al.title = 'DEM`IL Douce' AND t.title = 'AguadunFk' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 17, al.id, t.id FROM albums al, tracks t WHERE al.title = 'DEM`IL Douce' AND t.title = 'Basse Besoin' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 18, al.id, t.id FROM albums al, tracks t WHERE al.title = 'DEM`IL Douce' AND t.title = '3eme Jour' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 19, al.id, t.id FROM albums al, tracks t WHERE al.title = 'DEM`IL Douce' AND t.title = 'World trip inlive ccby drums vs INSTRU' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 20, al.id, t.id FROM albums al, tracks t WHERE al.title = 'DEM`IL Douce' AND t.title = 'la bof des vacances _ tu as les pieds mouillés n`es-tu pas allé dans l`eau... fais attention aux embruns tu risquerais de te tacher' LIMIT 1;

INSERT INTO album_tracks (position, album_id, track_id) SELECT 1, al.id, t.id FROM albums al, tracks t WHERE al.title = 'unknown' AND t.title = 'World trip inlive_ONe COUPAGE 237' LIMIT 1;

INSERT INTO album_tracks (position, album_id, track_id) SELECT 1, al.id, t.id FROM albums al, tracks t WHERE al.title = 'Турецкий марш' AND t.title = 'Турецкий марш' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 1, al.id, t.id FROM albums al, tracks t WHERE al.title = 'Симфония №40' AND t.title = 'Симфония №40' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 1, al.id, t.id FROM albums al, tracks t WHERE al.title = 'Концерт для фортепиано' AND t.title = 'Концерт для фортепиано' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 1, al.id, t.id FROM albums al, tracks t WHERE al.title = 'Реквием' AND t.title = 'Реквием 1' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 2, al.id, t.id FROM albums al, tracks t WHERE al.title = 'Реквием' AND t.title = 'Реквием 2' LIMIT 1;
INSERT INTO album_tracks (position, album_id, track_id) SELECT 3, al.id, t.id FROM albums al, tracks t WHERE al.title = 'Реквием' AND t.title = 'Реквием 3' LIMIT 1;

-- Участники треков (track_artists: трек — артист, порядок, роль PRIMARY)
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'microcontact' AND a.name = 'le biptune' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'microfficine' AND a.name = 'le biptune' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'bazr' AND a.name = 'le biptune' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'gz' AND a.name = 'le biptune' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'bvve' AND a.name = 'le biptune' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'chene pointu' AND a.name = 'le biptune' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'hydre' AND a.name = 'le biptune' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'or des bennes' AND a.name = 'le biptune' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'passere' AND a.name = 'le biptune' LIMIT 1;

INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'Sauves-toi' AND a.name = 'gasnOprOd' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'ouch ach chou cha ba da' AND a.name = 'gasnOprOd' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'World trip inlive one_coupage 255 (instrumental)' AND a.name = 'gasnOprOd' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'Neither tOO little' AND a.name = 'gasnOprOd' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = '2 de Tens` [Instrumental]' AND a.name = 'gasnOprOd' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'L`envie de la vie est un jeu qui peut tuer' AND a.name = 'gasnOprOd' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'In progresso [blues poetry without blues sound]' AND a.name = 'gasnOprOd' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = '2 de Tens`' AND a.name = 'gasnOprOd' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'Chinoiseries' AND a.name = 'gasnOprOd' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'World trip inlive 2 vocaux' AND a.name = 'gasnOprOd' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'Un chapital des Capitaux' AND a.name = 'gasnOprOd' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'Ne laisse pas tes fesses téléphoner à ta place _ les choristes en voiture pour le Ouch ach chou cha ba da' AND a.name = 'gasnOprOd' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'East Search in Groove' AND a.name = 'gasnOprOd' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'Cgrataae' AND a.name = 'gasnOprOd' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'World trip inlive _worldtrip One vs INSTRU' AND a.name = 'gasnOprOd' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'AguadunFk' AND a.name = 'gasnOprOd' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'Basse Besoin' AND a.name = 'gasnOprOd' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = '3eme Jour' AND a.name = 'gasnOprOd' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'World trip inlive ccby drums vs INSTRU' AND a.name = 'gasnOprOd' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'la bof des vacances _ tu as les pieds mouillés n`es-tu pas allé dans l`eau... fais attention aux embruns tu risquerais de te tacher' AND a.name = 'gasnOprOd' LIMIT 1;

INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'World trip inlive_ONe COUPAGE 237' AND a.name = 'gasnOprOd' LIMIT 1;

INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'Симфония №40' AND a.name = 'Вольфганг Амадей Моцарт' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'Турецкий марш' AND a.name = 'Вольфганг Амадей Моцарт' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'Концерт для фортепиано' AND a.name = 'Вольфганг Амадей Моцарт' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'Реквием 1' AND a.name = 'Вольфганг Амадей Моцарт' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'Реквием 2' AND a.name = 'Вольфганг Амадей Моцарт' LIMIT 1;
INSERT INTO track_artists (display_order, role, track_id, artist_id) SELECT 0, 'PRIMARY', t.id, a.id FROM tracks t, artists a WHERE t.title = 'Реквием 3' AND a.name = 'Вольфганг Амадей Моцарт' LIMIT 1;

-- Обложки треков, альбомов и исполнителей (задаются при старте).
-- Файлы класть в {app.storage.path}/covers/ по указанному пути
UPDATE tracks SET cover_image_path = 'albums/zs.jpg' WHERE title = 'microcontact';
UPDATE tracks SET cover_image_path = 'albums/zs.jpg' WHERE title = 'microfficine';
UPDATE tracks SET cover_image_path = 'albums/zs.jpg' WHERE title = 'bazr';
UPDATE tracks SET cover_image_path = 'albums/zs.jpg' WHERE title = 'gz';
UPDATE tracks SET cover_image_path = 'albums/zs.jpg' WHERE title = 'bvve';
UPDATE tracks SET cover_image_path = 'albums/zs.jpg' WHERE title = 'chene pointu';
UPDATE tracks SET cover_image_path = 'albums/zs.jpg' WHERE title = 'hydre';
UPDATE tracks SET cover_image_path = 'albums/zs.jpg' WHERE title = 'or des bennes';
UPDATE tracks SET cover_image_path = 'albums/zs.jpg' WHERE title = 'passere';
UPDATE albums SET cover_image_path = 'albums/zs.jpg' WHERE title = 'zs';

UPDATE tracks SET cover_image_path = 'albums/DEMIL.PNG' WHERE title = 'Sauves-toi';
UPDATE tracks SET cover_image_path = 'albums/DEMIL.PNG' WHERE title = 'ouch ach chou cha ba da';
UPDATE tracks SET cover_image_path = 'albums/DEMIL.PNG' WHERE title = 'World trip inlive one_coupage 255 (instrumental)';
UPDATE tracks SET cover_image_path = 'albums/DEMIL.PNG' WHERE title = 'Neither tOO little';
UPDATE tracks SET cover_image_path = 'albums/DEMIL.PNG' WHERE title = '2 de Tens` [Instrumental]';
UPDATE tracks SET cover_image_path = 'albums/DEMIL.PNG' WHERE title = 'L`envie de la vie est un jeu qui peut tuer';
UPDATE tracks SET cover_image_path = 'albums/DEMIL.PNG' WHERE title = 'In progresso [blues poetry without blues sound]';
UPDATE tracks SET cover_image_path = 'albums/DEMIL.PNG' WHERE title = '2 de Tens`';
UPDATE tracks SET cover_image_path = 'albums/DEMIL.PNG' WHERE title = 'Chinoiseries';
UPDATE tracks SET cover_image_path = 'albums/DEMIL.PNG' WHERE title = 'World trip inlive 2 vocaux';
UPDATE tracks SET cover_image_path = 'albums/DEMIL.PNG' WHERE title = 'Un chapital des Capitaux';
UPDATE tracks SET cover_image_path = 'albums/DEMIL.PNG' WHERE title = 'Ne laisse pas tes fesses téléphoner à ta place _ les choristes en voiture pour le Ouch ach chou cha ba da';
UPDATE tracks SET cover_image_path = 'albums/DEMIL.PNG' WHERE title = 'East Search in Groove';
UPDATE tracks SET cover_image_path = 'albums/DEMIL.PNG' WHERE title = 'Cgrataae';
UPDATE tracks SET cover_image_path = 'albums/DEMIL.PNG' WHERE title = 'World trip inlive _worldtrip One vs INSTRU';
UPDATE tracks SET cover_image_path = 'albums/DEMIL.PNG' WHERE title = 'AguadunFk';
UPDATE tracks SET cover_image_path = 'albums/DEMIL.PNG' WHERE title = 'Basse Besoin';
UPDATE tracks SET cover_image_path = 'albums/DEMIL.PNG' WHERE title = '3eme Jour';
UPDATE tracks SET cover_image_path = 'albums/DEMIL.PNG' WHERE title = 'World trip inlive ccby drums vs INSTRU';
UPDATE tracks SET cover_image_path = 'albums/DEMIL.PNG' WHERE title = 'la bof des vacances _ tu as les pieds mouillés n`es-tu pas allé dans l`eau... fais attention aux embruns tu risquerais de te tacher';
UPDATE albums SET cover_image_path = 'albums/DEMIL.PNG' WHERE title = 'DEM`IL Douce';

UPDATE tracks SET cover_image_path = 'albums/unknown.PNG' WHERE title = 'World trip inlive_ONe COUPAGE 237';
UPDATE albums SET cover_image_path = 'albums/unknown.PNG' WHERE title = 'unknown';

UPDATE tracks SET cover_image_path = 'artists/mozart.jpg' WHERE title = 'Симфония №40';
UPDATE albums SET cover_image_path = 'artists/mozart.jpg' WHERE title = 'Симфония №40';

UPDATE tracks SET cover_image_path = 'albums/mozart-al1.jpg' WHERE title = 'Турецкий марш';
UPDATE albums SET cover_image_path = 'albums/mozart-al1.jpg' WHERE title = 'Турецкий марш';

UPDATE tracks SET cover_image_path = 'albums/mozart-al1.jpg' WHERE title = 'Концерт для фортепиано';
UPDATE albums SET cover_image_path = 'albums/mozart-al1.jpg' WHERE title = 'Концерт для фортепиано';

UPDATE tracks SET cover_image_path = 'albums/requiem.jpeg' WHERE title = 'Реквием 1';
UPDATE tracks SET cover_image_path = 'albums/requiem.jpeg' WHERE title = 'Реквием 2';
UPDATE tracks SET cover_image_path = 'albums/requiem.jpeg' WHERE title = 'Реквием 3';
UPDATE albums SET cover_image_path = 'albums/requiem.jpeg' WHERE title = 'Реквием';

UPDATE artists SET cover_image_path = 'artists/gasnOprOd.PNG' WHERE name = 'gasnOprOd';
UPDATE artists SET cover_image_path = 'artists/mozart.jpg' WHERE name = 'Вольфганг Амадей Моцарт';
