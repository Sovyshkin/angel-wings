# Peptidi Shop - Backend + Admin

## Стек

- **Backend**: Node.js + Express + Prisma ORM
- **Database**: PostgreSQL
- **Frontend Admin**: Vue 3 + Vite + Pinia
- **Auth**: JWT

## Запуск

### 1. База данных

```bash
# Установка PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Создание БД
createdb peptidi
```

### 2. Backend

```bash
cd server

# Установка зависимостей
npm install

# Настройка .env
cp .env.example .env
# Отредактируй .env с своими параметрами подключения к PostgreSQL

# Генерация Prisma клиента и миграция
npx prisma generate
npx prisma db push

# Заполнение БД тестовыми данными
npm run db:seed

# Запуск dev сервера
npm run dev
```

### 3. Admin Panel

```bash
cd admin

# Установка зависимостей
npm install

# Запуск dev сервера
npm run dev
```

## Доступы

После `npm run db:seed`:

- **Admin**: `admin@peptidi.shop` / `admin123`
- **Админка**: `http://localhost:5173/admin`

## API Endpoints

### Auth
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/me` - Текущий пользователь

### Products (public)
- `GET /api/products` - Список товаров
- `GET /api/products/:slug` - Один товар

### Products (admin)
- `POST /api/products` - Создать
- `PUT /api/products/:id` - Обновить
- `DELETE /api/products/:id` - Удалить

### Categories
- `GET /api/categories` - Список
- `POST /api/categories` - Создать (admin)
- `PUT /api/categories/:id` - Обновить (admin)
- `DELETE /api/categories/:id` - Удалить (admin)

### Orders
- `POST /api/orders` - Создать заказ
- `GET /api/orders/my` - Мои заказы (auth)
- `GET /api/orders/:id` - Детали заказа (auth)
- `PUT /api/orders/:id/status` - Статус (admin)

### Admin
- `GET /api/admin/stats` - Статистика
- `GET /api/admin/users` - Пользователи
- `POST /api/admin/users` - Создать пользователя
- `GET /api/admin/products` - Все товары
- `GET /api/admin/orders` - Все заказы

## Структура файлов

```
server/
├── src/
│   ├── index.js          # Express app
│   ├── routes/           # API routes
│   ├── middleware/       # Auth, error handling
│   └── utils/            # File upload
├── prisma/
│   ├── schema.prisma     # DB models
│   └── seed.js           # Test data
└── package.json

admin/
├── src/
│   ├── views/            # Admin pages
│   ├── store/            # Pinia stores
│   └── router/           # Vue Router
└── package.json
```