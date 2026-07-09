import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Application, Evaluation, UserProfile } from "@/types";

// ============================================
// Firestore Service Layer
// Collection: users/{uid}/applications/{id}
// ============================================

function getDb() {
  if (!db) throw new Error("Firestore not initialized");
  return db;
}

// Strip undefined values — Firestore rejects them
function cleanData<T extends Record<string, unknown>>(data: T): T {
  const cleaned = { ...data };
  for (const key of Object.keys(cleaned)) {
    if (cleaned[key] === undefined) {
      delete cleaned[key];
    }
  }
  return cleaned;
}

function applicationsRef(uid: string) {
  return collection(getDb(), "users", uid, "applications");
}

function applicationDocRef(uid: string, id: string) {
  return doc(getDb(), "users", uid, "applications", id);
}

// --- CREATE ---
export async function addApplication(
  uid: string,
  data: Omit<Application, "id">
): Promise<string> {
  const docRef = await addDoc(applicationsRef(uid), cleanData({
    ...data,
    dateApplied: data.dateApplied,
    dateUpdated: new Date().toISOString(),
    createdAt: Timestamp.now(),
  } as Record<string, unknown>));
  return docRef.id;
}

// --- READ ---
export async function getApplications(uid: string): Promise<Application[]> {
  const snapshot = await getDocs(applicationsRef(uid));
  const apps = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as Application[];
  // Sort client-side by dateUpdated (most recent first)
  return apps.sort((a, b) =>
    (b.dateUpdated || "").localeCompare(a.dateUpdated || "")
  );
}

// --- UPDATE ---
export async function updateApplication(
  uid: string,
  id: string,
  data: Partial<Application>
): Promise<void> {
  const docRef = applicationDocRef(uid, id);
  await updateDoc(docRef, cleanData({
    ...data,
    dateUpdated: new Date().toISOString(),
  } as Record<string, unknown>));
}

// --- UPDATE EVALUATION ---
export async function updateEvaluation(
  uid: string,
  applicationId: string,
  evaluation: Evaluation
): Promise<void> {
  const docRef = applicationDocRef(uid, applicationId);
  await updateDoc(docRef, {
    evaluation,
    dateUpdated: new Date().toISOString(),
  });
}

// ============================================
// User Profile Methods
// Collection: users/{uid}
// ============================================

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(getDb(), "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return { id: snap.id, ...data } as UserProfile;
}

export async function updateUserProfile(uid: string, profile: Partial<UserProfile>): Promise<void> {
  const ref = doc(getDb(), "users", uid);
  await setDoc(ref, cleanData(profile), { merge: true });
}

// --- DELETE ---
export async function deleteApplication(
  uid: string,
  id: string
): Promise<void> {
  const docRef = applicationDocRef(uid, id);
  await deleteDoc(docRef);
}
