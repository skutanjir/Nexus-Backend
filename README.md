# NEXUS E-COMMERCE BACKEND API DOCUMENTATION

## OVERVIEW

This repository contains the backend service for the Nexus E-Commerce platform. The backend is responsible for handling all business logic, database transactions, real-time communications, secure authentication, and payment gateway integrations. It acts as the central data provider for the Nexus Frontend Application.

This documentation serves as a comprehensive guide to understanding the architecture, database schema, and Application Programming Interface (API) specifications.

---

## ARCHITECTURE AND TECHNOLOGY STACK

The backend is built upon a standard monolithic architecture utilizing the Model-View-Controller (MVC) pattern conceptually, adapted for RESTful principles.

| Layer / Domain | Technology Used | Description |
|---|---|---|
| Runtime Environment | Node.js | Non-blocking, event-driven JavaScript runtime. |
| Web Framework | Express.js | Fast, unopinionated, minimalist web framework for Node.js. |
| Programming Language| TypeScript | Superset of JavaScript providing static typing for better maintainability. |
| Database | PostgreSQL | Powerful, open-source object-relational database system. |
| Database Driver | `pg` | Non-blocking PostgreSQL client for Node.js. |
| Authentication | JWT | JSON Web Tokens for stateless secure authentication. |
| Hashing | Bcrypt.js | Password hashing function for secure credential storage. |
| File Uploads | Multer | Middleware for handling `multipart/form-data`, primarily used for uploading files. |
| Real-time Engine | Socket.io | Bidirectional and low-latency communication engine. |
| Security | Helmet | Secures Express apps by setting various HTTP headers. |

---

## PROJECT DIRECTORY STRUCTURE

The project is structured logically to separate concerns and maintain code organization.

```text
nexus-backend/
├── src/
│   ├── config/             Database connection pools and third-party configuration files.
│   │   └── database.ts     PostgreSQL pool initialization.
│   ├── controllers/        Business logic and request handling.
│   ├── middleware/         Express middleware functions.
│   │   ├── auth.ts         JWT validation and role authorization (e.g., `authenticate`, `requireSeller`).
│   │   └── upload.ts       Multer configuration for avatar and product image uploads.
│   ├── routes/             API route definitions mapped to Express routers.
│   │   ├── auth.ts         Routes for login, register, and token refresh.
│   │   ├── categories.ts   Routes for category CRUD.
│   │   ├── orders.ts       Routes for order processing and tracking.
│   │   ├── payments.ts     Routes for Midtrans snap token generation and webhooks.
│   │   ├── products.ts     Routes for product catalog and reviews.
│   │   ├── profiles.ts     Routes for user profile management.
│   │   └── wishlists.ts    Routes for wishlist management.
│   ├── app.ts              Express application configuration and middleware registration.
│   └── index.ts            Entry point, HTTP server initialization, and Socket.io setup.
├── uploads/                Local directory for storing user-uploaded media (avatars, products).
├── .env.example            Template for required environment variables.
├── package.json            Project dependencies and npm scripts.
└── tsconfig.json           TypeScript compiler configuration.
```

---

## ENVIRONMENT VARIABLES

The server requires several environment variables to function correctly. Rename `.env.example` to `.env` and populate the fields based on your environment.

| Variable Name | Required | Default Value | Description |
|---|---|---|---|
| `PORT` | Yes | 5000 | The port on which the Express server will listen. |
| `DATABASE_URL` | Yes | - | Full PostgreSQL connection string (`postgresql://user:pass@host:port/dbname`). |
| `JWT_SECRET` | Yes | - | Cryptographic key used to sign and verify Access Tokens. |
| `JWT_REFRESH_SECRET` | Yes | - | Cryptographic key used to sign and verify Refresh Tokens. |
| `UPLOAD_DIR` | No | `./uploads` | Directory path where uploaded files will be stored. |
| `FRONTEND_URL` | Yes | `http://localhost:5173` | Allowed origin for Cross-Origin Resource Sharing (CORS). |

---

## DATABASE SCHEMA

