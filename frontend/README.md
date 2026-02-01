# MusicApp Frontend

Angular-приложение для музыкального стриминга.

## Запуск

1. Установите зависимости:
```bash
npm install
```

2. Запустите dev-сервер:
```bash
npm start
```

Приложение откроется на `http://localhost:4200`

## Прокси

API-запросы к `/api/*` проксируются на `http://localhost:8080` (Spring Boot backend).

## Структура

- `src/app/models/` - TypeScript интерфейсы
- `src/app/services/` - Сервисы (AuthService)
- `src/app/components/` - Компоненты (Register, Dashboard)
- `src/app/interceptors/` - HTTP-перехватчики (JWT)

## Компоненты

### Register
Страница регистрации с валидацией полей:
- Username (2-50 символов)
- Email (валидный email)
- Password (минимум 6 символов)

После успешной регистрации пользователь перенаправляется на Dashboard.

### Dashboard
Простая страница с информацией о пользователе и кнопкой выхода.
