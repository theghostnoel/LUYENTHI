import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  writeBatch,
  DocumentReference,
  CollectionReference
} from 'firebase/firestore';
import { Question, CandidateSubmission, SystemSettings } from './types';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId if specified
// Synced with firestore.rules security boundaries
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Collection helper references
export const questionsCol = collection(db, 'questions') as CollectionReference<Question>;
export const submissionsCol = collection(db, 'submissions') as CollectionReference<CandidateSubmission>;
export const settingsDoc = doc(db, 'settings', 'global') as DocumentReference<{
  isScoresPublic: boolean;
  systemSettings: SystemSettings;
}>;

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
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Persist or update a single question in Firestore
 */
export async function syncSaveQuestion(question: Question) {
  try {
    const qDocRef = doc(db, 'questions', question.id);
    await setDoc(qDocRef, question);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `questions/${question.id}`);
  }
}

/**
 * Remove a single question from Firestore
 */
export async function syncDeleteQuestion(id: string) {
  try {
    const qDocRef = doc(db, 'questions', id);
    await deleteDoc(qDocRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `questions/${id}`);
  }
}

/**
 * Save candidate submission to Firestore
 */
export async function syncAddSubmission(submission: CandidateSubmission) {
  try {
    const subDocRef = doc(db, 'submissions', submission.id);
    await setDoc(subDocRef, submission);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `submissions/${submission.id}`);
  }
}

/**
 * Clear all submissions from Firestore
 */
export async function syncClearSubmissions() {
  try {
    const snapshot = await getDocs(submissionsCol);
    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => {
      batch.delete(d.ref);
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, 'submissions');
  }
}

/**
 * Clear all questions from Firestore
 */
export async function syncClearQuestions() {
  try {
    const snapshot = await getDocs(questionsCol);
    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => {
      batch.delete(d.ref);
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, 'questions');
  }
}

/**
 * Initialize default questions in Firestore if empty
 */
export async function syncSeedQuestions(questions: Question[]) {
  try {
    const batch = writeBatch(db);
    questions.forEach((q) => {
      const qDocRef = doc(db, 'questions', q.id);
      batch.set(qDocRef, q);
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'questions/seed');
  }
}

/**
 * Initialize default submissions in Firestore if empty
 */
export async function syncSeedSubmissions(submissions: CandidateSubmission[]) {
  try {
    const batch = writeBatch(db);
    submissions.forEach((sub) => {
      const sDocRef = doc(db, 'submissions', sub.id);
      batch.set(sDocRef, sub);
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'submissions/seed');
  }
}

/**
 * Update global system settings and public score release flag in Firestore
 */
export async function syncUpdateSettings(isScoresPublic: boolean, systemSettings: SystemSettings) {
  try {
    await setDoc(settingsDoc, {
      isScoresPublic,
      systemSettings
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings/global');
  }
}