The PostgreSQL database enforces relational integrity using UUIDs as primary keys.

### 1. `users`
Core authentication table storing credentials.
- `id` (UUID, Primary Key)
- `email` (VARCHAR, Unique)
- `password_hash` (VARCHAR)
- `created_at` (TIMESTAMP)

### 2. `profiles`
Extended user information linked directly to the `users` table. Contains role definitions.
- `id` (UUID, Primary Key, Foreign Key to `users.id`)
- `full_name` (VARCHAR)
- `avatar_url` (VARCHAR)
- `role` (VARCHAR) - Values: `user`, `seller`.
- `phone` (VARCHAR)
- `gender` (VARCHAR)
- `updated_at` (TIMESTAMP)

### 3. `categories`
Product categorization taxonomy.
- `id` (UUID, Primary Key)
- `name` (VARCHAR)
- `slug` (VARCHAR, Unique)
- `icon` (VARCHAR)
- `description` (TEXT)
- `image_url` (VARCHAR)

### 4. `products`
The main inventory table.
- `id` (UUID, Primary Key)
- `seller_id` (UUID, Foreign Key to `profiles.id`)
- `category_id` (UUID, Foreign Key to `categories.id`)
- `name` (VARCHAR)
- `description` (TEXT)
- `price` (DECIMAL)
- `stock` (INTEGER)
- `image_url` (VARCHAR)
- `is_archived` (BOOLEAN) - Used for soft-deleting products.
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### 5. `orders`
Header table for customer orders.
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to `profiles.id`)
- `status` (VARCHAR) - Values: `pending`, `shipped`, `delivered`, `completed`, `cancelled`.
- `payment_status` (VARCHAR) - Values: `unpaid`, `paid`, `refunded`.
- `snap_token` (VARCHAR) - Token specific to Midtrans payment gateway.
- `shipping_address` (TEXT)
- `total_amount` (DECIMAL)
- `created_at` (TIMESTAMP)

### 6. `order_items`
Line items associated with a specific order.
- `id` (UUID, Primary Key)
- `order_id` (UUID, Foreign Key to `orders.id`)
- `product_id` (UUID, Foreign Key to `products.id`)
- `quantity` (INTEGER)
- `price_at_purchase` (DECIMAL)

### 7. `product_reviews`
Customer reviews for purchased products.
- `id` (UUID, Primary Key)
- `product_id` (UUID, Foreign Key to `products.id`)
- `user_id` (UUID, Foreign Key to `profiles.id`)
- `rating` (INTEGER) - 1 to 5.
- `comment` (TEXT)
- `seller_reply` (TEXT)
- `is_anonymous` (BOOLEAN)
- `created_at` (TIMESTAMP)

### 8. `chat_messages`
Real-time messaging history between buyers and sellers.
- `id` (UUID, Primary Key)
- `sender_id` (UUID, Foreign Key to `profiles.id`)
- `receiver_id` (UUID, Foreign Key to `profiles.id`)
- `message` (TEXT)
- `image_url` (VARCHAR)
- `message_type` (VARCHAR) - Values: `text`, `image`, `system`.
- `created_at` (TIMESTAMP)

---

## REST API REFERENCE

The backend exposes a standard RESTful HTTP API on the `/api` route.

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/auth/register` | Register a new user account and profile. | No |
| POST | `/api/auth/login` | Authenticate user and return access token + HTTP-Only refresh cookie. | No |
| POST | `/api/auth/refresh` | Generate a new access token using the validation of the refresh cookie. | Cookie Required |
| POST | `/api/auth/logout` | Terminate session by clearing the HTTP-Only refresh cookie. | Cookie Required |

### Profiles (`/api/profiles`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/profiles/me` | Retrieve the authenticated user's profile details. | Yes |
| GET | `/api/profiles/:id` | Retrieve any public profile details (e.g., Seller information). | No |
| PUT | `/api/profiles/me` | Update the current user's general profile information. | Yes |
| PUT | `/api/profiles/me/password`| Update the current user's password. | Yes |
| POST | `/api/profiles/me/avatar`| Upload a new avatar image using multipart form-data. | Yes |

