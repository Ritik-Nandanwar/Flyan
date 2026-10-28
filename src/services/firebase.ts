import AsyncStorage from "@react-native-async-storage/async-storage";
import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  initializeAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from "firebase/auth";
import * as FirebaseAuth from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { Attempt, Save } from "../types/app";
import { GameType } from "../games/engines";
import { attemptKey } from "../games/attempts";

// The React Native Auth package entry exports this symbol at runtime. The
// umbrella Firebase TypeScript entry omits it from its platform-neutral types.
const getReactNativePersistence = (
  FirebaseAuth as unknown as {
    getReactNativePersistence: (
      storage: typeof AsyncStorage,
    ) => FirebaseAuth.Persistence;
  }
).getReactNativePersistence;

/** Firebase client configuration comes from Expo's public build-time env vars. */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

/** Initializes one Firebase app for Expo Go and native development builds. */
const app: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

/** Persists Firebase sessions in AsyncStorage on iOS and Android. */
export const auth = (() => {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
})();

export const db = getFirestore(app);

/** Creates an email/password account and assigns the entered display name. */
export async function createAccount(
  email: string,
  password: string,
  displayName: string,
): Promise<User> {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email.trim().toLowerCase(),
    password,
  );
  await updateProfile(credential.user, { displayName: displayName.trim() });
  await setDoc(
    doc(db, "users", credential.user.uid),
    {
      uid: credential.user.uid,
      email: credential.user.email,
      displayName: displayName.trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  return credential.user;
}

/** Signs in an existing account by email and password. */
export async function login(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(
    auth,
    email.trim().toLowerCase(),
    password,
  );
  return credential.user;
}

/** Sends a Firebase password reset email. */
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim().toLowerCase());
}

/** Ends the signed-in Firebase session. */
export async function logout(): Promise<void> {
  await signOut(auth);
}

/** Reads all attempts belonging to the authenticated user's Firestore path. */
export async function loadUserAttempts(uid: string): Promise<Save> {
  const snapshot = await getDocs(collection(db, "users", uid, "attempts"));
  const attempts: Save = {};
  for (const attemptDoc of snapshot.docs) {
    const data = attemptDoc.data();
    try {
      // Read the serialized form and tolerate previously stored flat documents.
      attempts[attemptDoc.id] = data.attemptJson
        ? (JSON.parse(data.attemptJson) as Attempt)
        : (data as Attempt);
    } catch (error) {
      console.warn(`Skipping unreadable game attempt ${attemptDoc.id}`, error);
    }
  }
  return attempts;
}

/** Converts an attempt to Firestore-safe fields without nested array values. */
function attemptDocument(
  attempt: Attempt,
  game: GameType,
): Record<string, unknown> {
  const normalized = JSON.parse(JSON.stringify(attempt)) as Attempt;
  return {
    attemptJson: JSON.stringify(normalized),
    game,
    date: normalized.date,
    mode: normalized.mode,
    status: normalized.status,
    moves: normalized.moves,
    startedAt: normalized.startedAt,
    ...(normalized.finishedAt === undefined
      ? {}
      : { finishedAt: normalized.finishedAt }),
    updatedAt: serverTimestamp(),
  };
}

/** Writes one attempt document, including its gameplay timing fields. */
export async function saveUserAttempt(
  uid: string,
  game: GameType,
  attempt: Attempt,
): Promise<void> {
  const id = attemptKey(game, attempt.date, attempt.mode);
  await setDoc(
    doc(db, "users", uid, "attempts", id),
    attemptDocument(attempt, game),
    { merge: true },
  );
}

/** Uploads local and guest attempts after account login to enable cross-device history. */
export async function syncUserAttempts(
  uid: string,
  attempts: Save,
): Promise<void> {
  const batch = writeBatch(db);
  for (const [id, attempt] of Object.entries(attempts)) {
    const game = id.slice(id.lastIndexOf(":") + 1) as GameType;
    batch.set(
      doc(db, "users", uid, "attempts", id),
      attemptDocument(attempt, game),
      { merge: true },
    );
  }
  batch.set(
    doc(db, "users", uid),
    {
      uid,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  await batch.commit();
}
