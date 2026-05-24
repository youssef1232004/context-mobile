# Mobile App Audit Report
**Project:** Context — Expo React Native + Node.js Backend
**Date:** 2026-05-18
**Reviewer:** Senior Mobile Tech Lead (AI Audit)

---

## 1. Completion Status

### ✅ Init & Project Setup
| Item | Status | Notes |
|---|---|---|
| Expo project init | ✅ Done | Valid `app.json`, `index.js`, `App.tsx` present |
| Folder structure | ✅ Done | `src/features/`, `components/`, `navigation/`, `services/`, `store/`, `theme/`, `hooks/` all exist |
| ESLint / Prettier | ✅ Done | `.eslintrc.js` + `.prettierrc` at root |
| `.env` | ✅ Done | `EXPO_PUBLIC_API_URL=http://10.178.160.135:5000/api` — one-liner; sufficient |

---

### ✅ Expo Router / Navigation Config
Uses **React Navigation** (not Expo Router file-based routing, but functionally equivalent):

| Navigator | Screens registered | Status |
|---|---|---|
| Tab Navigator | Home, Library, Capture, Search, Profile | ✅ Done |
| AuthStack | Login, Register | ✅ Done |
| LibraryStack | Library → Reading → Compare → FolderProposal | ✅ Done |
| ProfileStack | ProfileMain → Settings | ✅ Done |
| RootNavigator | Auth guard via `restoreSession` thunk | ✅ Done |

> **Note:** Navigation is React Navigation v6, not Expo Router's file-based system. Architecturally fine; just confirm this was intentional vs. the brief saying "Expo Router."

---

### ✅ Design System
| Item | Status | Notes |
|---|---|---|
| Colors | ✅ Done | `theme/colors.ts` — dark/light palettes |
| Typography | ✅ Done | `theme/typography.ts` |
| Spacing | ✅ Done | `theme/spacing.ts` |
| Button | ✅ Done | `components/Button.tsx` |
| Input | ✅ Done | `components/Input.tsx` |
| Card | ✅ Done | `components/Card.tsx` |
| Badge | ✅ Done | `components/Badge.tsx` + `CognitiveLoadBadge.tsx` |
| Toast | ✅ Done | `components/Toast.tsx` + `hooks/useToast.ts` |
| SkeletonLoader | ✅ Done | `components/SkeletonLoader.tsx` |
| ThemeContext | ✅ Done | `context/ThemeContext.tsx` |

---

### ✅ Auth Flow
| Item | Status | Notes |
|---|---|---|
| LoginScreen UI | ✅ Done | Full form with validation, error display |
| RegisterScreen UI | ✅ Done | `RegisterScreen.tsx` (16 KB — full form) |
| Redux `authSlice` | ✅ Done | `loginUser`, `registerUser`, `updateProfile`, `restoreSession` thunks |
| JWT via SecureStore | ✅ Done | `services/secureStorage.ts` — get/set/clear |
| Axios interceptor (attach token) | ✅ Done | `services/api.ts` — `Authorization: Bearer` on every request |
| Protected route guard | ✅ Done | `RootNavigator` — gates on `isAuthenticated` from Redux |
| Session restore on app start | ✅ Done | `restoreSession` dispatched in `RootNavigator` `useEffect` |

---

### ✅ Profile Screen
| Item | Status | Notes |
|---|---|---|
| GET /users/profile | ✅ Done | Via Redux `updateProfile` thunk (reads from SecureStore) |
| PUT /users/profile (Identity: fullName, username, email) | ✅ Done | Dispatches `updateProfile` thunk → `authService.updateProfile` → `PUT /users/profile` |
| Persona update | ✅ Done | Same thunk, sends `{ persona }` |
| Password change | ✅ Done | `{ currentPassword, password }` via same thunk |
| Avatar upload | ✅ Done | `authService.uploadAvatar` → `POST /users/avatar` |