### Products (`/api/products`)
| Method | Endpoint | Description | Auth Required | Minimum Role |
|---|---|---|---|---|
| GET | `/api/products` | Get list of all active products. | No | - |
| GET | `/api/products/:id` | Get details of a single product including its reviews. | No | - |
| POST | `/api/products` | Create a new product. | Yes | Seller |
| PUT | `/api/products/:id` | Update an existing product's metadata. | Yes | Seller |
| DELETE | `/api/products/:id` | Soft-delete (archive) a product. | Yes | Seller |
| POST | `/api/products/:id/reviews`| Post a review for a purchased product. | Yes | User |

### Categories (`/api/categories`)
| Method | Endpoint | Description | Auth Required | Minimum Role |
|---|---|---|---|---|
| GET | `/api/categories` | Retrieve all categories. | No | - |
| POST | `/api/categories` | Create a new product category. | Yes | Seller |
| PUT | `/api/categories/:id` | Update an existing category. | Yes | Seller |
| DELETE | `/api/categories/:id` | Delete a category. | Yes | Seller |

### Orders (`/api/orders`)
| Method | Endpoint | Description | Auth Required | Minimum Role |
|---|---|---|---|---|
| GET | `/api/orders` | Get all orders associated with the user/seller. | Yes | User/Seller |
| GET | `/api/orders/:id` | Get explicit details of a specific order. | Yes | User/Seller |
| POST | `/api/orders` | Create a new order from cart payload. | Yes | User |
| PUT | `/api/orders/:id/status` | Modify logistics status of an order. | Yes | Seller |
| PUT | `/api/orders/:id/complete`| Mark order as completed by user. | Yes | User |

### Wishlists (`/api/wishlists`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/wishlists` | Retrieve current user's wishlist contents. | Yes |
| POST | `/api/wishlists` | Add a product to the user's wishlist. | Yes |
| DELETE | `/api/wishlists/:id` | Remove a product from the user's wishlist. | Yes |

---

## REAL-TIME COMMUNICATIONS

The backend utilizes Socket.io to provide real-time updates without relying on long-polling.

### Connection Architecture
1. Client connects to `http://localhost:5000`.
2. Client emits `join` event providing their profile ID securely.
3. Server registers the socket to a room identical to the user's ID.

### Supported Events
| Event Name | Direction | Payload Structure | Description |
|---|---|---|---|
| `join` | Client -> Server | `userId: string` | Authorize connection into a dedicated broadcast room. |
| `send_message` | Client -> Server | `{ sender_id, receiver_id, message }` | Commits message to Database and broadcasts to `receiver_id`. |
| `receive_message` | Server -> Client | `ChatMessageObject` | Triggered strictly on the receiver's end to update the UI instantly. |
| `read_receipt` | Client -> Server | `{ message_id }` | Confirms message readability. |

---

## ERROR HANDLING PROTOCOLS

Standardized response format is enforced across the application to ensure client interoperability. Failures return predictable HTTP status codes ranging from `400` to `500`.

- `400 Bad Request`: Missing mandatory parameters or schema mistmatch.
- `401 Unauthorized`: Token absence or explicit expiration.
- `403 Forbidden`: Authenticated, but role privileges are inadequate.
- `404 Not Found`: The queried UUID does not map inside PostgreSQL.
- `500 Internal Server Error`: Server caught an unexpected exception or database failure.

Example Error Response:
```json
{
  "error": "You can only review products you have purchased and received."
}
```

---

## INITIATION AND STARTUP GUIDELINES

1. Ensure the PostgreSQL database is alive and accessible.
2. Ensure you have populated `.env` adhering exclusively to absolute paths and valid driver formats.
3. Execute `npm install` inside the backend root.
4. If this is a fresh setup, you must run table synchronizations:
   ```bash
   npm run db:init
   ```
5. Spin up the cluster using the development wrapper or production script:
   ```bash
   npm run dev
   # OR
   npm run build && npm start
   ```