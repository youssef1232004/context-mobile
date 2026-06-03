# Mobile → Frontend Alignment — Detailed Implementation Plan

> **Goal**: Make the Context mobile app (`context-mobile`) look and behave **identically** to the Context frontend web app (`context-mvp-front`). The frontend is the source of truth.

> [!IMPORTANT]
> This plan is organized into 7 phases. Each phase has concrete, file-level steps. Phases should be executed **in order** because later phases depend on earlier ones (e.g., Phase 1 design tokens are used by every screen).

---

## Phase 1 — Design System Foundation

> Every screen depends on this. Do this first.

---

### Step 1.1 · Load Custom Fonts via `expo-font`

**Why**: The frontend uses **Rajdhani** (display/headings), **Inter** (body), **JetBrains Mono** (monospace labels & code), and **Fira Code** (code blocks). The mobile app currently uses only `SpaceMono` and system defaults, which gives it a completely different feel.

**Files to change:**
- [MODIFY] [App.tsx](file:///d:/Final/context-mobile/App.tsx) — Load fonts with `useFonts` from `expo-font` before rendering the app. Show a splash screen while loading.
- [MODIFY] [typography.ts](file:///d:/Final/context-mobile/src/theme/typography.ts) — Update `families` object to use the loaded custom fonts:
  ```
  families: {
    display: 'Rajdhani-Bold',     // For headings like "Initialize System", "Context"
    body: 'Inter-Regular',        // For all body text
    bodyMedium: 'Inter-Medium',
    bodyBold: 'Inter-Bold',
    mono: 'JetBrainsMono-Bold',   // For labels, badges, status text
    code: 'FiraCode-Regular',     // For code blocks in chat
  }
  ```

**Font files to add:** Download and place in `assets/fonts/`:
- `Rajdhani-Bold.ttf`
- `Inter-Regular.ttf`, `Inter-Medium.ttf`, `Inter-Bold.ttf`
- `JetBrainsMono-Bold.ttf`
- `FiraCode-Regular.ttf`

---

### Step 1.2 · Create `SectionLabel` Component

**Why**: The frontend uses a distinctive label pattern everywhere — section headers like "IDENTITY", "ACCESS KEY", "SELECT SEMANTIC CORE" are styled as: `text-[10px] font-mono font-bold uppercase tracking-widest text-primary`. The mobile uses inconsistent inline styles.

**File to create:**
- [NEW] `src/components/SectionLabel.tsx`
  ```tsx
  // Props: text, color (optional, defaults to primary)
  // Style: fontFamily: 'JetBrainsMono-Bold', fontSize: 10, fontWeight: '700',
  //        textTransform: 'uppercase', letterSpacing: 1.5, color: colors.primary
  ```

**Files to update** (replace all inline label styles):
- [MODIFY] [Input.tsx](file:///d:/Final/context-mobile/src/components/Input.tsx) — Use `SectionLabel` for the `label` prop rendering (lines 40-51)
- [MODIFY] [RegisterScreen.tsx](file:///d:/Final/context-mobile/src/features/auth/screens/RegisterScreen.tsx) — Replace inline "Select Semantic Core" label (line 204-216)
- [MODIFY] [ProfileScreen.tsx](file:///d:/Final/context-mobile/src/features/users/screens/ProfileScreen.tsx) — Replace "Semantic Persona" label (line 268)
- [MODIFY] [ReadingScreen.tsx](file:///d:/Final/context-mobile/src/features/documents/screens/ReadingScreen.tsx) — Replace "AI Summary" label (line 549)
- [MODIFY] [CaptureScreen.tsx](file:///d:/Final/context-mobile/src/features/documents/screens/CaptureScreen.tsx) — Replace "Title (optional)" and "Content" labels

---

### Step 1.3 · Create `GradientLine` Component

**Why**: The frontend renders a gradient accent line at the top/side of every card (login, register, etc.): `bg-gradient-to-r from-primary via-accent to-secondary`. The mobile uses a flat solid color line.

**File to create:**
- [NEW] `src/components/GradientLine.tsx`
  ```tsx
  // Uses expo-linear-gradient
  // Props: direction ('horizontal' | 'vertical'), height/width
  // Default gradient: [colors.primary, colors.accent, colors.secondary]
  // Renders: <LinearGradient colors={...} start/end style={...} />
  ```

---

### Step 1.4 · Enhance `Card.tsx` — Add Gradient Accent

**Why**: Frontend cards have a subtle gradient accent line at the top. Mobile's [Card.tsx](file:///d:/Final/context-mobile/src/components/Card.tsx) has no accent.

**Changes to [Card.tsx](file:///d:/Final/context-mobile/src/components/Card.tsx):**
- Add optional `accentGradient?: boolean` prop (default `false`)
- When `true`, render `<GradientLine direction="horizontal" height={3} />` as the first child inside the card container (before the header)
- Add optional `shadowElevation` prop for Android shadow / iOS `shadowOffset` matching frontend's `shadow-2xl`

---

### Step 1.5 · Enhance `Button.tsx` — Add Shadow + Scale Animation

**Why**: Frontend buttons have: `shadow-[0_4px_14px]`, `hover:scale-[1.02]`, `active:scale-[0.98]`, and a `group-hover:translate-x-1` arrow animation. Mobile's [Button.tsx](file:///d:/Final/context-mobile/src/components/Button.tsx) has none of these.

**Changes to [Button.tsx](file:///d:/Final/context-mobile/src/components/Button.tsx):**
- Replace `TouchableOpacity` with `Animated.createAnimatedComponent(Pressable)` or use `react-native-reanimated`
- Add `onPressIn` → scale to `0.98`, `onPressOut` → scale to `1.0` using `Animated.spring`
- Add `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`, `elevation` matching the frontend glow: `shadow-[0_4px_14px_rgba(16,55,102,0.3)]` → `{ shadowColor: '#103766', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 8 }`

---

### Step 1.6 · Enhance `Input.tsx` — Add Focus Ring Animation

**Why**: Frontend inputs change border color + add a ring on focus (`focus-visible:ring-2 ring-primary/20`). Mobile's [Input.tsx](file:///d:/Final/context-mobile/src/components/Input.tsx) changes border color on focus but has no ring/glow.

**Changes to [Input.tsx](file:///d:/Final/context-mobile/src/components/Input.tsx):**
- Use `Animated` to interpolate `borderColor` smoothly (300ms ease)
- Add a subtle `shadowColor: colors.primary, shadowOpacity: 0.15, shadowRadius: 8` when focused
- Use `SectionLabel` for the `label` rendering instead of inline `<Text>`

---

## Phase 2 — Auth Screens

---

### Step 2.1 · Login Screen — Add Gradient Line + Typography

**File**: [LoginScreen.tsx](file:///d:/Final/context-mobile/src/features/auth/screens/LoginScreen.tsx)

**Changes:**
1. Replace the solid `<View style={{ height: 3, backgroundColor: colors.primary }}>` accent line (line ~112 in RegisterScreen, similar in LoginScreen) with `<GradientLine />`
2. Change the "Context" brand text to use `fontFamily: 'Rajdhani-Bold'`
3. Change all section labels ("IDENTITY", "ACCESS KEY") to use `<SectionLabel>`
4. Add `backdrop-blur` effect to card: use `BlurView` from `expo-blur` for the semi-transparent card background, or keep the current `rgba` approach but ensure opacity matches frontend (`0.9`)

---

### Step 2.2 · Register Screen — Password Criteria + Label Consistency

**File**: [RegisterScreen.tsx](file:///d:/Final/context-mobile/src/features/auth/screens/RegisterScreen.tsx)

**Changes:**
1. Replace accent line with `<GradientLine />`
2. **Add password criteria checklist** (MISSING). Frontend shows 3 checkmarks below the strength meter:
   - ✓ At least 8 characters
   - ✓ At least 1 uppercase letter
   - ✓ At least 1 number

   Mobile only has the 4-bar strength meter (line 181-193) but no criteria text. Add the checklist matching the frontend (lines 227-246 of frontend's RegisterForm.tsx).
3. Replace all inline label styles with `<SectionLabel>`
4. Use `Rajdhani-Bold` for the "Initialize System" heading

---

### Step 2.3 · Forgot/Reset Password Screens — Style Alignment

**Files:**
- [ForgotPasswordScreen.tsx](file:///d:/Final/context-mobile/src/features/auth/screens/ForgotPasswordScreen.tsx)
- [ResetPasswordScreen.tsx](file:///d:/Final/context-mobile/src/features/auth/screens/ResetPasswordScreen.tsx)

**Changes:**
1. Same card pattern as Login: gradient line, `Rajdhani-Bold` heading, `SectionLabel` for labels
2. Ensure the sci-fi copy matches frontend (e.g., "Recovery Protocol", "Reset Access Key")

---

### Step 2.4 · Build Boot Sequence Screen (NEW)

**Why**: After login/register, the frontend plays a full-screen animated SVG boot sequence ([BootSequence.tsx](file:///d:/Final/context-mvp-front/src/components/layout/BootSequence.tsx)) with:
- A background grid pattern
- 3 outer nodes animating in
- 3 curved paths drawing between nodes and center
- A pulsing center core circle
- A ring around the core
- "Initializing Context Engine" text with bouncing dots
- Fades out with `scale(1.1) + blur` after ~2.5 seconds

**File to create:**
- [NEW] `src/components/BootSequence.tsx`
  - Use `react-native-svg` for the SVG (circles + paths)
  - Use `react-native-reanimated` for: node fade-in (staggered), path draw (`strokeDashoffset` animation), core pulse, ring rotation
  - Use `Animated.View` for the final fade-out + scale
  - Show "INITIALIZING CONTEXT ENGINE" in `JetBrainsMono-Bold`, `10px`, `uppercase`, `letterSpacing: 3`
  - 3 bouncing dots below the text

**Files to modify:**
- [MODIFY] [RootNavigator.tsx](file:///d:/Final/context-mobile/src/navigation/RootNavigator.tsx) — After successful login, show `BootSequence` for ~2.5 seconds before navigating to main tabs. Use a state flag `showBoot` that auto-dismisses.

---

## Phase 3 — Home / Dashboard Screen

---

### Step 3.1 · Build Onboarding Dashboard (Zero-State)

**Why**: When a new user has 0 documents, the frontend shows a full `OnboardingDashboard` with:
- Neural background SVG pattern
- Large "Welcome to Context" heading
- Descriptive subtitle
- Upload CTA button
- Feature highlights

Mobile just shows a small "No documents yet" card.

**Changes to [HomeScreen.tsx](file:///d:/Final/context-mobile/src/features/home/screens/HomeScreen.tsx):**
1. When `documents.length === 0`, render a full-screen onboarding view instead of the current small card
2. Include: large heading with `Rajdhani-Bold`, subtitle, animated upload CTA button, 3 feature cards explaining the app
3. The upload CTA should navigate to the Capture tab

---

### Step 3.2 · Apply Typography + Fonts to Existing Dashboard

**Changes to [HomeScreen.tsx](file:///d:/Final/context-mobile/src/features/home/screens/HomeScreen.tsx):**
1. "Welcome back, {name}" → use `fontFamily: 'Rajdhani-Bold'`
2. Section labels ("RECENT FILES", "NODE STATUS") → use `<SectionLabel>`
3. Stats cards → use `fontFamily: 'JetBrainsMono-Bold'` for the numbers
4. Ensure all cards use the enhanced `Card` component with optional gradient accent

---

## Phase 4 — Library Screen

---

### Step 4.1 · Add Folder Rename Functionality

**Why**: Frontend has `RenameDialog` modal for folder renaming triggered via a three-dots menu. Mobile currently has NO folder rename.

**Changes to [LibraryScreen.tsx](file:///d:/Final/context-mobile/src/features/documents/screens/LibraryScreen.tsx):**
1. Add a three-dots menu (`ellipsis-vertical`) to the far right of every folder row.
2. Tapping the three dots will open the `FolderActionSheet` with a "Rename" option.
3. Show an alert or modal with a `TextInput` pre-filled with the current folder name.
4. Call the existing `folderService.rename(folderId, newName)` API (or create if missing).

---

### Step 4.2 · Add Folder Delete Functionality

**Why**: Frontend has `ConfirmDialog` for folder deletion. Mobile has NO folder delete.

**Changes to [LibraryScreen.tsx](file:///d:/Final/context-mobile/src/features/documents/screens/LibraryScreen.tsx):**
1. Add a "Delete" option to the folder's `FolderActionSheet` triggered by the three-dots menu.
2. Show an `Alert.alert` confirmation dialog ("This will delete the folder and all its contents").
3. Call `folderService.delete(folderId)` API.

---

### Step 4.3 · Sync Document Action Sheet Options

**Why**: The web frontend's document action menu only has "Share", "Rename", and "Delete". Mobile currently has a "Reanalyze" option which causes inconsistency.

**Changes to [Dialogs.tsx](file:///d:/Final/context-mobile/src/components/Dialogs.tsx):**
1. Remove "Reanalyze" from `DocumentActionSheet` to perfectly match the 3 options on the web frontend.

---

### Step 4.3 · Add Pagination (Infinite Scroll)

**Why**: Frontend has full `Pagination` component. Mobile loads ALL documents in one shot which will be slow for large libraries.

**Changes:**
- [MODIFY] [LibraryScreen.tsx](file:///d:/Final/context-mobile/src/features/documents/screens/LibraryScreen.tsx):
  1. Add `page` and `hasMore` state variables
  2. Use `FlatList` with `onEndReached` callback to load next page
  3. Show a small `ActivityIndicator` at the bottom while loading more
  4. Backend already supports `?page=X&limit=Y` query params

---

### Step 4.4 · Typography & Label Updates

**Changes to [LibraryScreen.tsx](file:///d:/Final/context-mobile/src/features/documents/screens/LibraryScreen.tsx):**
1. "Smart Library" heading → `fontFamily: 'Rajdhani-Bold'`
2. Section labels → `<SectionLabel>`
3. Document count badges → `fontFamily: 'JetBrainsMono-Bold'`
4. Sort button text → mono font

---

## Phase 5 — Reader & Comparison Screens

---

### Step 5.1 · Reader Screen — Typography & Breadcrumb

**File**: [ReadingScreen.tsx](file:///d:/Final/context-mobile/src/features/documents/screens/ReadingScreen.tsx)

**Changes:**
1. The navbar (lines 342-403) should show a breadcrumb-style path: `Library > {doc.title}` matching the frontend's `ReaderHeader` — the "Library" part should be styled as a `SectionLabel` and tappable to go back
2. The "AI Summary" label (line 549) → use `<SectionLabel>`
3. Tag chips (line 531-543) → ensure they match frontend styling: `bg-primary/10 border-primary/20 rounded-full`
4. Metadata labels ("Uploaded", "AI Status") → mono font

---

### Step 5.2 · Reader Screen — SSE Live Status Updates

**Why**: The frontend uses EventSource (SSE) to get real-time AI analysis status updates ([ReaderFeature.tsx](file:///d:/Final/context-mvp-front/src/features/reader/ReaderFeature.tsx) lines 61-97). When a document is "Pending" or "Processing", it listens for status changes and auto-updates the UI. Mobile has NO SSE in the reading screen — it only fetches once.

**Changes to [ReadingScreen.tsx](file:///d:/Final/context-mobile/src/features/documents/screens/ReadingScreen.tsx):**
1. When `doc.aiStatus === 'Pending' || doc.aiStatus === 'Processing'`, start an SSE connection using `react-native-sse`:
   ```ts
   const es = new EventSource(`${API_BASE_URL}/documents/status/stream`, {
     headers: { Authorization: `Bearer ${token}` }
   });
   ```
2. On `message` event, check if `parsed.documentId === documentId` and update `doc` state with `parsed.document`
3. Show a toast on "Analyzed" or "Failed"
4. Close the connection on unmount or when status is terminal

---

### Step 5.3 · Comparison Screen — Persistent History List

**Why**: Frontend has a permanent `ComparisonHistorySidebar` always visible on the left ([ComparisonHistorySidebar.tsx](file:///d:/Final/context-mvp-front/src/features/comparison/components/ComparisonHistorySidebar.tsx)). Mobile hides history behind a modal.

**Changes to [CompareScreen.tsx](file:///d:/Final/context-mobile/src/features/comparison/screens/CompareScreen.tsx):**
1. The current history modal approach is already good for mobile. **Keep it**, but improve:
   - Auto-fetch history on mount (not only when modal opens)
   - Add swipe-to-delete already exists ✅ — verify it works
   - Show history count badge next to the "History" button in header

---

### Step 5.4 · Comparison Screen — Match Frontend's File Selector UI

**Why**: Frontend uses elegant `FileSelectorCard` components with a "VS" badge in between. Mobile uses a checkbox list.

**Changes to [CompareScreen.tsx](file:///d:/Final/context-mobile/src/features/comparison/screens/CompareScreen.tsx):**
1. When no result is active, show **two side-by-side cards** (Base File / Compare File) with a "VS" circle in between, matching the frontend layout
2. Each card is tappable → opens the document selector modal
3. Replace the current checkbox list with a modal-based document picker (similar to the frontend's `DocumentSelectorModal`)

---

### Step 5.5 · Comparison Screen — Export Report Button

**Why**: Frontend has an "Export Report" button in the comparison header. Mobile has no export.

**Changes to [CompareScreen.tsx](file:///d:/Final/context-mobile/src/features/comparison/screens/CompareScreen.tsx):**
1. Add an "Export" button next to the "History" button in the header
2. Generate a text/markdown report from the comparison data
3. Use `expo-sharing` to share the report

---

### Step 5.6 · Typography for Both Screens

- "AI Compare", "Compare Docs" → `fontFamily: 'Rajdhani-Bold'`
- All section headers → `<SectionLabel>`
- "Similarity: X%" badge → `fontFamily: 'JetBrainsMono-Bold'`

---

## Phase 6 — Profile, Settings, & Missing Features

---

### Step 6.1 · Profile Screen — Match Frontend Layout

**File**: [ProfileScreen.tsx](file:///d:/Final/context-mobile/src/features/users/screens/ProfileScreen.tsx)

The mobile profile is already well-structured. Changes:
1. "Node Operator" heading → `fontFamily: 'Rajdhani-Bold'`
2. All card section labels → `<SectionLabel>`
3. Avatar upload area → Add "UPLOAD AVATAR" `SectionLabel` below the circle (already has it ✅)
4. Persona dropdown → Use the **radio card** style from the frontend (2×2 grid with icon circles) instead of a plain dropdown
5. Add gradient accent to the Identity Core card

---

### Step 6.2 · Settings Screen — Add Billing Section

**Why**: Frontend has a full `BillingSection` ([BillingSection.tsx](file:///d:/Final/context-mvp-front/src/features/settings/components/BillingSection.tsx), 23KB) with plan comparison, upgrade/downgrade, Stripe checkout. Mobile has nothing.

**Changes to [SettingsScreen.tsx](file:///d:/Final/context-mobile/src/features/users/screens/SettingsScreen.tsx):**
1. Add a new `Card` section titled "Subscription & Billing" between AI Preferences and Data & Storage
2. Show current plan name and status
3. Add an "Upgrade Plan" button that opens a WebView to the frontend's billing page: `${FRONTEND_URL}/settings?checkoutPlan=pro`
4. Alternatively, implement in-app plan cards with links to Stripe checkout URLs

---

### Step 6.3 · Settings Screen — Add Danger Zone

**Why**: Frontend has `DangerZoneSection` ([DangerZoneSection.tsx](file:///d:/Final/context-mvp-front/src/features/settings/components/DangerZoneSection.tsx)) with an "Delete Account" button. Mobile has nothing.

**Changes to [SettingsScreen.tsx](file:///d:/Final/context-mobile/src/features/users/screens/SettingsScreen.tsx):**
1. Add a "Danger Zone" `Card` with `headerVariant="destructive"` at the bottom of settings
2. Include a "Delete Account" `Button` with `variant="destructive"`
3. On press → show `Alert.alert` with 2-step confirmation: "Are you sure?" → "Type DELETE to confirm"
4. Call `authService.deleteAccount()` → logout → navigate to login

---

### Step 6.4 · Settings Screen — Add "Upgrade Plan" CTA Card

**Why**: Frontend has a prominent upgrade CTA card between Intelligence and Tour sections with rocket icon, description, and button.

**Changes to [SettingsScreen.tsx](file:///d:/Final/context-mobile/src/features/users/screens/SettingsScreen.tsx):**
1. After the AI Intelligence card, add a standalone upgrade CTA card:
   ```
   🚀 "Unlock more power"
   "Need more documents, API access, or a custom token budget?"
   [Upgrade Plan →]
   ```

---

### Step 6.5 · Settings Screen — Typography

1. "Settings" heading → `fontFamily: 'Rajdhani-Bold'`  
2. Card section titles → Already OK from Card component
3. Version text → `fontFamily: 'JetBrainsMono-Bold'`, match frontend's: `CONTEXT SYSTEM VERSION 1.0.0-BETA`

---

## Phase 7 — Polish, Animations & Global Features

---

### Step 7.1 · Build Notification System

**Why**: Frontend has a `NotificationBell` component in `TopNav` with a dropdown showing real-time notifications. Also has a full `notificationSlice` in Redux. Mobile has zero notification support.

**Files to create:**
- [NEW] `src/store/notificationSlice.ts` — Redux slice matching the frontend structure: `fetchNotifications`, `markAsRead`, `markAllAsRead`
- [NEW] `src/components/NotificationBell.tsx` — Bell icon with unread count badge, tappable to open notification list

**Files to modify:**
- [MODIFY] [HomeScreen.tsx](file:///d:/Final/context-mobile/src/features/home/screens/HomeScreen.tsx) — Add `NotificationBell` to the header area
- [MODIFY] [store.ts](file:///d:/Final/context-mobile/src/store/store.ts) — Register `notificationSlice`

---

### Step 7.2 · Build Error Screens

**Why**: Frontend has styled error pages: `SemanticVoid` (404) and `ServerErrorPage` (500). Mobile has no error screens.

**Files to create:**
- [NEW] `src/features/error/screens/NotFoundScreen.tsx` — Matching frontend's "Semantic Void" page: large icon, "404" in `Rajdhani-Bold`, "The semantic space you're looking for doesn't exist" subtitle, "Return to Dashboard" button
- [NEW] `src/features/error/screens/ErrorScreen.tsx` — Generic error fallback: error icon, message, retry button

---

### Step 7.3 · Add Neural Background Pattern

**Why**: Frontend auth screens and onboarding have a subtle SVG neural network background pattern (`neural-bg` class in CSS). This gives the "sci-fi" feel.

**Options:**
1. Create a `NeuralBackground` component using `react-native-svg` with a repeating pattern of circles + lines at low opacity
2. Or use a static PNG image exported from the frontend and render as `ImageBackground`

**Files to modify:**
- Auth screens (Login, Register) — Wrap content in `<NeuralBackground>`
- Onboarding dashboard — Add neural pattern behind the upload CTA

---

### Step 7.4 · Add Glassmorphism Effect to Auth Cards

**Why**: Frontend auth cards use `backdrop-blur-xl` giving a frosted glass effect.

**Changes:**
- Install/verify `expo-blur` is available
- In Login, Register, ForgotPassword, ResetPassword screens: wrap the card's background `View` in a `<BlurView intensity={80} tint="default">` or keep the current `rgba` approach but ensure it matches the frontend opacity values exactly

---

### Step 7.5 · Add Skeleton Loaders Matching Frontend Style

**File**: [SkeletonLoader.tsx](file:///d:/Final/context-mobile/src/components/SkeletonLoader.tsx)

**Changes:**
1. Verify the existing skeleton loader uses a shimmer animation (gradient sweep)
2. Ensure colors match: light mode `#e5e7eb` → `#f3f4f6` sweep, dark mode `rgba(255,255,255,0.06)` → `rgba(255,255,255,0.1)` sweep
3. Add a `ComparisonResultSkeleton` variant matching the frontend's ([ComparisonResultSkeleton.tsx](file:///d:/Final/context-mvp-front/src/components/ui/skeletons/ComparisonResultSkeleton.tsx))

---

### Step 7.6 · Add Redux Slices for Feature Parity

**Missing Redux slices:**

1. [NEW] `src/store/settingsSlice.ts` — Move settings fetch/update logic from the SettingsScreen's local `useState` into Redux. Match the frontend's pattern: `fetchSettings`, `updateSettings` thunks.

2. [NEW] `src/store/selectionSlice.ts` — Centralize document selection state (currently spread across local `useState` in Library and Compare screens). This ensures consistent selection behavior and enables cross-screen selection (e.g., select in Library → auto-populate Compare).

3. [NEW] `src/store/libraryUISlice.ts` — Store library view preferences: sort order, filter tags, view mode (list/grid), current folder path. Currently all local state.

**Files to modify:**
- [MODIFY] [store.ts](file:///d:/Final/context-mobile/src/store/store.ts) — Register all new slices

---

### Step 7.7 · Enhance `documentSlice.ts` to Match Frontend

**Why**: Frontend's [documentSlice.ts](file:///d:/Final/context-mvp-front/src/store/documentSlice.ts) is 22KB with many features. Mobile's is only 7KB.

**Missing thunks to add to [documentSlice.ts](file:///d:/Final/context-mobile/src/store/documentSlice.ts):**
1. `setActiveDocument` / `clearActiveDocument` — Track currently open document globally
2. `reloadDocumentThunk` — Re-fetch a single document after reanalysis
3. `fetchFolderTree` — Full hierarchical folder structure for future tree view
4. Upload progress tracking state (`uploadProgress`, `isUploading`)

---

### Step 7.8 · Enhance `comparisonSlice.ts` to Match Frontend

**Why**: Frontend's is 12KB vs mobile's 6KB.

**Missing features to add to [comparisonSlice.ts](file:///d:/Final/context-mobile/src/store/comparisonSlice.ts):**
1. `hydrateSession` — Restore a comparison from history without re-running
2. `sendComparisonMessage` — Move chat from local state to Redux (for persistence across navigations)
3. `fetchComparisonChatHistory` — Restore chat history when returning to a comparison

---

## Summary — Files Affected

### New Files (12)
| # | File | Purpose |
|---|---|---|
| 1 | `src/components/SectionLabel.tsx` | Mono uppercase label component |
| 2 | `src/components/GradientLine.tsx` | Linear gradient accent line |
| 3 | `src/components/BootSequence.tsx` | Post-login animated boot screen |
| 4 | `src/components/NeuralBackground.tsx` | SVG neural pattern background |
| 5 | `src/components/NotificationBell.tsx` | Notification icon with badge |
| 6 | `src/store/notificationSlice.ts` | Notifications Redux state |
| 7 | `src/store/settingsSlice.ts` | Settings Redux state |
| 8 | `src/store/selectionSlice.ts` | Document selection state |
| 9 | `src/store/libraryUISlice.ts` | Library UI preferences |
| 10 | `src/features/error/screens/NotFoundScreen.tsx` | 404 error screen |
| 11 | `src/features/error/screens/ErrorScreen.tsx` | Generic error screen |
| 12 | `assets/fonts/*.ttf` | Custom font files (6 files) |

### Modified Files (19)
| # | File | Main Changes |
|---|---|---|
| 1 | `App.tsx` | Load custom fonts |
| 2 | `src/theme/typography.ts` | Custom font family mappings |
| 3 | `src/components/Card.tsx` | Gradient accent, shadow |
| 4 | `src/components/Button.tsx` | Shadow, scale animation |
| 5 | `src/components/Input.tsx` | Focus ring, SectionLabel |
| 6 | `src/components/SkeletonLoader.tsx` | Shimmer style update |
| 7 | `src/navigation/RootNavigator.tsx` | Boot sequence integration |
| 8 | `src/store/store.ts` | Register new slices |
| 9 | `src/store/documentSlice.ts` | Add missing thunks |
| 10 | `src/store/comparisonSlice.ts` | Add missing features |
| 11 | `src/features/auth/screens/LoginScreen.tsx` | Gradient line, fonts |
| 12 | `src/features/auth/screens/RegisterScreen.tsx` | Password criteria, fonts |
| 13 | `src/features/auth/screens/ForgotPasswordScreen.tsx` | Style alignment |
| 14 | `src/features/auth/screens/ResetPasswordScreen.tsx` | Style alignment |
| 15 | `src/features/home/screens/HomeScreen.tsx` | Onboarding, fonts, notifications |
| 16 | `src/features/documents/screens/LibraryScreen.tsx` | Folder CRUD, pagination, tags |
| 17 | `src/features/documents/screens/ReadingScreen.tsx` | SSE, breadcrumb, fonts |
| 18 | `src/features/comparison/screens/CompareScreen.tsx` | File selector UI, export |
| 19 | `src/features/documents/screens/CaptureScreen.tsx` | Label styling |
| 20 | `src/features/users/screens/ProfileScreen.tsx` | Radio cards, fonts |
| 21 | `src/features/users/screens/SettingsScreen.tsx` | Billing, danger zone, upgrade CTA |

---

## Verification Plan

### Automated Tests
- Run `npx expo start` and verify no crashes on each screen
- Test dark mode + light mode on every modified screen
- Test auth flow: Register → Boot Sequence → Dashboard
- Test Library: folder create/rename/delete, pagination, tag filtering
- Test Comparison: history load, file selector, export, AI chat
- Test Settings: billing link, danger zone, appearance toggles

### Manual Verification
- Side-by-side screenshots: open frontend in browser + mobile in simulator, compare every screen
- Verify all fonts render correctly (Rajdhani headings, Inter body, JetBrains Mono labels)
- Verify gradient lines appear on auth cards
- Verify boot sequence animation plays after first login
- Verify skeleton loaders have shimmer effect
- Verify button press animations (scale down/up)
- Verify input focus ring glow

---

> [!NOTE]
> **Marketing pages** (Home, Products, Pricing, Blog, Documentation) and **Admin Panel** are web-only features and are intentionally excluded from this plan. They don't apply to a mobile app.

> [!WARNING]
> The boot sequence animation (Step 2.4) and neural background (Step 7.3) are the most complex tasks. They require SVG + Reanimated expertise and should be allocated extra time.
