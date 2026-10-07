import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  collection, 
  onSnapshot,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { 
  RegisteredCustomer, 
  VisitRecord, 
  ActivityLog, 
  MerchantConfig, 
  Survey, 
  SurveyAnswer, 
  Clerk,
  AppNotification,
  SupportReport
} from '../types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();

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
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// CRITICAL CONSTRAINT: connection test
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

// Helper to recursively strip undefined values before saving to Firestore
export function cleanFirestoreDoc<T>(data: T): Record<string, any> {
  if (!data || typeof data !== 'object') return {};
  
  const deepClean = (val: any): any => {
    if (val === undefined) return undefined;
    if (val === null) return null;
    if (Array.isArray(val)) {
      return val
        .map(deepClean)
        .filter(item => item !== undefined);
    }
    if (typeof val === 'object') {
      const res: Record<string, any> = {};
      for (const [k, v] of Object.entries(val)) {
        if (v !== undefined) {
          const cleaned = deepClean(v);
          if (cleaned !== undefined) {
            res[k] = cleaned;
          }
        }
      }
      return res;
    }
    return val;
  };

  return (deepClean(data) as Record<string, any>) || {};
}

// CUSTOMERS OPERATIONS
export async function dbSaveCustomer(customer: RegisteredCustomer) {
  const path = `customers/${customer.folio}`;
  try {
    const cleanDoc = cleanFirestoreDoc(customer);
    await setDoc(doc(db, 'customers', customer.folio), cleanDoc);
    // Unmark as deleted if it was previously marked as deleted
    try {
      await deleteDoc(doc(db, 'deleted_customers', customer.folio));
    } catch (_) {}
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function dbDeleteCustomer(folio: string) {
  const path = `customers/${folio}`;
  try {
    await deleteDoc(doc(db, 'customers', folio));
    // Persist permanent deletion marker so other devices or local storage cannot resurrect this folio
    try {
      await setDoc(doc(db, 'deleted_customers', folio), {
        folio,
        deletedAt: new Date().toISOString()
      });
    } catch (_) {}
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function dbGetDeletedCustomerFolios(): Promise<string[]> {
  try {
    const snap = await getDocs(collection(db, 'deleted_customers'));
    return snap.docs.map(d => d.id || (d.data() as any).folio).filter(Boolean);
  } catch (e) {
    console.error('Error fetching deleted customers list:', e);
    return [];
  }
}

// VISITS OPERATIONS
export async function dbSaveVisit(visit: VisitRecord) {
  const path = `visits/${visit.id}`;
  try {
    const cleanDoc = cleanFirestoreDoc(visit);
    await setDoc(doc(db, 'visits', visit.id), cleanDoc);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function dbSaveVisitLegacy(visit: VisitRecord) {
  await dbSaveVisit(visit);
}

// LOGS OPERATIONS
export async function dbSaveLog(log: ActivityLog) {
  const path = `logs/${log.id}`;
  try {
    const cleanDoc = cleanFirestoreDoc(log);
    await setDoc(doc(db, 'logs', log.id), cleanDoc);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// BISTRO APP CONFIG
export async function dbSaveConfig(cfg: MerchantConfig) {
  const path = 'config/merchant';
  try {
    const cleanDoc = cleanFirestoreDoc(cfg);
    await setDoc(doc(db, 'config', 'merchant'), cleanDoc);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// SURVEYS OPERATIONS
export async function dbSaveSurvey(survey: Survey) {
  const path = `surveys/${survey.id}`;
  try {
    const cleanDoc = cleanFirestoreDoc(survey);
    await setDoc(doc(db, 'surveys', survey.id), cleanDoc);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// SURVEY ANSWERS OPERATIONS
export async function dbSaveAnswer(answer: SurveyAnswer) {
  const path = `surveyAnswers/${answer.id}`;
  try {
    const cleanDoc = cleanFirestoreDoc(answer);
    await setDoc(doc(db, 'surveyAnswers', answer.id), cleanDoc);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// CLERKS OPERATIONS
export async function dbSaveClerk(clerk: Clerk) {
  const path = `clerks/${clerk.code}`;
  try {
    const cleanDoc = cleanFirestoreDoc(clerk);
    await setDoc(doc(db, 'clerks', clerk.code), cleanDoc);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function dbDeleteClerk(code: string) {
  const path = `clerks/${code}`;
  try {
    await deleteDoc(doc(db, 'clerks', code));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// NOTIFICATIONS OPERATIONS
export async function dbSaveNotification(notification: AppNotification) {
  const path = `notifications/${notification.id}`;
  try {
    const cleanDoc = cleanFirestoreDoc(notification);
    await setDoc(doc(db, 'notifications', notification.id), cleanDoc);
    
    // Broadcast active notification payload wirelessly to subscribers even with fully closed browser/apps
    try {
      fetch('/api/send-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: notification.title,
          body: notification.body,
          targetCustomerFolio: notification.targetCustomerFolio,
          icon: notification.icon
        })
      }).catch(err => {
        console.warn('[PUSH] API fetch dispatch failed:', err);
      });
    } catch (e) {
      console.warn('[PUSH] Failed dispatching Web Push notification triggers:', e);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function dbDeleteNotification(id: string) {
  const path = `notifications/${id}`;
  try {
    await deleteDoc(doc(db, 'notifications', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// REALTIME LISTENERS INITIALIZER
export function subscribeToCollection<Type>(
  collectionName: string,
  onUpdate: (data: Type[]) => void
) {
  return onSnapshot(
    collection(db, collectionName),
    (snapshot) => {
      const items: Type[] = [];
      snapshot.forEach((doc) => {
        items.push({ ...doc.data() } as Type);
      });
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, collectionName);
    }
  );
}

// SINGLE DOC REALTIME SUBSCRIBER
export function subscribeToDoc<Type>(
  collectionName: string,
  docId: string,
  onUpdate: (data: Type | null) => void
) {
  return onSnapshot(
    doc(db, collectionName, docId),
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as Type);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `${collectionName}/${docId}`);
    }
  );
}

// SUPPORT REPORTS OPERATIONS
export async function dbSaveSupportReport(report: SupportReport) {
  const path = `support_reports/${report.id}`;
  try {
    const cleanDoc = JSON.parse(JSON.stringify(report));
    await setDoc(doc(db, 'support_reports', report.id), cleanDoc);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function dbDeleteSupportReport(id: string) {
  const path = `support_reports/${id}`;
  try {
    await deleteDoc(doc(db, 'support_reports', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
