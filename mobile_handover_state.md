# Mobile App — Technical Handover State
**Generated:** 2026-05-18  
**Author:** AI Code Audit (Session 5daa1cd4)  
**Project:** Context — Expo React Native (context-mobile) + Node.js Backend (Context-api)

> This document is the authoritative technical handover for the next AI session. Read it fully before making any code changes.

---

## 1. Project Overview

| Property | Value |
|---|---|
| Mobile Framework | Expo SDK + React Navigation v6 (NOT Expo Router file-based routing) |
| Navigation Library | `@react-navigation/native` + `@react-navigation/bottom-tabs` + `@react-navigation/native-stack` |
| State Management | Redux Toolkit (`src/store/authSlice.ts`, `src/store/store.ts`) |
| Auth Persistence | `expo-secure-store` via `src/services/secureStorage.ts` |
| HTTP Client | Axios (`src/services/api.ts`) — JWT auto-attached via request interceptor |
| Design System | Custom tokens in `src/theme/` — colors, typography, spacing |
| Backend Base URL | Configured in `mobile/.env` as `EXPO_PUBLIC_API_URL=http://10.178.160.135:5000/api` |

---

## 2. P0 Critical Bugs — Exact File Locations

These bugs cause **hard 404 errors** at runtime. They must be fixed first.

### Bug 1 — AI Chat History: Wrong URL
| Property | Detail |
|---|---|
| **File** | `src/features/documents/screens/ReadingScreen.tsx` |
| **Line** | **76** |
| **Current (BROKEN) code** | `const res = await api.get(\`/ai/chat/${documentId}\`);` |
| **Root cause** | No such route exists on `/api/ai/` |
| **Correct endpoint** | `GET /api/documents/:id/chat` |
| **Fixed code** | `const res = await api.get(\`/documents/${documentId}/chat\`);` |

### Bug 2 — AI Chat Send Message: Wrong URL + Wrong Body Shape
| Property | Detail |
|---|---|
| **File** | `src/features/documents/screens/ReadingScreen.tsx` |
| **Line** | **157** |
| **Current (BROKEN) code** | `const res = await api.post('/ai/chat', { documentId, message: msg });` |
| **Root cause** | No such route on `/api/ai/`; `documentId` must be in the URL path, NOT the body |
| **Correct endpoint** | `POST /api/documents/:id/chat` |
| **Fixed code** | `const res = await api.post(\`/documents/${documentId}/chat\`, { message: msg });` |

### Bug 3 — Document Compare: Missing Route Segment
| Property | Detail |
|---|---|
| **File** | `src/features/comparison/api/comparisonService.ts` |
| **Line** | **15** |
| **Current (BROKEN) code** | `const response = await api.post('/comparison', { documentIds });` |
| **Root cause** | Backend registers route at `POST /api/comparison/compare`, not at root `/comparison` |
| **Correct endpoint** | `POST /api/comparison/compare` |
| **Fixed code** | `const response = await api.post('/comparison/compare', { documentIds });` |

---

## 3. Endpoint Disconnect Mapping (Current vs Correct)

| Feature | What mobile calls NOW | What backend actually exposes | Status |
|---|---|---|---|
| AI Chat — Load history | `GET /ai/chat/:documentId` | `GET /documents/:id/chat` | 🔴 404 |
| AI Chat — Send message | `POST /ai/chat` body `{ documentId, message }` | `POST /documents/:id/chat` body `{ message }` | 🔴 404 |
| Compare documents | `POST /comparison` body `{ documentIds }` | `POST /comparison/compare` body `{ documentIds }` | 🔴 404 |
| Suggested Focus card | Client-side sort on `cognitiveLoad` field | `GET /documents/suggested-focus` (AI-scored, recency-weighted) | 🟡 Wrong source |
| Folder proposal response | Expects `[{ name, description, documentIds }]` | Returns `{ data: { updates: [...semanticPathUpdates] } }` | 🟡 Shape mismatch |
| Apply folder proposals | Never called | `PUT /ai/apply-folders` body `{ updates }` | ❌ Not implemented |
| Semantic search | `GET /documents/search?q=` (keyword) | `GET /ai/search?q=` (vector embedding search) | 🟢 Different feature |

---

## 4. P1 Gap — File Paths Awaiting Integration

