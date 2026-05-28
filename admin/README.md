# OsunGist Admin

## Project Overview

OsunGist is a full-stack blogging and community platform. It is built as a three-part workspace:

- `client/` — the public Next.js frontend for readers and writers
- `server/` — the Express/MongoDB backend API and application logic
- `admin/` — the administration dashboard for managing users, content, and analytics

This README explains the platform, the architecture, and how the system was built.

## Core Features

- User registration, login, and profile management
- Blog creation, editing, and deletion
- Author statistics and follower tracking
- Public author discovery and profile pages
- Secure image upload and avatar handling
- Rich text writing using a modern editor
- Admin analytics, user moderation, and activity tracking

## Architecture

### Frontend

The public frontend is built with:

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- React Query
- Lucide React icons
- React Toastify
- Tiptap editor for rich blog content

### Backend

The API server is built with:

- Node.js + Express 5
- MongoDB via Mongoose
- JWT authentication
- Redis support through `ioredis`
- File uploads with Multer
- Image hosting via ImageKit / Cloudinary
- Push notifications with `web-push`
- Security middleware: `helmet`, `cors`, `express-rate-limit`, `express-mongo-sanitize`, `xss-clean`

### Admin Dashboard

The admin dashboard is intended to manage permissions, users, blog content, and overall platform analytics. It should be built with strong typing, reusable API helpers, and an intuitive data-driven design.

## How it Was Achieved

### 1. Defined the data model

The backend defines a rich `User` model with fields for profile data, social links, and statistics. The `stats` object tracks things like:

- `totalArticles`
- `totalBlogs`
- `totalViews`
- `totalLikes`
- `totalFollowers`

The `Blog` model stores post content, featured images, author relationship, views, likes, read time, and tags.

### 2. Built secure API routes

The backend exposes authenticated and public endpoints for core features:

- Authentication and user session routes under `/api/v1/auth`
- User profile and public author routes under `/api/v1/users`
- Blog CRUD routes under `/api/v1/blog`

These routes include validation, authorization, file upload handling, and user state updates.

### 3. Connected frontend to the backend

The public frontend uses a shared fetch utility and auth provider to manage user state.

- `client/src/context/AuthContext.tsx` handles login, token storage, and current user data
- `client/src/lib/apiFetch.ts` performs authenticated requests and silent refreshes
- `client/src/types/index.ts` defines shared TypeScript models across the app

The profile page uses this authenticated state to display the current user, their blog count, views, and follower stats.

### 4. Implemented analytics and stats updates

The backend updates user stats as content changes:

- Increment `stats.totalBlogs` on blog creation
- Decrement `stats.totalBlogs` on blog deletion
- Increment `stats.totalViews` on each blog view
- Increment/decrement follower and like counts as users interact

This ensures the user profile and admin analytics show accurate numbers.

## Admin README Purpose

This file is intended to summarize the OsunGist platform from the admin project perspective.

The admin dashboard should support:

- user management and role control
- content moderation and blog review
- platform analytics and trend tracking
- activity logs and notifications

## Setup Instructions

### Backend

```bash
cd server
npm install
npm run dev
```

### Frontend

```bash
cd client
npm install
npm run dev
```

### Admin

```bash
cd admin
npm install
npm run dev
```

## Summary

OsunGist brings blogging, author networking, and analytics together in a modern full-stack application. The admin dashboard is a central control point for managing the platform and monitoring performance.
