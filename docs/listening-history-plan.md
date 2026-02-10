# План: история прослушиваний (треки)

Сохраняем в БД только факты прослушивания **треков** пользователем. Альбомы и плейлисты как сущности в историю не пишем — при отображении «Недавно прослушанное» показываем треки с датой/временем прослушивания.

---

## Итоговый выбор

| # | Решение |
|---|--------|
| 1 | DTO: вложенный `TrackResponse` + `playedAt` |
| 2 | В DTO отдавать `id` записи истории (для будущего «удалить из истории») |
| 3 | URL: `/api/listen-history` |
| 4 | POST: путь `POST /api/listen-history/tracks/{trackId}` (тело пустое) |
| 5 | Ответ POST: 204 No Content |
| 6 | Дедупликация не делать — каждое нажатие Play = новая запись |
| 7 | Метод очистки старых записей в репозитории не добавлять в первую версию |
| 8 | recordPlay вызывать в PlayerService при установке трека |
| 9 | Показывать только отдельную страницу (например `/history` или `/recent`) |
| 10 | Модель: отдельный файл `models/listen-history.model.ts` |

---

## 1. Backend

### 1.1 Сущность

**Файл:** `entity/ListenHistory.java`

- `id` (Long, PK, generated)
- `user` (ManyToOne → User, nullable = false)
- `track` (ManyToOne → Track, nullable = false)
- `playedAt` (Instant, nullable = false) — момент прослушивания

Один и тот же трек может быть в истории много раз (каждое воспроизведение — новая запись). Индексы: по `user_id` и по `(user_id, played_at DESC)` для быстрой выборки «последние N для пользователя».

```java
@Entity
@Table(name = "listen_history", indexes = {
    @Index(name = "idx_listen_history_user_played", columnList = "user_id, played_at DESC")
})
```

Связи: `@ManyToOne(fetch = FetchType.LAZY)` к User и Track.

### 1.2 Репозиторий

**Файл:** `repository/ListenHistoryRepository.java`

- `Page<ListenHistory> findByUserIdOrderByPlayedAtDesc(Long userId, Pageable pageable);`

### 1.3 DTO

**Файл:** `dto/history/ListenHistoryItemResponse.java`

- `Long id` — id записи истории (для будущего «удалить из истории»)
- `TrackResponse playedTrack` — полные данные трека
- `Instant playedAt` — момент прослушивания

### 1.4 Сервис

**Файл:** `service/ListenHistoryService.java`

- **recordPlay(Long userId, Long trackId)**  
  - User передаётся из контроллера. Найти Track по trackId (или через TrackService).  
  - Создать `ListenHistory(user, track, Instant.now())`, сохранить. Дубликаты не подавлять — каждое нажатие Play даёт новую запись.

- **getHistory(Long userId, Pageable pageable): Page<ListenHistoryItemResponse>**  
  - Выбрать `ListenHistory` по `userId` с сортировкой `playedAt DESC`, маппить в DTO с полным `TrackResponse` (через существующий TrackService или маппер).

Зависимости: `ListenHistoryRepository`, `TrackRepository`/`TrackService` для проверки существования трека и маппинга в `TrackResponse`. User приходит из контроллера.

### 1.5 Контроллер

**Файл:** `controller/ListenHistoryController.java`  
**Базовый путь:** `/api/listen-history`

- **POST /api/listen-history/tracks/{trackId}**  
  - Тело пустое. Авторизация: только аутентифицированный пользователь.  
  - Вызов `listenHistoryService.recordPlay(securityUser.getUser().getId(), trackId)`.  
  - Ответ: **204 No Content**.

- **GET /api/listen-history**  
  - Query: стандартный `Pageable` (page, size). Авторизация: только свой пользователь.  
  - Вернуть `Page<ListenHistoryItemResponse>` (id записи + трек + дата прослушивания).

Правила безопасности: только свой userId (из `SecurityUser`); чужие истории не отдавать и не писать от чужого имени.

### 1.6 Безопасность

- В `SecurityConfig` отдельно ничего менять не обязательно: `/api/**` уже требует аутентификации, кроме явно разрешённых маршрутов.  
- Эндпоинты истории находятся под `/api/...`, значит доступ только для авторизованных.

### 1.7 Миграция БД