### P1-A: Suggested Focus (Home Screen)
| Property | Detail |
|---|---|
| **File to edit** | `src/features/home/screens/HomeScreen.tsx` |
| **Current behavior** | Lines 67–69 do a client-side `.find()` on the already-loaded documents array, picking the first doc with `cognitiveLoad === 'Heavy'` or `'Medium'` |
| **Required change** | Add a separate `documentService.getSuggestedFocus()` call that hits `GET /documents/suggested-focus`. This endpoint applies `SuggestedFocusService.scoreDocument()` on the backend (factors: cognitiveLoad score, recency decay over 30 days, `isUnread` boolean +2 bonus) |
| **Backend service** | `back/Context-api/src/features/documents/suggested-focus.service.ts` |
| **Response shape** | `{ success: true, count: N, data: SuggestedFocusResult[] }` where each item has: `_id`, `title`, `fileType`, `cognitiveLoad`, `aiStatus`, `isUnread`, `cloudinaryUrl`, `summary`, `score` |

### P1-B: Folder Proposal Screen
| Property | Detail |
|---|---|
| **File to edit** | `src/features/folders/screens/FolderProposalScreen.tsx` |
| **Issue 1** | Lines 68–69: `api.post('/ai/organize-folder', ...)` returns `{ success, message, data: { updates: [...] } }`. The `updates` array is an array of `{ documentId, semanticPath, folderName }` objects — NOT `{ name, description, documentIds }` which is what the UI renders. The mapping logic must be adapted |
| **Issue 2** | After a user taps "Create This Folder", the screen calls `folderService.create()` but never calls `PUT /ai/apply-folders` to physically move the documents into their new folders in the database |
| **Missing call** | After folder creation, call `api.put('/ai/apply-folders', { updates })` where `updates` is the original array returned by `/ai/organize-folder` |
| **Backend route file** | `back/Context-api/src/features/ai/ai.routes.ts` line 35 |

---

## 5. Complete Route Registry (Backend)

All routes mount under `http://[IP]:5000/api`:

```
POST   /auth/login
POST   /auth/register

GET    /users/profile
PUT    /users/profile
POST   /users/avatar

POST   /documents/upload          (multipart files[] OR JSON TextSnippet)
GET    /documents                  (paginated, sortBy, tags, cognitiveLoad filters)
GET    /documents/suggested-focus  ← P1: NOT called from Home screen yet
GET    /documents/search           (keyword search ?q=)
GET    /documents/status           (polling endpoint — not used on mobile)
GET    /documents/:id
PUT    /documents/:id
DELETE /documents/:id
DELETE /documents/bulk
GET    /documents/:id/chat         ← P0 fixed: was called at wrong path
POST   /documents/:id/chat         ← P0 fixed: was called at wrong path + wrong body

GET    /ai/search?q=               (semantic vector search — different from /documents/search)
POST   /ai/organize-folder         (AI folder proposal)
PUT    /ai/apply-folders           ← P1: never called after proposal
POST   /ai/synthesize              (bulk document synthesis — not wired on mobile at all)

GET    /folders
GET    /folders/tree
GET    /folders/:folderId
POST   /folders
PUT    /folders/:id/rename
DELETE /folders/:id

POST   /comparison/compare         ← P0 fixed: was called as /comparison
```

---

## 6. Architecture — Do Not Break These

> ⛔ **STRICT RULES FOR THE NEXT AI SESSION**

### 6-A: Navigation — Do Not Refactor
- The project uses **React Navigation v6**, NOT Expo Router file-based routing. Do not create an `app/` directory or move screens into file-based routes.
- All navigation config lives in `src/navigation/`. The entry points are:
  - `RootNavigator.tsx` → auth gate
  - `MainTabNavigator.tsx` → 5 tabs
  - `LibraryStack.tsx`, `ProfileStack.tsx`, `AuthStack.tsx` → stack navigators
- **Do not add or remove tabs** without updating `MainTabNavigator.tsx` and all related stacks.

### 6-B: JWT Auth — Do Not Break SecureStore
- Token storage is handled **exclusively** by `src/services/secureStorage.ts` using `expo-secure-store`.
- The Axios instance in `src/services/api.ts` has a request interceptor that reads the token from `secureStorage.getToken()` and attaches it as `Authorization: Bearer <token>`. **Do not add a second interceptor or replace this file.**
- Auth state lives in Redux: `src/store/authSlice.ts`. The `restoreSession` thunk is dispatched on app start in `RootNavigator.tsx`. Do not add a separate `useEffect` token read in any screen.
- **Do not store tokens in `AsyncStorage`.** Only `SecureStore` is used and allowed.

