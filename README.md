# BuddyScript — Social Networking Platform

BuddyScript is a full-stack social networking application built with Next.js and a separate Express/MongoDB backend. This document covers the frontend architecture and the decisions behind it.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Project Structure](#project-structure)
3. [Tech Stack](#tech-stack)
4. [Registration](#registration)
5. [Login & Authentication](#login--authentication)
6. [Feed](#feed)
7. [Running the Project](#running-the-project)
8. [Environment Variables](#environment-variables)

---

## Project Overview

BuddyScript is a Facebook-style social feed where users can:

- Register and log in with JWT-based authentication
- Create text and image posts with public/private visibility
- Like posts, comments, and replies with optimistic UI updates
- Comment on posts and reply to comments (threaded)
- See who liked a post, comment, or reply via a modal
- Toggle dark/light mode

The frontend communicates with a separate Express/MongoDB backend over HTTP with cross-origin cookies.

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout — mounts providers
│   ├── page.tsx            # Redirects / → /login
│   ├── login/
│   ├── register/
│   └── feed/
├── components/
│   ├── Login/
│   ├── Register/
│   ├── Feed/               # All feed state lives here
│   ├── PostCard/           # Post, CommentItem, ReplyItem
│   ├── CreatePost/
│   ├── LikesModal/
│   ├── Toast/
│   ├── Navbar/
│   ├── LeftSidebar/
│   └── RightSidebar/
├── context/
│   ├── AuthContext.tsx      # User session state
│   └── ToastContext.tsx     # Global toast notifications
├── lib/
│   ├── api.ts              # Typed fetch wrapper
│   ├── endpoints.ts        # API route definitions
│   ├── types.ts            # Shared TypeScript interfaces
│   ├── schemas/auth.ts     # Zod validation schemas
│   └── utils.ts            # Helpers (timeAgo, etc.)
└── middleware.ts            # Edge route guard
```

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | CSS Modules |
| Form handling | React Hook Form + Zod |
| Immutable state updates | Immer |
| Font | Poppins via `next/font` |

---

## Registration

The register form uses **React Hook Form** with a **Zod** schema (`src/lib/schemas/auth.ts`).

React Hook Form registers inputs via `ref` rather than controlling them with `useState`. The component does not re-render on every keystroke — only on validation events. Zod provides the validation schema, and the form data type is derived directly from it:

```typescript
export type RegisterFormData = z.infer<typeof registerSchema>;
```

This means the TypeScript type and the validation rules are always in sync — there is no separate interface to maintain.

Password confirmation is validated as a cross-field rule using Zod's `.refine()`:

```typescript
.refine(data => data.password === data.repeatPassword, {
  message: 'Passwords do not match',
  path: ['repeatPassword'],
})
```

Server-side errors (e.g. email already taken) are mapped back to the specific field using `setError('email', { message })`, so errors appear inline rather than as a generic banner.

---

## Login & Authentication

### Why Context API

`AuthContext` holds the logged-in `user` object and exposes `login`, `register`, and `logout`. Context was chosen because the auth state is a single value that changes rarely — on login, logout, and page load — and needs to be accessible across the entire component tree. A global state library would be over-engineering for this scope.

The tradeoff: Context triggers a re-render in every subscribed component when it updates. For auth state, this is acceptable since it changes infrequently. If the state were updated on every user interaction (e.g. per-keystroke), Context would not be the right tool.

### JWT via httpOnly cookie

The backend issues a JWT stored in an `httpOnly` cookie:

```
Set-Cookie: auth_token=<jwt>; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=604800
```

`httpOnly` means JavaScript cannot access the token at all — it is only sent automatically by the browser on each request. `SameSite=None; Secure` is required because the frontend and backend are on different domains; without it, the browser strips the cookie from cross-origin `fetch` calls.

On mount, `AuthContext` calls `GET /auth/me` to restore the session from the existing cookie. On a 401 response, it calls `POST /auth/logout` before clearing local state — this ensures the backend clears the expired cookie so the middleware's presence check does not leave the user stuck in a redirect loop.

### auth_presence cookie

The Next.js middleware (`src/middleware.ts`) runs on the Edge and checks for an `auth_presence` cookie to decide whether to allow or redirect a request. It cannot check `auth_token` directly because that cookie is scoped to the backend's domain — the frontend server never sees it.

After every successful auth event (login, register, `auth/me` success), the frontend sets a lightweight cookie on its own domain:

```typescript
document.cookie = 'auth_presence=1; path=/; max-age=604800; secure; samesite=lax';
```

The middleware reads this:

```typescript
const isAuthenticated = request.cookies.has('auth_presence');
```

`auth_presence` carries no sensitive data. If someone sets it manually, they reach the feed page shell — but every API call is validated by the backend against `auth_token`. The middleware is a UX guard; security is enforced at the API layer.

### Post-auth redirect

After login and register, navigation uses `window.location.href` rather than `router.push`. A soft navigation via `router.push` can trigger the middleware before the `auth_presence` cookie write is committed to the browser's cookie store, resulting in a redirect back to `/login`. A full navigation waits until the current execution context finishes, guaranteeing the cookie is set before the next request is evaluated.

---

## Feed

All feed state — posts, comments, and replies — lives in a single `useState<Post[]>` array in `Feed` (`src/components/Feed/Feed.tsx`). Handler functions are defined in `Feed` and passed as props into `PostCard`, keeping the feed as a single source of truth for all mutations.

```
Feed (state owner)
  └── PostCard
        ├── CommentItem
        │     └── ReplyItem
        └── LikesModal
```

**Data normalisation.** The backend returns MongoDB documents with `_id` and a nested `author` object. Three normalizer functions (`normalizePost`, `normalizeComment`, `normalizeReply`) run on every API response, flattening the shape to what the frontend types expect and filling in safe defaults. Components never deal with raw backend shapes.

**State updates with Immer.** Updating a reply nested three levels deep without Immer requires spreading at every level. `produce` from Immer lets you write direct mutations on a `draft` proxy; Immer produces a new immutable object from those mutations. This keeps the update logic readable and eliminates bugs from missed spreads.

**Optimistic updates.** Like actions on posts, comments, and replies update state immediately before the API call resolves. If the call fails, the same toggle function is applied again to revert, and a toast is shown. Comments and replies are not optimistic — they require a server-generated ID before they can be rendered correctly.

**Lazy loading.** Comments and replies are not included in the feed response. They load on demand when a user opens the comments section, controlled by `commentsLoaded` and `repliesLoaded` flags on each item. An idempotency guard prevents duplicate fetches. Posts with `commentCount === 0` are initialised with `commentsLoaded: true`, so they never trigger an unnecessary request.

**Likes modal.** `LikesModal` accepts an `endpoint` prop. `null` means closed; a string triggers a fetch and opens the modal. This removes the need for a separate `isOpen` boolean and ensures the fetch and open are one action.

---

## Running the Project

```bash
npm install
npm run dev        # development server at localhost:3000
npm run build      # production build
npm run typecheck  # TypeScript check without emitting
```

---

## Environment Variables

Create a `.env.local` file in the project root. This file is gitignored and must not be committed.

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API |