> ⚠️ **Minor inconsistency:** `userService.ts` uses `PATCH /users/profile` but `authService.updateProfile` (which is actually called) uses `PUT /users/profile`. The backend only exposes `PUT`. The unused `userService.ts` is dead code.

---

### ✅ Home Screen
| Item | Status | Notes |
|---|---|---|
| Greeting with user name | ✅ Done | `user?.fullName` from Redux store |
| Stats row (doc count, folder count) | ✅ Done | Real API calls via `documentService.getAll()` + `folderService.getTree()` |
| Suggested Focus card | ⚠️ **Partial** | Uses real doc data but applies client-side logic (picks highest `cognitiveLoad`) — NOT calling the dedicated `GET /documents/suggested-focus` endpoint |
| Recent Files FlatList | ✅ Done | Real API call (`limit: 10, sortBy: updatedAt`) |
| SkeletonLoader on load | ✅ Done | |
| Pull-to-refresh | ✅ Done | |

---

### ✅ Library Screen
| Item | Status | Notes |
|---|---|---|
| Document list via API | ✅ Done | `folderService.getContents()` → `GET /folders` or `GET /folders/:id` |
| Folder tree navigation + breadcrumbs | ✅ Done | |
| Tag filter chips | ✅ Done | Derived from loaded documents |
| Search (debounced) | ✅ Done | Passed as query param to `folderService.getContents` |
| Sort options | ✅ Done | `updatedAt`, `title`, `cognitiveLoad` |
| Cognitive Load badges | ✅ Done | `CognitiveLoadBadge` component |
| Rename / Delete / Share per document | ✅ Done | `documentService.update`, `documentService.delete`, native `Share.share` |
| Bulk delete | ✅ Done | `documentService.bulkDelete` → `DELETE /documents/bulk` |
| Bulk Compare → CompareScreen | ✅ Done | Navigation pass-through |
| Bulk AI Organize → FolderProposalScreen | ✅ Done | Navigation pass-through |

---

### ✅ Capture Screen
| Item | Status | Notes |
|---|---|---|
| File picker (multi, PDF/DOCX/TXT) | ✅ Done | `expo-document-picker` |
| Camera capture | ✅ Done | `expo-image-picker` → `launchCameraAsync` |
| Gallery pick | ✅ Done | `expo-image-picker` → `launchImageLibraryAsync` |
| Text paste with title | ✅ Done | `documentService.uploadText()` → `POST /documents/upload` (JSON body) |
| File upload with progress | ✅ Done | `documentService.uploadWithProgress()` → `POST /documents/upload` (multipart) |
| Upload progress bar | ✅ Done | Axios `onUploadProgress` |

---

### ✅ Reading Mode Screen
| Item | Status | Notes |
|---|---|---|
| Fetch document by ID | ✅ Done | `documentService.getById()` → `GET /documents/:id` |
| Extracted text / summary view | ✅ Done | |
| PDF viewer (WebView → Google Docs) | ✅ Done | |
| Word viewer (Mammoth.js in WebView) | ✅ Done | |
| Image viewer | ✅ Done | |
| Download to device | ✅ Done | `FileSystem.downloadAsync` + `Sharing.shareAsync` |
| Share document | ✅ Done | Native `Share.share` with Cloudinary URL |
| AI Sidebar Chat toggle | ✅ Done | Animated panel |
| AI Chat — load history | ✅ **Connected** | `GET /ai/chat/:documentId` ⚠️ **(see below)** |
| AI Chat — send message | ✅ **Connected** | `POST /ai/chat` ⚠️ **(see below)** |

---

### ✅ Search Screen
| Item | Status | Notes |
|---|---|---|
| Search input + submit | ✅ Done | |
| Semantic search via API | ✅ Done | `searchService.search()` → `GET /documents/search?q=...` |
| Result list with relevance bar | ✅ Done | Normalizes `score` field into a % bar |
| Tag highlight (query match) | ✅ Done | |
| Navigate to document on tap | ✅ Done | |
| SkeletonLoader | ✅ Done | |

---