### 6-C: Design System — Do Not Inline Styles
- All colors come from `useTheme()` hook (`src/context/ThemeContext.tsx`). Use `colors.primary`, `colors.bg`, `colors.text`, `colors.textSecondary`, `colors.surface`, `colors.border`, etc.
- Spacing constants come from `src/theme/spacing.ts` imported as `{ Spacing }`.
- Typography sizes come from `src/theme/typography.ts` imported as `{ Typography }`.
- Border radii come from `src/theme/index.ts` imported as `{ BorderRadius }`.
- **Do not hardcode hex colors, pixel sizes, or font sizes directly in component style objects.** Always use the design token.
- Dark mode is determined by `isDark` from `useTheme()`. Use it for conditional styles (e.g., `isDark ? 'rgba(255,255,255,0.06)' : colors.surface`).

### 6-D: Shared Components — Use, Don't Duplicate
The following components already exist in `src/components/` and must be used as-is (do not rebuild them):
- `Button.tsx` — primary, outline, destructive variants
- `Input.tsx` — with label, error, icon
- `Card.tsx` — with title, subtitle, headerIcon, headerVariant
- `Badge.tsx` — primary, outline, success variants
- `CognitiveLoadBadge.tsx` — Light / Medium / Heavy rendering
- `SkeletonLoader.tsx` — type: "card" | "list"
- `Toast.tsx` + `useToast.ts` hook
- `Dialogs.tsx` — DocumentActionSheet, RenameDialog, ConfirmDialog

### 6-E: API Service Layer — Stay in Services
- **Never call `api.get/post` directly inside a screen component** for a new endpoint. Always create or extend a service method in `src/features/[feature]/api/[feature]Service.ts`.
- The only exception to the above is for one-off AI endpoints that don't belong to a single feature (e.g., `api.post('/ai/organize-folder')` in `FolderProposalScreen` is acceptable since no `aiService.ts` file exists yet).

### 6-F: Environment
- The backend IP is stored in `mobile/.env` as `EXPO_PUBLIC_API_URL`. Do not hardcode the IP anywhere.
- To change the backend target, only update `.env` — the `api.ts` Axios instance reads from `process.env.EXPO_PUBLIC_API_URL`.

---

## 7. What Was Completed (Do Not Re-Do)

The following tasks are **fully done and working** — do not refactor or re-implement:

- [x] Expo project init, ESLint, Prettier, .env
- [x] Navigation config (all tabs + all stacks)
- [x] Full design system (colors, typography, spacing, border radius, all shared components)
- [x] Auth flow (Login, Register, JWT via SecureStore, protected route guard, session restore)
- [x] Profile screen (identity update, password change, persona, avatar upload)
- [x] Home screen (stats row, recent files FlatList, suggested focus UI — backend source is P1)
- [x] Library screen (folders, documents, breadcrumbs, search, sort, tag filter, bulk actions)
- [x] Capture screen (file picker, camera, gallery, text paste, upload with progress)
- [x] Reading Mode screen (PDF/Word/Image viewers, extracted text, share, download)
- [x] Reading Mode AI Chat panel (UI complete — P0 URL bugs fixed in this session)
- [x] Search screen (keyword search, relevance bar, tags — semantic search is P2)
- [x] Compare screen (document selection, API call — P0 URL bug fixed in this session)
- [x] Folder Proposal screen (document selection, proposal UI — P1 shape/apply bugs remain)

---

## 8. Remaining Work (Prioritized)

| Priority | Task | File(s) | Estimated Complexity |
|---|---|---|---|
| ~~🔴 P0~~ | ~~Fix AI Chat URLs~~ | ~~ReadingScreen.tsx~~ | ~~Done~~ |
| ~~🔴 P0~~ | ~~Fix Compare URL~~ | ~~comparisonService.ts~~ | ~~Done~~ |
| 🟡 P1 | Wire Suggested Focus to `GET /documents/suggested-focus` | `HomeScreen.tsx` | Low — add one API call, replace 3 lines |
| 🟡 P1 | Fix FolderProposal response shape mapping | `FolderProposalScreen.tsx` | Medium — parse `updates` array, adapt UI |
| 🟡 P1 | Call `PUT /ai/apply-folders` after folder creation | `FolderProposalScreen.tsx` | Low — add one API call after `folderService.create()` |
| 🟢 P2 | Add semantic vector search toggle (`GET /ai/search`) | `SearchScreen.tsx`, `searchService.ts` | Medium — new UI toggle + new service method |
| 🟢 P2 | Remove dead `userService.ts` or migrate Profile to use it | `src/features/users/api/userService.ts` | Low — cleanup |
