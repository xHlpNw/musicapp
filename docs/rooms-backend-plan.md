# План доработки бэкенда для функционала комнат

## Текущее состояние бэкенда

### Уже реализовано

- **Сущности (JPA)**
  - `Room`: id, name, host (User), currentTrack (Track), positionSeconds, playing, maxMembers, createdAt, updatedAt, очередь (`RoomQueueItem`), участники (`RoomMember`).
  - `RoomMember`: комната, пользователь, joinedAt. Один пользователь может быть только в одной комнате (unique на user_id в таблице room_members).
  - `RoomQueueItem`: комната, трек, position.

- **API (RoomsController)**
  - `GET /api/rooms` — список комнат, где текущий пользователь **хост или участник** (только «мои» комнаты).
  - `GET /api/rooms/{id}` — детали комнаты (только для участника).
  - `POST /api/rooms` — создание комнаты (CreateRoomRequest: name, maxMembers).
  - `POST /api/rooms/{id}/join` — войти в комнату (при входе в другую — выход из текущей).
  - `POST /api/rooms/{id}/leave` — выйти из комнаты.
  - `PUT /api/rooms/{id}/state` — обновить состояние (currentTrackId, positionSeconds, playing; только хост).
  - `POST /api/rooms/{id}/queue?trackId=` — добавить трек в очередь (только хост).
  - `DELETE /api/rooms/{id}/queue/{queueItemId}` — удалить из очереди (только хост).

- **Безопасность**
  - Все эндпоинты `/api/rooms/**` требуют аутентификации (нет `permitAll`).

- **DTO**
  - `RoomResponse`: id, name, hostId, hostUsername, currentTrackId, positionSeconds, playing, memberCount, maxMembers, createdAt, updatedAt, queue, members.
  - Нет полей для отображения текущего трека в списке/карточке: **currentTrackTitle**, **currentTrackCoverPath**.

---

## Что нужно сделать для страницы «Комнаты» на фронте

Фронт ожидает:
- Блок «Популярные сейчас» — список комнат с сортировкой по «популярности» (например, по числу участников или активности).
- Блок «Все комнаты» — список с фильтрами: **Все** / **Открытые** / **Мои**, поиск по названию/хосту/треку, пагинация.
- В карточке комнаты: название, хост, число участников, обложка и название текущего трека, кнопка «Присоединиться».

Ниже — план изменений по бэкенду и один пункт по фронту.

---

## 1. Расширить RoomResponse для списков и карточек

**Цель:** не дергать отдельно треки по `currentTrackId` для каждой карточки.

**Действия:**
- В `RoomResponse` добавить:
  - `currentTrackTitle` (String, nullable) — название текущего трека.
  - `currentTrackCoverPath` (String, nullable) — путь обложки (как в Track, для URL вида `/api/covers/...`).
- В `RoomService` при сборке `toResponse()` и `toDetailResponse()` заполнять эти поля из `room.getCurrentTrack()` (title, coverImagePath).

**Файлы:** `RoomResponse.java`, `RoomService.java`.

---

## 2. Список комнат с фильтром и пагинацией (discover)

**Цель:** один эндпоинт для блока «Все комнаты» с фильтрами «Все» / «Открытые» / «Мои» и поиском.

**Вариант A (рекомендуемый):** расширить `GET /api/rooms` query-параметрами, сохранив обратную совместимость.

- Параметры:
  - `filter` = `all` | `open` | `mine` (по умолчанию `mine` — текущее поведение).
  - `q` — поиск по названию комнаты, имени хоста, названию текущего трека (опционально).
  - `page`, `size` — пагинация (например, по умолчанию page=0, size=24).
- Поведение:
  - `filter=mine` — как сейчас: комнаты, где пользователь хост или участник (без пагинации или с пагинацией — на выбор).
  - `filter=all` — все комнаты (для discover), с пагинацией.
  - `filter=open` — комнаты, в которые можно войти: `maxMembers == null || memberCount < maxMembers`.
- Ответ: `Page<RoomResponse>` (или обёртка с content, totalElements, totalPages, size, number).

**Действия:**
- В `RoomRepository` добавить:
  - `Page<Room> findAll(Pageable pageable)` или с поддержкой поиска (например, через `@Query` по name, host.username, currentTrack.title).
- В `RoomService`:
  - Метод `Page<RoomResponse> findRooms(User user, String filter, String q, Pageable pageable)`.
  - Для `mine` — оставить логику «хост или участник», при необходимости с пагинацией в памяти или через отдельный запрос.
  - Для `all` / `open` — выборка из репозитория с учётом `q`, для `open` — отфильтровать по `memberCount` и `maxMembers` (или вынести в запрос через подзапрос/джойн).
- В `RoomsController` заменить текущий `GET /api/rooms` на вызов нового метода с параметрами `filter`, `q`, `Pageable`; вернуть `Page<RoomResponse>`.

**Файлы:** `RoomRepository.java`, `RoomService.java`, `RoomsController.java`.

---

## 3. Эндпоинт «Популярные комнаты»

**Цель:** отдать топ комнат для блока «Популярные сейчас».

**Действия:**
- Добавить `GET /api/rooms/popular?limit=10` (или использовать общий список с `sort=memberCount,desc` и limit).
- В репозитории: метод вида `List<Room> findTopByOrderByMemberCountDesc(Pageable pageable)`. Подсчёт участников — через `RoomMemberRepository.countByRoom(room)`, поэтому либо:
  - на уровне БД: нативный запрос / подзапрос с группировкой по room_id и count(members), и сортировка по этому count; либо
  - вытащить все комнаты с пагинацией и отсортировать в сервисе по memberCount (проще, но менее масштабируемо).
