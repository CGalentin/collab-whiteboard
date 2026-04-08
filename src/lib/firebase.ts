"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getOrInitApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  const missing = (
    Object.entries(firebaseConfig) as [string, string | undefined][]
  )
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase env: ${missing.join(", ")}. Copy .env.example to .env.local and restart the dev server.`,
    );
  }
  return initializeApp(firebaseConfig);
}

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

/** Firebase app singleton (client-only). */
export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getOrInitApp();
  }
  return app;
}

/** Firebase Auth — used from login and `AuthProvider`. */
export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

/** Firestore — paths under `boards/{boardId}/...` per docs/ARCHITECTURE.md */
export function getFirebaseDb(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp());
  }
  return db;
}