### ✅ Compare Screen
| Item | Status | Notes |
|---|---|---|
| Load documents on demand | ✅ Done | `documentService.getAll()` |
| Select 2–3 documents | ✅ Done | |
| Run comparison | ✅ Done | `comparisonService.compare()` → `POST /comparison` |
| Render summary, similarities, differences | ✅ Done | |

> ⚠️ `comparisonService` posts to `/comparison` not `/comparison/compare`. Backend route is `POST /api/comparison/compare`. **This is a URL mismatch — will 404.**

---

### ✅ FolderProposal Screen
| Item | Status | Notes |
|---|---|---|
| Load documents | ✅ Done | `documentService.getAll()` |
| Select documents | ✅ Done | |
| Propose folder structure | ✅ Done | `POST /ai/organize-folder` via raw `api.post` |
| Render proposals | ✅ Done | |
| Create folder from proposal | ✅ Done | `folderService.create()` → `POST /folders` |

> ⚠️ Response from `/ai/organize-folder` returns `{ data: { updates: [...] } }` (an array of semantic path updates), but `FolderProposalScreen` expects an array with `{ name, description, documentIds }`. The shape likely **won't match** — needs verification.

---

## 2. Mock Data vs. Real API Calls

**All screens are using real API calls.** There is no hardcoded mock data anywhere in the codebase.

| Screen | Data Source |
|---|---|
| Home | ✅ Real — `GET /documents` + `GET /folders/tree` |
| Library | ✅ Real — `GET /folders` / `GET /folders/:id` |
| Capture | ✅ Real — `POST /documents/upload` |
| Reading Mode | ✅ Real — `GET /documents/:id` + AI chat endpoints |
| Search | ✅ Real — `GET /documents/search?q=...` |
| Profile | ✅ Real — `PUT /users/profile`, `POST /users/avatar` |
| Compare | ✅ Real — `POST /comparison` (with URL bug, see below) |
| FolderProposal | ✅ Real — `POST /ai/organize-folder` (with response shape bug, see below) |

---

## 3. Backend Mapping & AI Feature Gaps

### 3A. Critical URL / Contract Bugs

| # | Screen | Mobile calls | Backend exposes | Issue |
|---|---|---|---|---|
| 🔴 1 | ReadingScreen (AI Chat — load history) | `GET /ai/chat/:documentId` | Does **not exist** on `/ai/` router | **404** — correct endpoint is `GET /documents/:id/chat` |
| 🔴 2 | ReadingScreen (AI Chat — send message) | `POST /ai/chat` with body `{ documentId, message }` | Does **not exist** on `/ai/` router | **404** — correct endpoint is `POST /documents/:id/chat` |
| 🔴 3 | CompareScreen | `POST /comparison` | `POST /api/comparison/compare` | **404** — missing `/compare` segment |
| 🟡 4 | FolderProposalScreen | Expects `res.data` to be `[{ name, description, documentIds }]` | Returns `{ data: { updates: [...] } }` (semantic path updates, not folder name proposals) | **Response shape mismatch** — UI will render empty or crash |

---

### 3B. Missing Frontend Integration — Dedicated AI Endpoint

| Feature | Backend Endpoint | Mobile Status | What needs to be built |
|---|---|---|---|
| **Suggested Focus** | `GET /api/documents/suggested-focus` | ❌ **Not called** | Home screen applies its own client-side scoring heuristic. Should call the backend's `SuggestedFocusService` instead, which factors in `isUnread`, recency decay, and `cognitiveLoad` scoring |
| **AI Chat — History** | `GET /api/documents/:id/chat` | 🔴 Wrong URL | Fix: `api.get(`/documents/${documentId}/chat`)` |
| **AI Chat — Send** | `POST /api/documents/:id/chat` with body `{ message }` | 🔴 Wrong URL + body shape | Fix: `api.post(`/documents/${documentId}/chat`, { message })` |
| **Comparison** | `POST /api/comparison/compare` | 🔴 Wrong URL | Fix: change from `/comparison` to `/comparison/compare` |
| **Folder Proposal** | `POST /api/ai/organize-folder` | 🟡 URL correct, shape wrong | Fix: parse `res.data.data.updates` and map to UI-friendly format |
| **Apply Folder Proposal** | `PUT /api/ai/apply-folders` | ❌ **Not implemented** | After user approves a proposal, the mobile never calls `apply-folders` to physically move documents in DB |
| **Semantic Search** | `GET /api/ai/search?q=...` *(vector search)* | 🟡 Calls keyword search instead | Mobile calls `GET /documents/search` (keyword-based). The true semantic/vector search is at `GET /api/ai/search`. These are two different backends |

