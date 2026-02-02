# Как загрузить трек в базу

Трек можно загрузить двумя способами: через веб-интерфейс админки или через API (curl/Postman).

---

## 1. Через админку (рекомендуется)

1. Войдите в приложение (зарегистрируйтесь или войдите).
2. Перейдите в **Админка** → **Треки**.
3. Нажмите **«Загрузить трек»**.
4. Заполните форму:
   - **Аудиофайл** — выберите файл (MP3, WAV, OGG и т.д.).
   - **Название трека** — обязательно.
   - **Исполнитель** — выберите из списка или введите имя нового (создастся при загрузке).
   - **Альбом** — по желанию (появляется после выбора исполнителя).
   - **Номер в альбоме** — по желанию.
   - **Длительность (секунды)** — обязательно (можно посмотреть в плеере или в свойствах файла).
5. Нажмите **«Загрузить»**.

После успешной загрузки трек появится в списке треков и на главной странице — его можно воспроизводить.

---

## 2. Через API (curl)

Эндпоинт: **POST** `/api/tracks`  
Тип запроса: **multipart/form-data**  
Авторизация: заголовок **Authorization: Bearer &lt;JWT&gt;**

Обязательные поля:
- `file` — аудиофайл
- `title` — название трека
- `durationSeconds` — длительность в секундах (целое число)
- Исполнитель: либо `artistId` (id существующего), либо `artistName` (имя; при отсутствии исполнитель будет создан)

Опционально: `albumId`, `trackNumber`.

### Пример (Windows PowerShell)

Сначала получите JWT (логин):

```powershell
$login = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"password"}'
$token = $login.accessToken
```

Загрузка трека:

```powershell
$headers = @{ "Authorization" = "Bearer $token" }
$form = @{
    file = Get-Item -Path "C:\path\to\your\track.mp3"
    title = "Название трека"
    durationSeconds = 180
    artistName = "Исполнитель"
}
Invoke-RestMethod -Uri "http://localhost:8080/api/tracks" -Method POST -Headers $headers -Form $form
```

### Пример (curl, Linux/macOS)

```bash
# 1. Получить токен
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}' | jq -r '.accessToken')

# 2. Загрузить трек
curl -X POST http://localhost:8080/api/tracks \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/track.mp3" \
  -F "title=Название трека" \
  -F "durationSeconds=180" \
  -F "artistName=Исполнитель"
```

С существующим исполнителем и альбомом:

```bash
curl -X POST http://localhost:8080/api/tracks \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@track.mp3" \
  -F "title=Come Together" \
  -F "durationSeconds=259" \
  -F "artistId=1" \
  -F "albumId=1" \
  -F "trackNumber=1"
```

---

## Где слушать

После загрузки откройте **Главная** (или `/home`) — трек будет в списке. Выберите его и нажмите Play в плеере внизу страницы.