При использовании `ddl-auto=create` таблица `listen_history` создастся по entity.  
Для продакшена (Flyway/Liquibase) — отдельная миграция с созданием таблицы и индекса по `(user_id, played_at DESC)`.

---

## 2. Frontend

### 2.1 Модель

**Файл:** `models/listen-history.model.ts`

- Интерфейс элемента истории: `id: number`, `playedTrack: TrackResponse`, `playedAt: string` (ISO date).
- Тип страницы (если нужен): `Page<ListenHistoryItem>` с полями `content`, `totalElements`, `totalPages` и т.д.

### 2.2 API-сервис

**Файл:** `services/listen-history.service.ts`

- **recordPlay(trackId: number): Observable<void>**  
  - POST к `/api/listen-history/tracks/${trackId}` (тело пустое).  
  - Не требовать ответа в UI (fire-and-forget), при ошибке логировать или показывать тост.

- **getHistory(params?: { page: number; size: number }): Observable<Page<ListenHistoryItem>>**  
  - GET `/api/listen-history?page=0&size=20`.  
  - Возвращать тип с `content: ListenHistoryItem[]`, `totalElements`, `totalPages` и т.д. (как у других пагинированных API в проекте).

Зависимость: `HttpClient`, при необходимости — `AuthService` (если нужен токен; обычно достаточно интерцептора).

### 2.3 Когда записывать прослушивание

Вызов в **PlayerService** при установке текущего трека — в методе `doLoadAndPlay(track)` после `currentTrackSubject.next(track)` (при смене трека, не при паузе/play того же трека).  
Передать в PlayerService зависимость от `ListenHistoryService` и (для проверки «авторизован ли пользователь») от `AuthService`. Если `currentUser` есть — вызвать `listenHistoryService.recordPlay(track.id)` (fire-and-forget, без подписки в UI).

Важно: не вызывать record при каждом `playRequest$` (воспроизведение/пауза одного и того же трека), только при смене трека.

### 2.4 Отображение истории

- **Отдельная страница «Недавно прослушанное»**  
  - Маршрут: например `/history` или `/recent`. Компонент при загрузке вызывает `listenHistoryService.getHistory({ page: 0, size: 20 })` (с пагинацией при необходимости).  
  - Список: дата/время + название трека, артист, обложка; клик — воспроизведение через `playerService.setCurrentTrack(item.playedTrack)`.  
  - Доступ: только для авторизованных (`authGuard`), так как история персональная. В сайдбаре добавить пункт «История» / «Недавно прослушанное» со ссылкой на эту страницу.

### 2.5 Ошибки и граничные случаи

- Не авторизован: не вызывать `recordPlay` (на фронте проверять `currentUser`).  
- Ошибка POST (сеть/401): не блокировать воспроизведение, только логировать или показать мягкое уведомление.  
- Пустая история: показывать заглушку «Вы ещё ничего не слушали».

---

## 3. Порядок реализации

| Шаг | Задача | Где |
|-----|--------|-----|
| 1 | Entity `ListenHistory`, репозиторий | Backend |
| 2 | DTO `ListenHistoryItemResponse`, сервис `ListenHistoryService` (record + getHistory) | Backend |
| 3 | Контроллер `ListenHistoryController` (POST record, GET history) | Backend |
| 4 | Модель и `ListenHistoryService` (Angular) | Frontend |
| 5 | Вызов `recordPlay(trackId)` при старте воспроизведения трека (только для авторизованных) | Frontend (PlayerService) |
| 6 | Компонент «Недавно прослушанное» + вывод списка | Frontend |
| 7 | Отдельная страница истории + пункт в сайдбаре (ссылка на страницу) | Frontend |

---

## 4. Опционально (позже)

- Ограничение размера истории на пользователя (например, хранить последние 500 записей, удалять старые по cron или при записи).
- Дедупликация подряд: не писать вторую запись, если тот же трек играл только что (например, в течение 30 секунд).
- Учёт позиции прослушивания (сколько секунд дослушали) — отдельная сущность/поля при необходимости аналитики.

После выполнения плана прослушивания треков будут сохраняться в БД и отображаться на отдельной странице «Недавно прослушанное» только для треков, без отдельного сохранения альбомов и плейлистов.