---

### 3C. Backend Endpoints Summary (Full Map)

```
Backend Base: http://[IP]:5000/api
```

| Method | Endpoint | Used by Mobile? |
|---|---|---|
| POST | /auth/login | ✅ Yes |
| POST | /auth/register | ✅ Yes |
| GET | /users/profile | ✅ Yes (via authService) |
| PUT | /users/profile | ✅ Yes |
| POST | /users/avatar | ✅ Yes |
| GET | /documents | ✅ Yes |
| GET | /documents/suggested-focus | ❌ No — should be used on Home |
| GET | /documents/search | ✅ Yes (keyword search) |
| GET | /documents/status | ❌ No |
| POST | /documents/upload | ✅ Yes |
| GET | /documents/:id | ✅ Yes |
| PUT | /documents/:id | ✅ Yes |
| DELETE | /documents/:id | ✅ Yes |
| DELETE | /documents/bulk | ✅ Yes |
| GET | /documents/:id/chat | ❌ Called at wrong URL |
| POST | /documents/:id/chat | ❌ Called at wrong URL |
| GET | /ai/search?q= | ❌ No — semantic vector search, not wired |
| POST | /ai/organize-folder | ✅ Yes (URL correct, shape mismatch) |
| PUT | /ai/apply-folders | ❌ No — never called after proposal |
| POST | /ai/synthesize | ❌ No — not exposed on mobile at all |
| GET | /folders | ✅ Yes |
| GET | /folders/:id | ✅ Yes |
| GET | /folders/tree | ✅ Yes |
| POST | /folders | ✅ Yes |
| PUT | /folders/:id/rename | ❌ No |
| DELETE | /folders/:id | ❌ No |
| POST | /comparison/compare | 🔴 Wrong URL used |
| GET | /api/health | ❌ No |

---

## 4. Priority Fix List (Before Integration Phase)

| Priority | Issue | File | Fix |
|---|---|---|---|
| 🔴 P0 | AI Chat history wrong URL | `ReadingScreen.tsx:76` | Change to `GET /documents/${documentId}/chat` |
| 🔴 P0 | AI Chat send wrong URL + body | `ReadingScreen.tsx:157` | Change to `POST /documents/${documentId}/chat` with body `{ message }` only |
| 🔴 P0 | Compare wrong URL | `comparisonService.ts:15` | Change `/comparison` → `/comparison/compare` |
| 🟡 P1 | Home Suggested Focus uses wrong source | `HomeScreen.tsx:67-69` | Call `GET /documents/suggested-focus` instead of client-side sort |
| 🟡 P1 | FolderProposal response shape mismatch | `FolderProposalScreen.tsx:68-69` | Parse `res.data.data.updates` and adapt to `{ name, description, documentIds }` |
| 🟡 P1 | Apply-folders never called | `FolderProposalScreen.tsx` | After folder creation, call `PUT /ai/apply-folders` to move documents |
| 🟢 P2 | Semantic vs keyword search | `searchService.ts` | Consider adding a "Semantic" toggle that calls `GET /ai/search?q=` |
| 🟢 P2 | `userService.ts` is dead code | `users/api/userService.ts` | Either use it or delete — `authService` handles profile already |
| 🟢 P2 | CORS only allows `localhost:5173` | `back/Context-api/src/app.ts:30` | The mobile app IP is different — backend CORS needs to be opened for mobile (already works if using API URL directly, but confirm `credentials` header behavior) |