- Альтернатива: сортировка по `updatedAt` desc — «недавно активные» комнаты.
- В контроллере — новый метод, возвращающий `List<RoomResponse>` с лимитом.

**Файлы:** `RoomRepository.java` (или только сервис), `RoomService.java`, `RoomsController.java`.

---

## 4. Доступ к деталям комнаты для «присоединиться»

**Цель:** перед присоединением пользователь должен видеть название, хост, количество участников, текущий трек — без необходимости быть участником.

**Текущее состояние:** `GET /api/rooms/{id}` возвращает 403, если пользователь не участник.

**Действия:**
- Ввести «краткий» ответ для не-участников: только поля, нужные для карточки (id, name, hostId, hostUsername, memberCount, maxMembers, currentTrackId, currentTrackTitle, currentTrackCoverPath, createdAt/updatedAt), без queue и members (или с queue только как id треков).
- Варианты реализации:
  - Отдельный DTO `RoomSummaryResponse` и эндпоинт `GET /api/rooms/{id}/summary` без проверки членства (доступен любому авторизованному).
  - Или один `GET /api/rooms/{id}` с разным телом ответа: полный `RoomResponse` для участника, краткий — для остальных (тогда «присоединиться» не требует предзапроса деталей, если карточка уже строится из списка).

Рекомендация: оставить `GET /api/rooms/{id}` для участников (полный ответ), добавить `GET /api/rooms/{id}/summary` (или `GET /api/rooms/{id}?summary=true`) для карточки/превью без членства.

**Файлы:** при необходимости — `RoomSummaryResponse.java`, `RoomService.java`, `RoomsController.java`.

---

## 5. Публичный список комнат (опционально)

**Цель:** показывать список комнат без авторизации (например, на лендинге).

**Действия:**
- В `SecurityConfig` разрешить `GET /api/rooms` или `GET /api/rooms/browse` с `permitAll()` с ограничением только на чтение (без join/create).
- Ответ при этом — только публичные поля (без queue/members или с минимумом), пагинация. «Присоединиться» и «Создать комнату» на фронте требуют логина.

Можно отложить и оставить все эндпоинты комнат только для авторизованных пользователей.

**Файлы:** `SecurityConfig.java`, при необходимости — отдельный контроллер или метод с ограниченным DTO.

---

## 6. Фронтенд: подключение к API

**Цель:** страница «Комнаты» работает с реальными данными.

**Действия:**
- Сервис `RoomService` (Angular): методы `getPopular(limit?)`, `getRooms(filter, q, page, size)`, `getById(id)`, `create(body)`, `join(id)`, `leave(id)` и при необходимости `getSummary(id)`.
- Модели/интерфейсы под `RoomResponse` (и при наличии — под краткий ответ/пагинацию).
- На странице «Комнаты»:
  - «Популярные сейчас» — запрос к `GET /api/rooms/popular`.
  - «Все комнаты» — запрос к `GET /api/rooms?filter=...&q=...&page=&size=`, фильтр «Все»/«Открытые»/«Мои» и поиск.
  - Кнопка «Создать комнату» — вызов API создания, затем переход в комнату или обновление списка.
  - Кнопка «Присоединиться» — `POST /api/rooms/{id}/join`, затем переход в комнату.
- Страница комнаты (отдельный маршрут, например `/rooms/:id`): загрузка по `GET /api/rooms/{id}`, плеер/очередь/участники по текущему API (state, queue, leave).

**Файлы:** `frontend/src/app/services/room.service.ts`, `frontend/src/app/models/room.model.ts`, компоненты страницы комнат и списка.

---

## 7. Синхронизация воспроизведения в комнате (фаза 2)

**Цель:** у всех участников комнаты одинаковое состояние: трек, позиция, play/pause.

**Текущее состояние:** папка `websocket` пуста, синхронизация не реализована.

**Действия (позже):**
- Поднять WebSocket (или SSE): например, `STOMP` над SockJS, эндпоинт вида `/ws/rooms/{roomId}`.
- События: смена трека, изменение position, play/pause — инициируются хостом (через вызовы `PUT /api/rooms/{id}/state` или отдельные команды по WebSocket), сервер рассылает состояние всем подписчикам комнаты.
- Клиент в комнате подписывается на топик комнаты и обновляет локальный плеер при получении событий; действия хоста дублируются через API или только через WebSocket.

Это можно оформить отдельным планом после того, как список комнат и join/leave будут работать.

---

## Порядок внедрения (кратко)

1. **RoomResponse + currentTrackTitle, currentTrackCoverPath** — быстро, сразу полезно для карточек.
2. **GET /api/rooms с filter, q, page, size** и реализация `all` / `open` / `mine` в сервисе и репозитории.
3. **GET /api/rooms/popular** для блока «Популярные сейчас».
4. При необходимости — **GET /api/rooms/{id}/summary** (или аналог) для превью без членства.
5. **Фронт:** RoomService, модели, подвязка страницы «Комнаты» и страницы комнаты к API.
6. (Позже) WebSocket для синхронизации воспроизведения в комнате.

---

## Замечания

- **RoomMember** с unique на `user_id` означает «один пользователь — одна комната»; при join в другую комнату текущая покидается — это уже реализовано в `RoomService.join`.
- «Открытая» комната = можно войти: `maxMembers == null || memberCount < maxMembers`; отдельного поля `isOpen` в БД не требуется.
- Пагинация для `filter=mine` может быть в памяти (список обычно небольшой) или через отдельный запрос с join по members — по желанию.
