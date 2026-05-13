# BuddyScript — Social Networking Platform

BuddyScript is a full-stack social networking application. This document covers the frontend architecture from end to end, including every major decision and the reasoning behind it.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Authentication Architecture](#authentication-architecture)
5. [Route Protection — Middleware](#route-protection--middleware)
6. [State Management](#state-management)
7. [Data Layer](#data-layer)
8. [Feed & Post Architecture](#feed--post-architecture)
9. [Optimistic UI & Rollback](#optimistic-ui--rollback)
10. [Lazy Loading Strategy](#lazy-loading-strategy)
11. [LikesModal — On-Demand Fetch Pattern](#likesmodal--on-demand-fetch-pattern)
12. [Toast Notification System](#toast-notification-system)
13. [Form Validation](#form-validation)
14. [Styling Approach](#styling-approach)
15. [CORS & Cross-Origin Cookie Deep Dive](#cors--cross-origin-cookie-deep-dive)
16. [Session Expiry & 401 Handling](#session-expiry--401-handling)
17. [Running the Project](#running-the-project)
18. [Environment Variables](#environment-variables)

---

## Project Overview

BuddyScript is a Facebook-style social feed where users can:

- Register and log in with JWT-based authentication
- Create text and image posts with public/private visibility
- Like posts, comments, and replies with live count updates
- Comment on posts and reply to comments (threaded)
- See who liked a post, comment, or reply via a modal
- Toggle dark/light mode

The frontend is deployed on Railway and communicates with a separate Express/MongoDB backend also on Railway.

---

## Tech Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | File-based routing, server components, built-in middleware |
| Language | TypeScript | Type safety across the entire data flow |
| Styling | CSS Modules | Component-scoped styles, no runtime cost, no class conflicts |
| Form handling | React Hook Form + Zod | Uncontrolled inputs for performance, schema-driven validation |
| Immutable state updates | Immer | Readable mutations on nested state without manual spread chains |
| Font | Poppins (next/font) | Zero layout shift, self-hosted by Next.js |

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout — mounts providers
│   ├── page.tsx            # Redirects / → /login
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── feed/page.tsx
├── components/
│   ├── Login/
│   ├── Register/
│   ├── Feed/               # Main feed — all state lives here
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
│   ├── endpoints.ts        # All API route definitions
│   ├── types.ts            # Shared TypeScript interfaces
│   ├── schemas/auth.ts     # Zod validation schemas
│   └── utils.ts            # Helpers (timeAgo, etc.)
└── middleware.ts            # Edge route guard
```

---

## Authentication Architecture

### Why httpOnly cookies instead of localStorage

JWT tokens stored in `localStorage` are accessible to any JavaScript running on the page, making them vulnerable to XSS attacks. An `httpOnly` cookie cannot be read by JavaScript at all — only the browser sends it automatically on each request. This means even if a malicious script runs on the page, it cannot steal the token.

The backend sets the cookie on login:

```
Set-Cookie: auth_token=<jwt>; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=604800
```

### Why SameSite=None

The frontend (`social-site-frontend.up.railway.app`) and backend (`social-site-backend.up.railway.app`) are on different domains. `SameSite=Lax` (the browser default) only sends cookies on same-site requests and top-level navigations — it does **not** send cookies on cross-origin `fetch` calls, which is how this app communicates with the backend.

`SameSite=None; Secure` tells the browser to include the cookie on all cross-origin requests. `Secure` is mandatory when using `SameSite=None` — the browser rejects the cookie otherwise.

### credentials: 'include'

Every `fetch` call in `src/lib/api.ts` includes `credentials: 'include'`. Without this, the browser strips cookies from cross-origin requests entirely, regardless of the `SameSite` setting.

### AuthContext

`AuthContext` (`src/context/AuthContext.tsx`) holds the logged-in `user` object and exposes `login`, `register`, and `logout`. On mount, it calls `GET /auth/me` to restore session from the existing cookie:

```
App loads → auth/me → 200 → user restored
                    → 401 → call logout (clear cookie) → user = null
```

On a 401 from `auth/me`, we explicitly call `POST /auth/logout` before setting `user = null`. This ensures the backend clears the expired cookie via `Set-Cookie: auth_token=; Max-Age=0`, so the middleware's presence cookie is also cleared and the user isn't stuck in a redirect loop.

### Post-auth redirect — window.location.href

After login and register, the redirect uses `window.location.href = '/feed'` rather than `router.push('/feed')`. This forces a **full page reload** instead of a client-side navigation.

The reason: `router.push` is a soft navigation that keeps the React tree mounted. In Next.js App Router, `router.push` triggers an RSC (React Server Component) fetch for the new page. This RSC request goes out to the Next.js server almost immediately after `router.push` is called. In a race condition, the RSC request can reach the middleware before `document.cookie = 'auth_presence=1'` has been committed to the browser's cookie store, because `document.cookie` assignment is synchronous in spec but the browser may defer the cookie write. The middleware then sees no `auth_presence` and returns a 307 redirect to `/login`.

`window.location.href = '/feed'` is a full navigation. The browser does not send the request until the current JavaScript execution context finishes, by which point all cookie writes are guaranteed to be committed. The same principle applies to logout — using `window.location.href = '/login'` ensures the `auth_presence` cookie is fully cleared before the middleware evaluates the next request.

---

## Route Protection — Middleware

`src/middleware.ts` runs on the Next.js Edge before any page renders. It protects `/feed` from unauthenticated access and redirects logged-in users away from `/login` and `/register`.

### The cross-origin cookie problem

The `auth_token` cookie is set by the backend on the backend's domain. When the browser navigates to the frontend (`frontend.railway.app/feed`), it sends cookies scoped to `frontend.railway.app` — the backend's `auth_token` cookie is never sent to the frontend server. So `request.cookies.has('auth_token')` inside middleware would always be `false`, blocking every user regardless of their login state.

### Solution: auth_presence cookie

After every successful authentication event (login, register, `auth/me` success), the frontend sets a lightweight cookie on its own domain:

```typescript
document.cookie = 'auth_presence=1; path=/; max-age=604800; secure; samesite=lax';
```

The middleware checks for this cookie:

```typescript
const isAuthenticated = request.cookies.has('auth_presence');
```

On logout or a 401 from `auth/me`, `auth_presence` is cleared:

```typescript
document.cookie = 'auth_presence=; path=/; max-age=0';
```

### Why this is not a security risk

`auth_presence` carries no sensitive data. If someone manually sets `auth_presence=1`, they reach the feed page shell — but every API call goes to the backend, which validates `auth_token` on every request and returns 401 if missing or invalid. The actual data never leaves the backend without a valid token. The middleware is a **UX guard**, not a security boundary. Real security is enforced at the API layer.

This is the same pattern used by Auth0's Next.js SDK and Vercel's own documentation for cross-origin auth.

---

## State Management

No external state library (Redux, Zustand, Jotai) is used. The application has two natural scopes of shared state:

**Auth state** — one value (`user`), changes rarely, needs to be accessible across the entire tree. React Context is the right tool here. Adding a global store for one value is over-engineering.

**Feed state** — all posts, comments, and replies live in a single `useState<Post[]>` array inside the `Feed` component. This data is only needed by the feed and its children, so keeping it local avoids unnecessary global state. Every mutation (like, comment, reply) is handled via callback props passed down the tree.

The `Post` type embeds `Comment[]` and each `Comment` embeds `Reply[]`. This is a denormalized in-memory structure — it mirrors what you'd put in a normalized store like Redux, but without the overhead. The tradeoff: updating a reply requires finding it three levels deep (post → comment → reply), which is why Immer is used. The alternative (a normalized flat map of `{ posts: {}, comments: {}, replies: {} }`) would be faster to update but adds indirection complexity not warranted for a single-page feed.

---

## Data Layer

### api.ts — typed fetch wrapper

All HTTP calls go through `src/lib/api.ts`:

```typescript
export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: isFormData ? { ...options?.headers } : { 'Content-Type': 'application/json', ... },
  });
  const body = await res.json();
  if (!body.success) throw { ...body, status: res.status } as ApiError;
  return body.data as T;
}
```

Key decisions:
- `credentials: 'include'` on every call — required for cross-origin cookie sending
- `Content-Type` is omitted for `FormData` — the browser must set it automatically to include the multipart boundary. Setting it manually breaks file uploads
- The HTTP status code is attached to the thrown `ApiError` so callers can distinguish a 401 (expired session) from a 500 (server error)
- `body.data` is returned — the backend wraps all responses in `{ success, data, message }`

### Data normalizers

The backend returns posts with a nested `author` object and uses `_id` (MongoDB ObjectId) as the identifier. The frontend types expect flat fields (`authorName`, `authorAvatar`) and use `id`. Three normalizer functions run on every API response:

```
normalizeReply  →  normalizeComment  →  normalizePost
```

Each normalizer:
- Maps `_id` → `id`
- Flattens `author.firstName + author.lastName` → `authorName`
- Defaults missing fields (`likeCount ?? 0`, `likedByMe ?? false`)
- Adds UI-only fields (`commentsLoaded`, `repliesLoaded`) that the backend doesn't return

The normalizers are defensive — they use `??` and `||` fallbacks everywhere because the backend shape can vary (e.g. a freshly created post returned from `POST /posts` may have a different structure than one returned from `GET /posts`). Rather than handling both shapes in every component, the normalizer is the single entry point that guarantees a consistent shape.

`commentsLoaded` is initialized to `true` when `commentCount === 0`. This is an important optimization: it means posts with no comments never trigger a `GET /posts/:id/comments` call, even if the user clicks the Comments button.

This keeps the rest of the codebase clean — components never deal with raw backend shapes. If the backend API changes, only the normalizer needs updating.

---

## Feed & Post Architecture

All post state lives in `Feed` (`src/components/Feed/Feed.tsx`). Handler functions are defined there and passed as props into `PostCard`. This is an intentional choice: `Feed` is the single source of truth for the posts array, and all mutations flow up through callbacks rather than each card managing its own API calls independently.

```
Feed (state owner)
  └── PostCard (display + local UI state)
        ├── CommentItem
        │     └── ReplyItem
        └── LikesModal
```

`PostCard` holds only UI state: `menuOpen`, `commentInput`, `showComments`, `isEditing`. Data mutations always call up to `Feed` via props.

---

## Optimistic UI & Rollback

Like actions on posts, comments, and replies use **optimistic updates** — the UI updates immediately before the API call completes, making the app feel instant. If the API call fails, the state is rolled back and a toast is shown.

The rollback pattern uses Immer's `produce`:

```typescript
const applyToggle = (prev: Post[]) => produce(prev, draft => {
  const post = draft.find(p => p.id === postId);
  if (!post) return;
  post.likedByMe = !post.likedByMe;
  post.likeCount += post.likedByMe ? 1 : -1;
});

setPosts(applyToggle);          // optimistic update
try {
  await api(API.posts.like(postId), { method: 'POST' });
} catch {
  setPosts(applyToggle);        // calling the same toggle twice reverts to original
  showToast('Failed to like post.', 'error');
}
```

Calling `applyToggle` twice works because toggling a boolean twice returns to the original value. No snapshot is needed.

Comments and replies are **not** optimistic — they use an API-first approach. The reason: comments need a server-generated `_id` to be used as a React key and for subsequent interactions (liking, replying). Without a real ID, optimistic comments would need a temporary ID that gets replaced on response, adding complexity for minimal UX gain. Likes are different — a toggle is reversible and carries no identity requirement, so optimistic updates are safe and provide clear UX benefit.

### Why Immer

Without Immer, updating a nested reply inside a comment inside a post requires spreading at every level:

```typescript
// Without Immer
setPosts(prev => prev.map(p =>
  p.id !== postId ? p : {
    ...p,
    comments: p.comments.map(c =>
      c.id !== commentId ? c : {
        ...c,
        replies: c.replies.map(r =>
          r.id !== replyId ? r : { ...r, likedByMe: !r.likedByMe, likeCount: r.likeCount + 1 }
        )
      }
    )
  }
));

// With Immer
produce(prev, draft => {
  const reply = draft
    .find(p => p.id === postId)
    ?.comments.find(c => c.id === commentId)
    ?.replies.find(r => r.id === replyId);
  if (reply) { reply.likedByMe = !reply.likedByMe; reply.likeCount += 1; }
})
```

Immer uses JavaScript `Proxy` objects to intercept mutations and produce a new immutable state. The readable mutation style eliminates bugs from missed spreads.

---

## Lazy Loading Strategy

Comments and replies are not embedded in the feed response. The backend returns only `commentCount` and `replyCount`. This is intentional:

- Loading a feed of 20 posts, each with 50 comments and 10 replies per comment, would be an enormous payload
- Most users scroll past posts without opening comments

**Comments** load the first time a user clicks the Comments button or the comment count. An idempotency guard prevents duplicate fetches:

```typescript
const handleLoadComments = async (postId: string) => {
  const alreadyLoaded = posts.find(p => p.id === postId)?.commentsLoaded;
  if (alreadyLoaded) return;  // already fetched — do nothing
  // ... fetch and set
};
```

The `commentsLoaded` flag is initialized to `true` when `commentCount === 0` — no API call needed for posts with no comments.

**Replies** follow the same pattern using `repliesLoaded` on each comment.

---

## LikesModal — On-Demand Fetch Pattern

`LikesModal` (`src/components/LikesModal/LikesModal.tsx`) shows who liked a post, comment, or reply. It is rendered at three levels of the tree: inside `PostCard`, `CommentItem`, and `ReplyItem`.

### The endpoint prop pattern

The modal accepts `endpoint: string | null`. When `null`, the modal renders nothing. When a string, it fetches that endpoint and shows results.

```typescript
// PostCard
const [likesEndpoint, setLikesEndpoint] = useState<string | null>(null);

<button onClick={() => setLikesEndpoint(API.posts.likes(post.id))}>
  {post.likeCount}
</button>
<LikesModal endpoint={likesEndpoint} onClose={() => setLikesEndpoint(null)} />
```

This approach means:
- No separate `isOpen` boolean needed — `null` is the closed state
- The fetch is triggered by the `useEffect` watching `endpoint`, so opening the modal and fetching are one action
- Closing sets `endpoint` back to `null`, which also resets the `likes` state for the next open

### Why the modal is co-located at each level

An alternative would be one modal at the top of the tree controlled by a context. That was avoided because it would require threading `setLikesEndpoint` through multiple levels, or adding another context just for modal state. Keeping a `likesEndpoint` state at each node (`PostCard`, `CommentItem`, `ReplyItem`) is simpler and self-contained.

### Response shape normalisation

The backend can return likes in different shapes depending on the endpoint. The `normalizeLike` function handles three cases:

```typescript
// 1. Nested:  { user: { firstName, lastName, avatar } }
// 2. Flat:    { firstName, lastName, avatar }
// 3. Legacy:  { userName, name, avatar }
```

---

## Toast Notification System

`ToastContext` (`src/context/ToastContext.tsx`) provides a global `showToast(message, type)` function. It is used throughout the app for API error feedback instead of inline error state per component, keeping components lean.

Dismissal uses a two-phase approach to allow a CSS exit animation:

```typescript
const dismiss = (id: number) => {
  // Phase 1: mark as exiting — triggers CSS slide-out animation
  setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
  // Phase 2: remove from array after animation completes
  setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), EXIT_DURATION);
};
```

If the toast were removed immediately from state, the DOM element disappears instantly — no animation runs because the element no longer exists. The `exiting` flag keeps the element in the DOM while applying a CSS exit animation, then removes it after `EXIT_DURATION` (320ms) when the animation finishes.

The `nextId` counter is a module-level variable (outside the component), not `useState`. This avoids unnecessary re-renders when IDs increment and ensures IDs remain unique across multiple `showToast` calls within the same render cycle.

---

## Form Validation

Login and register forms use **React Hook Form** with **Zod** schemas (`src/lib/schemas/auth.ts`).

React Hook Form uses uncontrolled inputs (refs instead of `onChange` state). This means the component does not re-render on every keystroke — only on validation events. For forms with many fields this is a meaningful performance difference.

Zod provides schema-driven validation with full TypeScript inference:

```typescript
export type RegisterFormData = z.infer<typeof registerSchema>;
```

The form data type is derived from the schema, so adding a new field to the schema automatically adds it to the type. No duplication.

The register schema cross-validates `password` and `repeatPassword` using Zod's `.refine()`:

```typescript
.refine(data => data.password === data.repeatPassword, {
  message: 'Passwords do not match',
  path: ['repeatPassword'],
})
```

Server-side field errors (e.g. email already taken) map back to the specific field using `setError('email', { message: ... })` so the error appears inline next to the input rather than as a generic message.

---

## Styling Approach

CSS Modules are used throughout. Every component has a `ComponentName.module.css` file. Class names are locally scoped — `.button` in `PostCard.module.css` and `.button` in `Navbar.module.css` never collide.

Design tokens are defined as CSS custom properties on `:root` in `globals.css`:

```css
:root {
  --surface: #ffffff;
  --text: #1a1a2e;
  --border: #e5e7eb;
  --primary: #4f46e5;
}
```

Dark mode is applied by setting `data-theme="dark"` on `<html>` and overriding the variables:

```css
[data-theme="dark"] {
  --surface: #1e1e2e;
  --text: #e2e8f0;
}
```

Components reference `var(--surface)` — they never hardcode colours. Switching themes requires changing one attribute on one element. No component needs to know about the current theme.

Dark mode state lives in `Feed` as `useState(false)` and is applied via a `useEffect`:

```typescript
useEffect(() => {
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : '');
}, [darkMode]);
```

This was intentionally kept as local state rather than context or `localStorage` persistence. The scope was a toggle for the current session — adding persistence would require a `useEffect` to read `localStorage` on mount, which introduces a flash of incorrect theme before hydration. That complexity was out of scope.

---

## CORS & Cross-Origin Cookie Deep Dive

This is the most architecturally complex part of the project and the area most likely to be asked about in depth.

### What CORS actually does

CORS (Cross-Origin Resource Sharing) is a browser security mechanism. It does **not** prevent the request from being sent — it prevents the browser from giving the JavaScript the response. For simple GET/POST requests, the request goes out; CORS only controls whether the frontend code can read the response.

For credentialed requests (with cookies), two things must be true:
1. The frontend must set `credentials: 'include'` in `fetch`
2. The backend must respond with `Access-Control-Allow-Credentials: true` AND `Access-Control-Allow-Origin: <specific-origin>` (not `*`)

If the backend uses `Access-Control-Allow-Origin: *`, credentialed requests are rejected by the browser even if the server returned 200.

### What SameSite actually controls

SameSite controls whether the **browser includes the cookie** in outgoing requests — it runs before the request even leaves the browser, independent of CORS.

| SameSite value | Same-site requests | Cross-site top-level navigation (GET) | Cross-site fetch/XHR |
|---|---|---|---|
| Strict | ✅ | ❌ | ❌ |
| Lax (default) | ✅ | ✅ | ❌ |
| None + Secure | ✅ | ✅ | ✅ |

The frontend calls `fetch('https://backend.railway.app/posts', { credentials: 'include' })` — this is a cross-site fetch from `frontend.railway.app`. With `SameSite=Lax`, the browser strips the cookie before sending. With `SameSite=None; Secure`, the cookie is included.

This is why changing the backend cookie to `SameSite=None` was necessary: without it, every authenticated API call would fail silently (backend receives no cookie → returns 401 → catch sets empty state).

### Why CORS still prevents CSRF even with SameSite=None

A common concern: if `SameSite=None` sends cookies on all cross-site requests, isn't it vulnerable to CSRF?

The answer is no, because CORS blocks the attacker from reading the response, and modern frameworks reject requests that lack valid CORS headers. A form POST from `evil.com` to the backend would:
1. Be sent (CORS doesn't block sending)
2. But the backend checks `Origin` header → `evil.com` is not in the allowed origins → backend returns 403

The browser also blocks the attacker's JavaScript from reading the response, so no data is leaked. This is defence-in-depth: `SameSite=None` trades some CSRF protection for cross-origin usability, but CORS on the backend compensates.

---

## Session Expiry & 401 Handling

When `GET /auth/me` returns 401 (token expired or invalid), a naive implementation would simply call `setUser(null)`. But this creates a redirect loop:

1. `user = null` → Feed redirects to `/login`
2. Middleware sees `auth_presence` cookie still exists → redirects back to `/feed`
3. Loop

The fix: on a 401 from `auth/me`, explicitly call `POST /auth/logout` before setting `user = null`. The backend responds with `Set-Cookie: auth_token=; Max-Age=0` which removes the cookie. `clearPresenceCookie()` removes `auth_presence`. Now when Feed redirects to `/login`, the middleware sees no `auth_presence` and allows the request through.

```typescript
.catch(async (err: ApiError) => {
  if (err.status === 401) {
    await api(API.auth.logout, { method: 'POST' }).catch(() => {});
    clearPresenceCookie();
  }
  setUser(null);
})
```

The `err.status` check is important: a network failure (backend unreachable) throws an `Error`, not an `ApiError`, so `err.status` would be `undefined`. We only call logout for genuine 401s — for network errors, the user stays logged in and can retry.

This required adding `status: number` to the `ApiError` interface and attaching `res.status` when throwing from `api.ts`:

```typescript
throw { ...body, status: res.status } as ApiError;
```

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

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API (e.g. `https://api.yourapp.com/api/v1`) |

Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

The `.env.local` file is gitignored and must not be committed.
