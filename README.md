<div align="center">

<!-- ═══════════════════════════════ LOGO ═══════════════════════════════ -->

<img src="./docs/logo.svg" width="96" height="96" alt="Context Logo" />

<h1>Context — Mobile App</h1>

<p><em>The interface that turns your documents into a second brain, in your pocket.</em></p>

<img src="https://readme-typing-svg.demolab.com?font=Inter&weight=600&size=22&pause=1000&color=4F46E5&center=true&vCenter=true&width=720&lines=AI-Powered+Knowledge+Interface;RAG+Chat+%C2%B7+Document+Compare+%C2%B7+Smart+Library;Built+with+React+Native+%2B+Expo+%2B+Redux+Toolkit" alt="Typing SVG" />

<br/>

<!-- ══════════════════════════════ BADGES ══════════════════════════════ -->

<p>
  <img src="https://img.shields.io/badge/React_Native-0.81.x-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/Expo-54.x-000020?style=for-the-badge&logo=expo&logoColor=white"/>
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/Redux_Toolkit-2.x-764ABC?style=for-the-badge&logo=redux&logoColor=white"/>
</p>

<p>
  <img src="https://img.shields.io/badge/NativeWind-2.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white"/>
  <img src="https://img.shields.io/badge/React_Navigation-7.x-CA4245?style=for-the-badge&logo=react-router&logoColor=white"/>
  <img src="https://img.shields.io/badge/Axios-1.x-5A29E4?style=for-the-badge&logo=axios&logoColor=white"/>
</p>

<br/>

[![Context API](https://img.shields.io/badge/🔗_Paired_With-Context_API-4F46E5?style=flat-square)](../context-api/README.md)
[![Context Web Frontend](https://img.shields.io/badge/🔗_Paired_With-Context_Web-61DAFB?style=flat-square)](../context-mvp-front/README.md)

</div>

---

## 📋 Table of Contents

- [What is Context Mobile?](#-what-is-context-mobile)
- [The Design Philosophy](#-the-design-philosophy)
- [Screen Map](#-screen-map)
- [Architecture](#-architecture)
- [State Management](#-state-management)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Brand & Colors](#-brand--colors)
- [Team & Workflow](#-team--workflow)

---

## 🌐 What is Context Mobile?

**Context** is an AI-native personal knowledge base. This repository is the **React Native / Expo mobile app** — bringing your second brain to your pocket. It connects to the [Context API](../context-api/README.md) to provide:

- A **Smart Library** for managing and exploring all your documents on the go
- A **Document Reader** with an AI-powered contextual summary and RAG chat
- A **Dashboard** with personalized AI focus suggestions
- Seamless uploading from your device's files, photos, or clipboard

> Built for the **ITI ITP R2 2026** Final Project by **🧠 Contexters** 🚀

---

## 💡 The Design Philosophy

We believe interacting with your knowledge should feel like using a premium native application.

**Two core principles drive every decision:**

**1. Frictionless Capture**  
Capture knowledge wherever you are. Whether you're uploading a photo from your gallery, a PDF from your files, or pasting text from your clipboard, Context Mobile makes it instant.

**2. The Virtual Pool Model**  
Files are not trapped in single folders. A document tagged `#Legal` and `#Q1_2026` exists in both virtual spaces simultaneously without data duplication. The mobile experience allows intuitive tag-based navigation.

---

## 🗺️ Screen Map

| Route | Auth | Description |
| ------ | ---- | ----------- |
| `WelcomeScreen` | Public | Landing / marketing screen |
| `LoginScreen` | Public | Email + password authentication |
| `RegisterScreen` | Public | Account creation |
| `Dashboard` | ✅ User | AI-curated focus feed + stats overview |
| `Library` | ✅ User | Full document management — upload, browse, filter, tag |
| `Reader` | ✅ User | Document viewer + AI contextual details + RAG chat |
| `Profile` | ✅ User | User settings, avatar, persona selection |
| `Settings` | ✅ User | App preferences |

---

## 🏛️ Architecture

Context Mobile is built with **Expo** and uses **React Navigation** (Bottom Tabs + Stack Navigators) for routing.

```
User Action
     │
     ▼
┌─────────────────────────────────────┐
│          React Navigation           │
│   AuthStack / AppStack (wrappers)   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│         Screen Component            │
│  (e.g. LibraryScreen, Dashboard)    │
└──────┬──────────────────────────────┘
       │
  ┌────┴──────┐
  ▼           ▼
 UI       Redux Store
Components  (auth / documents)
  │           │
  └─────┬─────┘
        ▼
   Axios API Layer
   (→ Context API)
```

**Navigation Flow:**
- `AuthStack` — Login & Registration screens (shown when unauthenticated)
- `AppStack` — Main application with Bottom Tabs (shown when authenticated)

---

## 🔄 State Management

State is managed with **Redux Toolkit**, similar to our web frontend:

### `authSlice`
Handles the full authentication lifecycle:
- Login / register async thunks
- Persists token using `expo-secure-store` or `@react-native-async-storage/async-storage`
- Auto-attaches to Axios via interceptor

### `documentSlice`
The core data layer for the entire library:
- Server-side pagination, sorting, tag filtering
- File uploading via Expo FileSystem & DocumentPicker
- Optimistic updates

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
| ---------- | ------- | ------- |
| React Native | 0.81.x | Mobile UI framework |
| Expo | 54.x | Mobile toolkit and runtime |
| TypeScript | 5.x | Type safety |
| Redux Toolkit | 2.x | Global state management |
| React Navigation | 7.x | Routing and navigation |
| NativeWind | 2.x | Tailwind CSS for React Native |
| Axios | 1.x | HTTP client with JWT interceptor |
| Expo Document Picker | 14.x | File selection |
| Expo Image Picker | 55.x | Image selection from gallery |

---

## ⚡ Quick Start

### Prerequisites
- Node.js ≥ 18.x
- Expo Go app on your physical device, OR an iOS Simulator / Android Emulator
- The [Context API](../context-api/README.md) running locally on port `5000`

### 1. Install Dependencies

```bash
cd context-mobile
npm install
```

### 2. Configure Environment

Create a `.env` file in the root:

```env
EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:5000/api
```
*(Note: Use your machine's local IP address, e.g., `192.168.1.x`, instead of `localhost` so your physical device or emulator can reach the API).*

### 3. Start the Dev Server

```bash
npx expo start
```
- Press `a` to open in Android Emulator
- Press `i` to open in iOS Simulator
- Scan the QR code with the **Expo Go** app on your physical device

---

## 🎨 Brand & Colors

Context uses a premium, modern design system adapted for mobile via **NativeWind** (Tailwind CSS for React Native).

| Token | Light Mode | Hex (Light) |
| ---------------------- | ---------- | ----------- |
| `primary` | Indigo | `#4F46E5` |
| `accent` / `secondary` | Violet | `#7C3AED` |
| `text` | Slate-700 | `#334155` |
| `background` | White | `#FFFFFF` |

---

## 🌿 Team & Workflow

### Git Rules

1. **Never push directly to `main` or `dev`**
2. **Branch off `dev`** — format: `feat/mobile-reader`, `fix/nav-header`, `ui/dashboard-cards`
3. **Conventional commits:** `feat:`, `fix:`, `ui:`, `chore:`, `docs:`
4. **PR to `dev`** — 1 approval from rotation partner required before merge

---

<div align="center">

<img src="./docs/logo.svg" width="48" height="48" alt="Context Logo" />

**Built with ❤️ by 🧠 Contexters — ITI ITP R2 2026**

_"Your documents shouldn't just be stored. They should think."_

</div>
