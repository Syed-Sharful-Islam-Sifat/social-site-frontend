# Buddy Script — Technical Documentation

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture & Key Decisions](#2-architecture--key-decisions)
3. [Directory Structure](#3-directory-structure)
4. [Data Layer](#4-data-layer)
5. [Auth System](#5-auth-system)
6. [Component Reference](#6-component-reference)
7. [Styling System](#7-styling-system)
8. [Routing](#8-routing)
9. [Dark Mode](#9-dark-mode)
10. [State Management & Data Flow](#10-state-management--data-flow)

---

## 1. Project Overview

Buddy Script is a frontend-only social media application built with **Next.js 16.2.6** and **React 19.2.4**. It has no backend — all data persists in the browser's `localStorage`.

**Implemented features:**
- User registration (first name, last name, email, password)
- User login with protected feed route
- Create posts with text and optional image upload
- Like / unlike posts, comments, and replies
- Add comments and nested replies
- "Who liked" display on posts
- Edit and delete own posts
- Toggle post visibility (Public / Friends Only)
- Dark mode toggle
- Mock sidebars (Explore, Suggested People, Events, You Might Like, Friends)
- Mock stories and notification dropdown

**Tech stack:**
| Concern | Choice |
|---|---|
| Framework | Next.js 16.2.6 (App Router) |
| UI library | React 19.2.4 |
| Language | TypeScript |
| Styling | CSS Modules (`.module.css`) |
| Font | Poppins (via `next/font/google`) |
| Persistence | Browser `localStorage` |
| Images | `next/image` |
| Navigation | `next/link`, `next/navigation` |

---

## 2. Architecture & Key Decisions

### 2.1 Thin route files, fat components

**Decision:** Route files in `src/app/` are server components that only import and render a single client component. All markup, state, and logic live inside `src/components/`.

```
src/app/login/page.tsx       ← 4 lines, just renders <Login />
src/components/Login/Login.tsx ← all the real logic
```

**Why:** The App Router encourages this separation. Route files handle URL concerns (metadata, layout boundaries, suspense); components handle UI. This also makes components testable and reusable without being tied to a specific route.

### 2.2 Co-located CSS Modules

**Decision:** Every component folder contains exactly two files — `ComponentName.tsx` and `ComponentName.module.css`. CSS lives next to the component that uses it.

**Why:** Avoids a global stylesheet that grows uncontrollably. CSS Modules scope class names to their file at build time, eliminating class-name collisions. Co-location means a developer can open one folder and see both the markup and the styles without searching.

### 2.3 Kebab-case class names with bracket notation

**Decision:** All CSS classes use kebab-case (`post-card`, `author-name`, `form-group`) and are always accessed with bracket notation (`styles['post-card']`).

**Why:** Kebab-case is the CSS convention (matching how native CSS properties are written). Dot notation (`styles.postCard`) forces you to use camelCase in CSS, which is inconsistent. Bracket notation works for all class names — single word or hyphenated — so it is used uniformly throughout the app.

### 2.4 `'use client'` at the component level, not the route level

**Decision:** The `'use client'` directive appears at the top of component files that use React hooks or browser APIs, not in route `page.tsx` files.

**Why:** This preserves the server component boundary at the route level. Next.js can still render the route shell on the server; only the interactive parts are shipped to the client. If a route's `page.tsx` is marked `'use client'`, the entire subtree opts out of server rendering unnecessarily.

### 2.5 No CSS framework

**Decision:** No Bootstrap, Tailwind, or any CSS utility library. Raw CSS Modules only.

**Why:** The task required matching an existing HTML/CSS design. Frameworks impose their own box model, spacing scale, and component assumptions. Raw CSS lets the styles follow the design exactly without fighting framework defaults.

### 2.6 localStorage as the only persistence layer

**Decision:** Users, posts, and session state are all stored in `localStorage`. No HTTP calls are made.

**Why:** This is a frontend task — no backend was in scope. `localStorage` gives real persistence across page reloads without a server, which is sufficient for demonstrating all required features.

### 2.7 SSR guard on localStorage calls

**Decision:** Every `localStorage` read is guarded with `if (typeof window === 'undefined') return []`.

**Why:** Next.js runs component code on the server during SSR. `localStorage` does not exist on the server — calling it without a guard causes a `ReferenceError` at build time. The guard returns a safe empty value server-side and defers the real read to the browser.

### 2.8 Seed posts as initial state

**Decision:** `SEED_POSTS` in `src/lib/mockData.ts` are loaded as the initial posts on first visit. Once the user makes any change (like, comment, new post), all posts — including seeds — are saved to localStorage.

**Why:** Avoids an empty feed on first use. The seeds make the app feel populated and demonstrate that the PostCard component works with real-looking data, including nested comments and replies.

---

## 3. Directory Structure

```
src/
├── app/                         Next.js App Router (routing only)
│   ├── layout.tsx               Root layout: Poppins font + AuthProvider wrapper
│   ├── page.tsx                 Redirects / → /login
│   ├── globals.css              CSS custom properties (design tokens) + global reset
│   ├── login/
│   │   └── page.tsx             Renders <Login />
│   ├── register/
│   │   └── page.tsx             Renders <Register />
│   └── feed/
│       └── page.tsx             Renders <Feed />
│
├── components/                  All UI components
│   ├── Login/
│   │   ├── Login.tsx
│   │   └── Login.module.css
│   ├── Register/
│   │   ├── Register.tsx
│   │   └── Register.module.css
│   ├── Feed/
│   │   ├── Feed.tsx             Protected route + all state mutations + layout
│   │   └── Feed.module.css
│   ├── Navbar/
│   │   ├── Navbar.tsx
│   │   └── Navbar.module.css
│   ├── LeftSidebar/
│   │   ├── LeftSidebar.tsx
│   │   └── LeftSidebar.module.css
│   ├── RightSidebar/
│   │   ├── RightSidebar.tsx
│   │   └── RightSidebar.module.css
│   ├── Stories/
│   │   ├── Stories.tsx
│   │   └── Stories.module.css
│   ├── CreatePost/
│   │   ├── CreatePost.tsx
│   │   └── CreatePost.module.css
│   └── PostCard/
│       ├── PostCard.tsx         Contains PostCard + CommentItem + ReplyItem
│       └── PostCard.module.css
│
├── context/
│   └── AuthContext.tsx          React Context: user state, login, register, logout
│
└── lib/
    ├── types.ts                 TypeScript interfaces for all domain objects
    ├── storage.ts               localStorage helpers (getUsers, getPosts, etc.)
    ├── mockData.ts              Seed posts shown on first load
    └── utils.ts                 Utility: timeAgo()
```

---

## 4. Data Layer

### 4.1 Types (`src/lib/types.ts`)

All domain types are defined once here and imported everywhere.

```typescript
User       { id, firstName, lastName, email, password, avatar }
LikeInfo   { userId, userName }          // stored in likes arrays
Reply      { id, authorId, authorName, authorAvatar, content, likes[], createdAt }
Comment    { id, authorId, authorName, authorAvatar, content, likes[], createdAt, replies[] }
Post       { id, authorId, authorName, authorAvatar, content, image?, isPublic, likes[], comments[], createdAt }
```

**Why `LikeInfo` instead of just `userId`?** When rendering "who liked", the component needs a display name. If only the ID was stored, the app would have to look up users separately, which is expensive. Denormalizing the name into the likes array is acceptable in a localStorage-only app.

**Why is `image` optional (`image?`) on Post?** Posts do not require an image. Making it optional (rather than `string | null`) means TypeScript enforces that you check for its presence before using it.

### 4.2 Storage helpers (`src/lib/storage.ts`)

Six functions, all guarded against SSR:

| Function | Description |
|---|---|
| `getUsers()` | Returns all registered users from localStorage |
| `saveUsers(users)` | Overwrites the users array in localStorage |
| `getCurrentUserId()` | Returns the currently logged-in user's ID |
| `setCurrentUserId(id)` | Sets (or clears on `null`) the session |
| `getCurrentUser()` | Combines `getCurrentUserId` + `getUsers` to return the full User object |
| `getPosts()` | Returns all posts from localStorage |
| `savePosts(posts)` | Overwrites the posts array in localStorage |

**Why plain functions instead of a class?** These are pure input/output operations with no shared state. Functions are simpler, tree-shakable, and easier to test individually.

### 4.3 Mock data (`src/lib/mockData.ts`)

Three pre-populated posts used on first load:
- **Karim Saif** — post with image, 3 likes, 1 comment with 1 reply
- **Ryan Roslansky** — text-only post, 1 like
- **Dylan Field** — private post, no likes or comments

These exercise all the visible states of the PostCard immediately.

### 4.4 Utilities (`src/lib/utils.ts`)

`timeAgo(isoString)` converts an ISO timestamp to a human-readable relative string:
- `< 1 min` → `"just now"`
- `< 60 min` → `"5m ago"`
- `< 24h` → `"2h ago"`
- `≥ 1 day` → `"3d ago"`

---

## 5. Auth System

### `src/context/AuthContext.tsx`

A React Context that wraps the entire app (mounted in `src/app/layout.tsx`).

**State:**
- `user: User | null` — the currently logged-in user
- `isLoading: boolean` — true during the initial localStorage read (prevents redirect flicker)

**Exposed functions:**

| Function | Signature | Behaviour |
|---|---|---|
| `login` | `(email, password) => Promise<boolean>` | Finds a matching user in localStorage. Returns `true` on success, `false` if not found. Sets session. |
| `register` | `(firstName, lastName, email, password) => Promise<{ ok, error? }>` | Checks for duplicate email. Creates user with `id: user-${Date.now()}` and default avatar. Returns error string on failure. |
| `logout` | `() => void` | Clears the session ID from localStorage and sets `user` to `null`. |

**Why `isLoading`?** On mount, `useEffect` reads localStorage to restore the session. This is async relative to the render cycle. Without `isLoading`, a logged-in user visiting `/feed` would see a flash of the login redirect before the session is restored. The `isLoading` flag makes all protected routes wait before deciding to redirect.

**Why `Promise<boolean>` for `login`?** Even though the current implementation is synchronous (localStorage read), the Promise return type keeps the API compatible with a future real backend that would be genuinely async. Callers already use `await`.

---

## 6. Component Reference

### 6.1 `Login`

**File:** `src/components/Login/Login.tsx`  
**Directive:** `'use client'`

**Responsibility:** Renders the login form and handles authentication.

**State:**
- `email`, `password` — controlled inputs
- `error` — displayed below form on failed login
- `submitting` — disables the button during the async login call

**Key behaviour:**
- `useEffect` watches `user` + `isLoading`: if already logged in on mount, redirects to `/feed` immediately (prevents logged-in users from seeing the login page)
- `onSubmit` is separated from the form event: the `<form>` calls `e.preventDefault()` inline and then calls the stateless `handleSubmit()`. This avoids `React.FormEvent` which is deprecated in React 19.
- On login success, `router.push('/feed')` navigates to the feed.

**Visual:** Matches `login.html` — decorative SVG shapes (3 positioned absolutely), hero image (left column, hidden on mobile), form card (right column). Light/dark shape variants are toggled via `:global([data-theme='dark'])` selectors in the CSS module.

---

### 6.2 `Register`

**File:** `src/components/Register/Register.tsx`  
**Directive:** `'use client'`

**Responsibility:** Renders the registration form and creates a new user account.

**State:**
- `firstName`, `lastName`, `email`, `password`, `repeatPassword` — controlled inputs
- `agreed` — checkbox for terms acceptance
- `error`, `submitting`

**Key behaviour:**
- Client-side validation before calling `register()`: passwords must match, terms must be accepted.
- The HTML template only had email + password fields; first name and last name were added per task requirements while preserving the same visual style.
- The submit button was "Login now" in the template — changed to "Register now".
- Two hero images (`registration.png` / `registration1.png`) for light/dark mode — toggled via `.hero-light` / `.hero-dark` classes.

---

### 6.3 `Navbar`

**File:** `src/components/Navbar/Navbar.tsx`  
**Directive:** `'use client'`

**Responsibility:** Top navigation bar with search, icon buttons, dropdowns, and a mobile bottom nav.

**State:**
- `notifOpen` — notification dropdown open/closed
- `profileOpen` — profile dropdown open/closed
- `searchOpen` — mobile search bar shown/hidden

**Key behaviour:**
- A single `useEffect` attaches a `mousedown` listener to `document` to close both dropdowns when clicking outside. Uses two `ref` objects (`notifRef`, `profileRef`) to detect outside clicks correctly.
- `logout()` from `useAuth` is called on the Log Out menu item, then the user is pushed to `/login`.
- Profile name and avatar are read from the `user` object in AuthContext.

**Layout:** Two separate elements — `.navbar` (desktop, hidden on mobile with `display: none`, shown at `768px+`) and `.mobile-top` + `.mobile-bottom` (shown on mobile, hidden on `768px+`). This avoids a single component with messy toggling logic.

**Mock data:** 6 notification items hard-coded to demonstrate the dropdown UI.

---

### 6.4 `LeftSidebar`

**File:** `src/components/LeftSidebar/LeftSidebar.tsx`  
**Directive:** `'use client'`

**Responsibility:** Left sidebar with three sections — Explore menu, Suggested People, Events. All data is mock/static (not in localStorage).

**Why client component if it has no state?** It's a client component because it's composed inside `Feed`, which is a client component. In the App Router, once a parent is `'use client'`, children do not need to be explicitly marked — but marking it explicitly is harmless and makes the file self-documenting.

**Sections:**
- **Explore** — 8 menu items (icons + labels) as clickable buttons (no navigation, mock)
- **Suggested People** — 3 seed users (Steve Jobs, Ryan Roslansky, Dylan Field) with a Connect button (visual only)
- **Events** — 2 event cards with image, date badge, title, and going count

---

### 6.5 `RightSidebar`

**File:** `src/components/RightSidebar/RightSidebar.tsx`  
**Directive:** `'use client'`

**Responsibility:** Right sidebar with "You Might Like" and "Your Friends" sections.

**State:**
- `friendSearch` — filters the friends list in real time
- `followed` — a `Set<number>` tracking which "You Might Like" people have been followed (toggles button label and style)

**Key behaviour:**
- The friends list filters by name as the user types — simple `.filter()` on the mock array, no debounce needed at this scale.
- `followed` uses a `Set` because it provides O(1) lookup (`followed.has(id)`) and a clean toggle pattern (`next.has(id) ? next.delete(id) : next.add(id)`).
- Each friend shows a green online dot or a grey offline dot + last-seen time.

---

### 6.6 `Stories`

**File:** `src/components/Stories/Stories.tsx`  
**Directive:** `'use client'`

**Responsibility:** Horizontal row of story cards. Fully static mock data.

**Layout:** `overflow-x: auto` on the list makes it scrollable on mobile. On desktop it fits naturally. Each card uses `position: relative` with `fill` on the background image (via Next.js `Image` with `fill` + `sizes`).

**Why `fill` instead of `width`/`height` on the story background?** The card has a fixed CSS size (`110px × 160px`). Using `fill` lets the image cover the entire container without needing to know the image's intrinsic dimensions. `sizes="120px"` tells Next.js how large the image will appear so it can generate the correct srcset.

---

### 6.7 `CreatePost`

**File:** `src/components/CreatePost/CreatePost.tsx`  
**Directive:** `'use client'`

**Props:**
```typescript
user: User          // the logged-in user (avatar + name for the Post object)
onPost: (post: Post) => void  // callback to add the new post to Feed's state
```

**State:**
- `content` — textarea value
- `image` — base64 data URL string or null
- `isPublic` — boolean, controlled by a `<select>` dropdown
- `submitting` — disables the button during construction

**Key behaviour:**
- Image upload uses a hidden `<input type="file" accept="image/*">` triggered by clicking the Photo button. A `FileReader` converts the selected file to a base64 data URL, which is stored in state and saved directly into the post object. No external upload service is needed.
- The `<img>` tag (not `next/image`) is used for the preview because the src is a dynamic base64 string, not a known static path. `next/image` requires `src` to be a known URL or configured domain. A `// eslint-disable-next-line` comment suppresses the lint warning intentionally.
- The Post button is disabled when both `content` and `image` are empty.
- On submit, a full `Post` object is constructed locally (with `id: post-${Date.now()}`) and passed to `onPost`. The component resets itself to empty state.

---

### 6.8 `PostCard`

**File:** `src/components/PostCard/PostCard.tsx`  
**Directive:** `'use client'`

This is the most complex component. It also contains two sub-components in the same file: `CommentItem` and `ReplyItem`.

**Props:**
```typescript
post: Post
currentUser: User | null
onLikePost: (postId) => void
onAddComment: (postId, content) => void
onLikeComment: (postId, commentId) => void
onAddReply: (postId, commentId, content) => void
onLikeReply: (postId, commentId, replyId) => void
onDeletePost: (postId) => void
onEditPost: (postId, newContent) => void
onToggleVisibility: (postId) => void
```

**Why so many props?** All state lives in `Feed`. `PostCard` is a pure display component that fires events upward. This keeps mutations centralized in one place (Feed), which also owns the localStorage sync. If PostCard owned any of this state, it would be a second source of truth.

**State:**
- `menuOpen` — 3-dot dropdown
- `commentInput` — the write-a-comment input
- `showComments` — collapses/expands the comments section
- `showAllComments` — loads all comments vs showing only the last 2
- `isEditing` — switches post content to an editable textarea
- `editContent` — textarea value during edit
- `showLikes` — toggles the "who liked" popover

**Key behaviours:**

**3-dot menu:**
- Uses `menuRef` + `document.addEventListener('mousedown')` for click-outside detection.
- Only "Edit Post", "Make Public/Friends Only", and "Delete Post" are shown if `currentUser.id === post.authorId`. Other items (Save Post, Turn On Notification, Hide) are shown to everyone.

**Inline editing:**
- When "Edit Post" is clicked, `isEditing = true` replaces the post text with a `<textarea>` pre-filled with current content. "Save" calls `onEditPost` and closes edit mode. "Cancel" discards changes.

**Comment pagination:**
- Always shows the last 2 comments (`slice(-2)`). A "View N previous comments" button appears if there are more. Clicking it sets `showAllComments = true` which shows all.
- Why last 2, not first 2? The last 2 are the most recent, which is what users typically want to see first in a social feed.

**Like display:**
- Up to 3 circular initials bubbles (with `z-index` stacking to overlap like avatar piles).
- Clicking the like count area toggles a popover listing all likers by name.

**`CommentItem` sub-component:**
- Handles its own reply input open/closed state and reply text state.
- Shows a "View N replies" toggle that expands `ReplyItem` components inline.

**`ReplyItem` sub-component:**
- Minimal — just avatar, bubble with author + text, like button, timestamp.

**Why sub-components in the same file?** `CommentItem` and `ReplyItem` are tightly coupled to `PostCard`'s CSS module and domain logic. Splitting them into separate files would require either sharing the CSS module (unusual) or duplicating styles. They are not used anywhere else in the app, so creating separate component folders would be over-engineering.

---

### 6.9 `Feed`

**File:** `src/components/Feed/Feed.tsx`  
**Directive:** `'use client'`

**Responsibility:** The main page. Owns all post state, handles all mutations, composes the layout, enforces the protected route, and controls dark mode.

**State:**
- `posts: Post[]` — the canonical list of all posts
- `darkMode: boolean` — drives `document.documentElement.setAttribute('data-theme', ...)`
- `mounted: boolean` — prevents hydration mismatch (see below)

**Protected route:**
```typescript
useEffect(() => {
  if (!isLoading && user === null) router.replace('/login');
}, [user, isLoading, router]);
```
This fires after hydration. `isLoading` prevents a premature redirect while the session is being restored from localStorage.

**`mounted` flag:** The component renders `null` until both `isLoading` is false and the first `useEffect` (which loads posts) has run. This prevents a hydration mismatch where the server renders an empty post list and the client immediately replaces it with localStorage data.

**Mutation pattern — all handlers follow the same shape:**
```typescript
const handleXxx = (...args) => {
  if (!user) return;               // guard: must be logged in
  const nextPosts = posts.map(...); // immutable update
  updatePosts(nextPosts);           // setState + savePosts()
};
```

`updatePosts` is a helper that calls both `setPosts` and `savePosts` atomically, ensuring React state and localStorage always stay in sync.

**Layout:** CSS Grid with three responsive breakpoints:
- Mobile (`< 768px`): 1 column (center only)
- Tablet (`≥ 768px`): 2 columns (left sidebar + center)
- Desktop (`≥ 1200px`): 3 columns (left + center + right)

---

## 7. Styling System

### 7.1 Design tokens (`src/app/globals.css`)

All values come from CSS custom properties on `:root`:

| Variable | Light value | Dark value |
|---|---|---|
| `--primary` | `#377dff` | same |
| `--primary-hover` | `#2563d4` | same |
| `--dark` | `#112032` | same |
| `--surface` | `#ffffff` | `#1a2942` |
| `--bg` | `#f0f2f5` | `#112032` |
| `--border` | `#e8e8e8` | `#243550` |
| `--text` | `#112032` | `#e8edf3` |
| `--text-secondary` | `#666666` | `#8899aa` |
| `--shadow` | `rgba(0,0,0,0.08)` | `rgba(0,0,0,0.30)` |
| `--radius` | `6px` | same |
| `--radius-lg` | `12px` | same |
| `--online` | `#0acf83` | same |

Dark mode activates by adding `data-theme="dark"` to `<html>`. All components automatically pick up the new values — no component-level dark mode logic needed.

### 7.2 Font

```typescript
// src/app/layout.tsx
const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['100', '300', '400', '500', '600', '700', '800'],
});
```
The font is loaded once at the root layout level, exposed as a CSS variable, and applied globally via `font-family: var(--font-poppins)` in `globals.css`.

### 7.3 Responsive breakpoints

| Breakpoint | Value | Activates |
|---|---|---|
| Tablet | `768px` | Desktop navbar, left sidebar visible, dark toggle moves up |
| Desktop | `1200px` | Right sidebar visible, 3-column grid |

---

## 8. Routing

| Route | Component | Behaviour |
|---|---|---|
| `/` | `src/app/page.tsx` | Server-side `redirect('/login')` |
| `/login` | `Login` | Redirects to `/feed` if already logged in |
| `/register` | `Register` | Redirects to `/feed` if already logged in |
| `/feed` | `Feed` | Redirects to `/login` if not logged in |

All redirects are client-side (via `useEffect` + `router.replace`) because session state lives in localStorage and is not available during server-side rendering.

`router.replace` is used instead of `router.push` for auth redirects so that the page being redirected from does not appear in the browser history. Pressing Back after logging in would not return the user to the login page.

---

## 9. Dark Mode

**Implementation:**
1. `Feed` holds a `darkMode: boolean` state.
2. A `useEffect` applies `document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : '')` on every change.
3. All CSS custom properties re-resolve automatically because they watch `[data-theme='dark']` on `:root`.
4. Shape images on login/register pages use `:global([data-theme='dark']) .shape-light { display: none }` to swap between light and dark SVG variants.

**Why not `useContext` or a global dark mode store?** Dark mode only affects the feed. Login and register pages have their own shape-swap logic via CSS selectors, requiring no JavaScript at all. A separate context would add complexity for no gain.

**Why not `prefers-color-scheme` media query?** The task required an explicit toggle button (matching the feed.html template), not automatic system-based switching.

---

## 10. State Management & Data Flow

```
AuthContext (global)
  └── user, isLoading, login(), register(), logout()

Feed (local state owner for posts)
  ├── posts: Post[]          ← loaded from localStorage on mount
  ├── handleNewPost()        ← prepends new post + savePosts()
  ├── handleLikePost()       ← toggles like on post
  ├── handleAddComment()     ← appends comment to post
  ├── handleLikeComment()    ← toggles like on comment
  ├── handleAddReply()       ← appends reply to comment
  ├── handleLikeReply()      ← toggles like on reply
  ├── handleDeletePost()     ← filters post out of array
  ├── handleEditPost()       ← updates post content
  └── handleToggleVisibility() ← flips post.isPublic
        │
        ├── CreatePost ←── onPost callback
        └── PostCard[] ←── all the other callbacks
              └── CommentItem
                    └── ReplyItem
```

**All mutations are immutable array operations** (`map`, `filter`) that produce a new array, which is then passed to both `setPosts` (React re-render) and `savePosts` (localStorage sync) via the `updatePosts` helper. No post object is mutated in place.

**Why all state in Feed and not in each PostCard?** If PostCard owned like state, it would be out of sync with localStorage and with other PostCards that might display the same like count. Lifting state up to Feed ensures one source of truth.
