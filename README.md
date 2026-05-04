# EduTrack — LMS Platform

Система управления обучением (Learning Management System) на основе гексагональной архитектуры.

---

## Стек технологий

| Слой | Технологии |
|------|-----------|
| Backend | Java 17, Spring Boot 3.4.1, Spring Security (OAuth2 JWT) |
| База данных | PostgreSQL + Flyway (миграции) |
| Брокер сообщений | Apache Kafka (аудит событий) |
| Кэш | Redis |
| Хранилище файлов | Supabase Storage |
| Аутентификация | Supabase Auth (JWT HS256) |
| Маппинг | MapStruct |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS 4 |
| Тесты | JUnit 5, Mockito, Testcontainers (PostgreSQL, Kafka, Redis) |
| Документация API | Swagger UI (springdoc-openapi 2.7) |

---

## Архитектура

Проект построен по принципам **гексагональной архитектуры** (Ports & Adapters):

```
┌─────────────────────────────────────────────────────┐
│                   Web (Controllers)                  │  ← входящие адаптеры
├─────────────────────────────────────────────────────┤
│              Application (Use Cases / Services)      │  ← бизнес-логика
├─────────────────────────────────────────────────────┤
│                  Domain (Models, Ports)              │  ← ядро
├─────────────────────────────────────────────────────┤
│   Infrastructure (JPA, Kafka, Supabase Storage)      │  ← исходящие адаптеры
└─────────────────────────────────────────────────────┘
```

**Пакеты:**
- `domain` — модели предметной области и интерфейсы портов (нет зависимостей от Spring)
- `application` — сервисы, DTO, маппинг
- `infrastructure` — реализации портов: JPA-репозитории, Kafka-продюсер, Supabase Storage
- `web` — REST-контроллеры, request/response объекты, обработчики ошибок

---

## Функциональность

### Для преподавателей
- Создание и редактирование курсов (модули, темы, материалы)
- Публикация / снятие с публикации курса
- Установка дедлайнов на темы
- Просмотр сданных работ студентов
- Выставление оценок (0–100) с комментарием через журнал успеваемости
- Дашборд: статистика курсов, количество студентов, ожидающие проверки

### Для студентов
- Просмотр опубликованных курсов
- Запись / отписка от курсов
- Сдача работ по темам (PDF, Word, Excel, PowerPoint, TXT, ZIP, JPEG, PNG; до 20 МБ)
- Просмотр оценок и комментариев преподавателя
- Страница «Мои курсы» с прогрессом по записанным курсам

### Общее
- In-app уведомления (преподаватель получает уведомление о новой сдаче, студент — об оценке)
- Аудит всех действий через Kafka
- Swagger UI для тестирования API

---

## Запуск проекта

### Предварительные требования

- Java 17+
- Maven 3.9+
- Node.js 20+
- Docker & Docker Compose (для PostgreSQL, Kafka, Redis)
- Аккаунт [Supabase](https://supabase.com) (auth + storage)

### 1. Настройка Supabase

1. Создайте проект в Supabase
2. В разделе **Authentication → Settings** скопируйте `JWT Secret`
3. В разделе **Storage** создайте публичный bucket с именем `edutrack`
4. Скопируйте `Project URL` и `Service Role Key`

### 2. Переменные окружения

Создайте файл `src/main/resources/application-local.yml` (или задайте переменные среды):

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/edutrack
    username: postgres
    password: postgres

supabase:
  jwt-secret: <ваш JWT Secret из Supabase>
  url: <Project URL>
  service-key: <Service Role Key>
  bucket: edutrack
```

### 3. Запуск инфраструктуры

```bash
docker compose up -d
```

### 4. Запуск бэкенда

```bash
mvn clean spring-boot:run
```

Flyway автоматически применит все миграции при старте.

### 5. Запуск фронтенда

```bash
cd frontend
npm install
npm run dev
```

Приложение доступно на `http://localhost:5173`

### 6. Swagger UI

После запуска бэкенда: `http://localhost:8080/swagger-ui/index.html`

Нажмите **Authorize** и вставьте JWT токен из Supabase для тестирования защищённых эндпоинтов.

---

## Запуск тестов

```bash
mvn test
```

Тесты используют Testcontainers — Docker должен быть запущен. Поднимаются изолированные контейнеры PostgreSQL, Kafka и Redis.

**Покрытие:**
- Unit-тесты: `CourseService`, `UserService`, `SubmissionService`
- Интеграционные тесты: `CourseController`, `UserController`, `AuditFlow`

---

## Структура БД (основные таблицы)

```
users
courses          → teacher_id (FK users)
course_modules   → course_id (FK courses)
topics           → module_id (FK course_modules), deadline
materials        → topic_id (FK topics)
enrollments      → student_id, course_id
submissions      → topic_id, student_id, deadline check on submit
grades           → submission_id, teacher_id
notifications    → user_id
audit_logs       → actor_id, target_id
```

---

## Роли пользователей

| Роль | Возможности |
|------|-------------|
| `STUDENT` | Просмотр курсов, запись, сдача работ, просмотр оценок |
| `TEACHER` | Всё из STUDENT + управление своими курсами, выставление оценок |
| `ADMIN` | Все возможности TEACHER для любого курса |

Роль хранится в `app_metadata.role` в JWT токене Supabase.
