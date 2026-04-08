# PR 02 — Firebase console checklist

Complete these in the [Firebase Console](https://console.firebase.google.com/). Check each box when done.

## 1. Create project

- [x] Click **Add project** (or use an existing project).
- [x] Note the **project ID** (you’ll use it in env as `NEXT_PUBLIC_FIREBASE_PROJECT_ID`).
- [x] **Google Analytics:** optional for MVP (you can disable to reduce noise).

## 2. Firestore

- [x] In the left nav, open **Build → Firestore Database**.
- [x] **Create database**.
- [x] **Location:** pick a region close to you (e.g. `nam5` / multi-region US or a single region you prefer). *Changing later is painful—choose once.*
- [x] Start mode:
  - **Test mode** is OK **only** while developing and before any public URL with secrets.
  - Plan to deploy **locked rules** from the repo in **PR 03** before sharing the app widely.

## 3. Authentication

- [x] Open **Build → Authentication** → **Get started**.
- [x] **Sign-in method** tab:
  - [x] Enable **Email/Password** (you can turn off “Email link” if you only want password).
  - [x] Enable **Google** → choose a support email → **Save** (OAuth consent may use your Google Cloud project; defaults are usually fine for dev).

## 4. Register web app + fill `.env.local`

This step creates a **Web** app registration in Firebase and gives you the **same values** your Next.js app will read from environment variables.

### 4a. Open “add web app” (either path works)

**Path A — from the project home**

1. Open [Firebase Console](https://console.firebase.google.com/) and select project **collab-board** (or your project name).
2. On the **project overview** page, click **Add app** (or **“+ Add app”**).
3. Choose the **Web** platform: icon looks like **`</>`** (not Android / iOS).

**Path B — from project settings**

1. Click the **gear** ⚙️ next to **Project overview** → **Project settings**.
2. Scroll to **Your apps**.
3. If you see no web app yet, click the **Web** icon **`</>`** to register one.

### 4b. Register the app (wizard)

1. **App nickname:** e.g. `collab-board-web` (any name; only for your reference in the console).
2. **Firebase Hosting:** **uncheck** “Also set up Firebase Hosting” if you see it — you deploy on **Vercel**, not Firebase Hosting for this repo.
3. Click **Register app**.

### 4c. Copy the config Firebase shows you

After you register, Firebase shows a code snippet like:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

- Copy **each string value** (inside the quotes) — not the property names from the wrong column.
- If you **closed** that screen: **⚙️ Project settings** → **Your apps** → click your **web app** → scroll to **SDK setup and configuration** → choose **Config** (not npm snip only) to see `firebaseConfig` again.

**Optional:** Firebase may also show `measurementId` (Analytics). This repo’s [.env.example](../.env.example) does **not** require it for MVP; you can ignore it unless you add Analytics later.

### 4d. Create / edit `.env.local` in your repo root

1. In your project folder `CollabWhiteBoard` (same level as `package.json`), create a file named **`.env.local`** if it does not exist.
2. Paste lines in this shape — **your values**, no quotes around values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=paste_apiKey_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=paste_authDomain_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=paste_projectId_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=paste_storageBucket_here
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=paste_messagingSenderId_here
NEXT_PUBLIC_FIREBASE_APP_ID=paste_appId_here
```

**Mapping (one row):**

| In `firebaseConfig` | → | In `.env.local` |
|---------------------|---|-----------------|
| `apiKey` | → | `NEXT_PUBLIC_FIREBASE_API_KEY` |
| `authDomain` | → | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` |
| `projectId` | → | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` |
| `storageBucket` | → | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId` | → | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | → | `NEXT_PUBLIC_FIREBASE_APP_ID` |

3. **Save** the file.
4. **Restart** `npm run dev` after changing env vars (Next.js reads them at startup).
5. **Never commit** `.env.local` — it stays local (and you’ll paste the same keys into **Vercel → Project → Settings → Environment Variables** for production when you deploy).

### Checklist

- [x] Web app registered; `firebaseConfig` copied from console.
- [x] `.env.local` created at repo root with all six `NEXT_PUBLIC_FIREBASE_*` lines filled.
- [x] `.env.local` is **not** committed to Git.

## 5. Firestore paths (repo reference)

Paths are sketched in [ARCHITECTURE.md](./ARCHITECTURE.md). No extra console step—just awareness before you write rules in PR 03.

## 6. Firebase CLI (optional)

- [ ] Install: [Firebase CLI docs](https://firebase.google.com/docs/cli#install_the_cli) (e.g. `npm install -g firebase-tools`).
- [ ] Run `firebase login`.
- [ ] Later (PR 03+): `firebase init firestore` or use the repo’s `firestore.rules` once added.

---

When PR 02 is done, you should have: **project + Firestore + Auth providers + web config in `.env.local`**. Next: **PR 03** — `src/lib/firebase.ts` + rules in repo.
