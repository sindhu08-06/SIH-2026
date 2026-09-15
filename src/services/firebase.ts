import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  setLogLevel,
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Silence non-fatal transient network/reconnecting logs in sandboxed iframe runtime
try {
  setLogLevel('error');
} catch {
  // ignore
}

let firestoreDb: ReturnType<typeof getFirestore>;
try {
  firestoreDb = initializeFirestore(
    app,
    {
      experimentalAutoDetectLongPolling: true,
    },
    firebaseConfig.firestoreDatabaseId || undefined
  );
} catch {
  firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
}
export const db = firestoreDb;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Optional connection probe conforming to Firebase Skill guidelines
export async function testConnection() {
  try {
    await getDoc(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (
      error?.code === 'unavailable' ||
      error?.message?.includes('offline') ||
      error?.message?.includes('unavailable')
    ) {
      console.warn('Firebase operating in offline / fallback mode.');
    }
  }
}

// Google Auth Provider setup with forced account selection
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export interface AppUserProfile {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
  role: 'admin' | 'worker' | 'customer';
  phone?: string;
  primarySkill?: string;
  workerId?: string;
  lastLoginAt: string;
  createdAt?: string;
}

/**
 * Helper to get the current hostname for Firebase Authorized Domains whitelist
 */
export function getCurrentHostname(): string {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.hostname;
  }
  return '';
}

export interface FriendlyAuthError {
  isUnauthorizedDomain: boolean;
  domain: string;
  projectId: string;
  message: string;
  solutionTip?: string;
}

/**
 * Parses Firebase Auth errors into actionable, user-friendly details
 */
export function formatFirebaseAuthError(error: any): FriendlyAuthError {
  const domain = getCurrentHostname();
  const projectId = firebaseConfig.projectId || 'gen-lang-client-0694832781';
  const errorCode = error?.code || '';
  const errorMsg = error?.message || '';

  const isUnauthorizedDomain =
    errorCode === 'auth/unauthorized-domain' ||
    errorMsg.includes('unauthorized-domain') ||
    errorMsg.includes('unauthorized domain');

  if (isUnauthorizedDomain) {
    return {
      isUnauthorizedDomain: true,
      domain,
      projectId,
      message: `The domain "${domain}" is not authorized for Google Sign-In in Firebase.`,
      solutionTip: `Add "${domain}" to Firebase Console → Authentication → Settings → Authorized domains (Project: ${projectId}). Or sign in immediately using Email/Phone credentials below.`,
    };
  }

  if (errorCode === 'auth/popup-closed-by-user' || errorMsg.includes('closed-by-user')) {
    return {
      isUnauthorizedDomain: false,
      domain,
      projectId,
      message: 'Sign-in popup was closed before completing. Please try again or use the form below.',
    };
  }

  if (errorCode === 'auth/popup-blocked' || errorMsg.includes('popup-blocked')) {
    return {
      isUnauthorizedDomain: false,
      domain,
      projectId,
      message: 'Pop-up was blocked by your browser. Please allow pop-ups for this site or use the form below.',
    };
  }

  return {
    isUnauthorizedDomain: false,
    domain,
    projectId,
    message: errorMsg || 'Authentication could not be completed.',
  };
}

/**
 * Universal Google Sign-In for all roles (Customer, Worker, Admin)
 * Authenticates via Firebase GoogleAuthProvider, syncs profile to Firestore 'users' collection,
 * and returns the authenticated user + stored role profile.
 */
export async function signInWithGoogle(
  intendedRole: 'admin' | 'worker' | 'customer' = 'customer',
  additionalData?: Partial<AppUserProfile>
): Promise<{ user: FirebaseUser; profile: AppUserProfile }> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  const email = user.email || `${user.uid}@sahakar.coop`;
  const name = user.displayName || user.email?.split('@')[0] || 'Cooperative Member';
  const photoURL = user.photoURL || undefined;

  // Check existing Firestore record or create fresh profile
  const userDocRef = doc(db, 'users', user.uid);
  let existingProfile: Partial<AppUserProfile> = {};

  try {
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      existingProfile = snap.data() as AppUserProfile;
    }
  } catch (readErr) {
    console.warn('Firestore read note during Google Auth:', readErr);
  }

  // Preserve existing role if already an admin/worker, unless user is explicitly authenticating as that role
  const finalRole: 'admin' | 'worker' | 'customer' =
    existingProfile.role || intendedRole;

  const profile: AppUserProfile = {
    uid: user.uid,
    email,
    name: existingProfile.name || name,
    photoURL: existingProfile.photoURL || photoURL,
    role: finalRole,
    phone: existingProfile.phone || user.phoneNumber || additionalData?.phone || '',
    primarySkill: existingProfile.primarySkill || additionalData?.primarySkill,
    workerId: existingProfile.workerId || additionalData?.workerId,
    lastLoginAt: new Date().toISOString(),
    createdAt: existingProfile.createdAt || new Date().toISOString(),
    ...additionalData,
  };

  try {
    await setDoc(userDocRef, profile, { merge: true });
  } catch (writeErr) {
    console.warn('Firestore user write note during Google Auth:', writeErr);
  }

  return { user, profile };
}

/**
 * Universal Sign-Out
 */
export async function signOutFirebase(): Promise<void> {
  await fbSignOut(auth);
}

/**
 * Fetch AppUserProfile for a given UID from Firestore 'users' collection
 */
export async function getUserProfile(uid: string): Promise<AppUserProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as AppUserProfile;
    }
  } catch (err) {
    console.warn('Failed to retrieve user profile from Firestore:', err);
  }
  return null;
}

/**
 * Listen to Firebase Authentication state changes and automatically fetch their Firestore profile
 */
export function onFirebaseAuthStateChanged(
  callback: (user: FirebaseUser | null, profile: AppUserProfile | null) => void
) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const profile = await getUserProfile(user.uid);
      callback(user, profile);
    } else {
      callback(null, null);
    }
  });
}

export default app;
