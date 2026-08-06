import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { BloodPressureLog, WeightLog, UserProfile, AITipLog } from '../types';

export interface TensikuDBSchema extends DBSchema {
  bp_logs: {
    key: string;
    value: BloodPressureLog;
    indexes: { 'by-user': string; 'by-logged_at': string };
  };
  weight_logs: {
    key: string;
    value: WeightLog;
    indexes: { 'by-user': string; 'by-logged_at': string };
  };
  profiles: {
    key: string;
    value: UserProfile;
  };
  ai_tips: {
    key: string;
    value: AITipLog;
    indexes: { 'by-created_at': string };
  };
  kv_store: {
    key: string;
    value: { key: string; value: any };
  };
}

const DB_NAME = 'tensiku_idb_v1';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<TensikuDBSchema>> | null = null;

export function getDB(): Promise<IDBPDatabase<TensikuDBSchema>> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not supported on server side'));
  }

  if (!dbPromise) {
    dbPromise = openDB<TensikuDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // bp_logs
        if (!db.objectStoreNames.contains('bp_logs')) {
          const bpStore = db.createObjectStore('bp_logs', { keyPath: 'id' });
          bpStore.createIndex('by-user', 'user_id');
          bpStore.createIndex('by-logged_at', 'logged_at');
        }

        // weight_logs
        if (!db.objectStoreNames.contains('weight_logs')) {
          const weightStore = db.createObjectStore('weight_logs', { keyPath: 'id' });
          weightStore.createIndex('by-user', 'user_id');
          weightStore.createIndex('by-logged_at', 'logged_at');
        }

        // profiles
        if (!db.objectStoreNames.contains('profiles')) {
          db.createObjectStore('profiles', { keyPath: 'id' });
        }

        // ai_tips
        if (!db.objectStoreNames.contains('ai_tips')) {
          const tipStore = db.createObjectStore('ai_tips', { keyPath: 'id' });
          tipStore.createIndex('by-created_at', 'created_at');
        }

        // kv_store
        if (!db.objectStoreNames.contains('kv_store')) {
          db.createObjectStore('kv_store', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}

// Low-level helper functions for IndexedDB operations
export async function idbGetBPLogs(): Promise<BloodPressureLog[]> {
  try {
    const db = await getDB();
    return await db.getAll('bp_logs');
  } catch (err) {
    console.error('Failed to read bp_logs from IndexedDB:', err);
    return [];
  }
}

export async function idbSaveBPLog(log: BloodPressureLog): Promise<void> {
  try {
    const db = await getDB();
    await db.put('bp_logs', log);
  } catch (err) {
    console.error('Failed to save bp_log to IndexedDB:', err);
  }
}

export async function idbBulkSaveBPLogs(logs: BloodPressureLog[]): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction('bp_logs', 'readwrite');
    for (const log of logs) {
      await tx.store.put(log);
    }
    await tx.done;
  } catch (err) {
    console.error('Failed to bulk save bp_logs to IndexedDB:', err);
  }
}

export async function idbDeleteBPLog(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('bp_logs', id);
  } catch (err) {
    console.error('Failed to delete bp_log from IndexedDB:', err);
  }
}

export async function idbGetWeightLogs(): Promise<WeightLog[]> {
  try {
    const db = await getDB();
    return await db.getAll('weight_logs');
  } catch (err) {
    console.error('Failed to read weight_logs from IndexedDB:', err);
    return [];
  }
}

export async function idbSaveWeightLog(log: WeightLog): Promise<void> {
  try {
    const db = await getDB();
    await db.put('weight_logs', log);
  } catch (err) {
    console.error('Failed to save weight_log to IndexedDB:', err);
  }
}

export async function idbBulkSaveWeightLogs(logs: WeightLog[]): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction('weight_logs', 'readwrite');
    for (const log of logs) {
      await tx.store.put(log);
    }
    await tx.done;
  } catch (err) {
    console.error('Failed to bulk save weight_logs to IndexedDB:', err);
  }
}

export async function idbDeleteWeightLog(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('weight_logs', id);
  } catch (err) {
    console.error('Failed to delete weight_log from IndexedDB:', err);
  }
}

export async function idbGetProfile(id = 'local-user'): Promise<UserProfile | null> {
  try {
    const db = await getDB();
    const res = await db.get('profiles', id);
    return res || null;
  } catch (err) {
    console.error('Failed to read profile from IndexedDB:', err);
    return null;
  }
}

export async function idbSaveProfile(profile: UserProfile): Promise<void> {
  try {
    const db = await getDB();
    await db.put('profiles', profile);
  } catch (err) {
    console.error('Failed to save profile to IndexedDB:', err);
  }
}

export async function idbGetAITips(): Promise<AITipLog[]> {
  try {
    const db = await getDB();
    const tips = await db.getAll('ai_tips');
    return tips.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (err) {
    console.error('Failed to read ai_tips from IndexedDB:', err);
    return [];
  }
}

export async function idbSaveAITip(tip: AITipLog): Promise<void> {
  try {
    const db = await getDB();
    await db.put('ai_tips', tip);
  } catch (err) {
    console.error('Failed to save ai_tip to IndexedDB:', err);
  }
}

export async function idbGetKV<T = any>(key: string): Promise<T | null> {
  try {
    const db = await getDB();
    const res = await db.get('kv_store', key);
    return res ? res.value : null;
  } catch (err) {
    console.error(`Failed to get KV [${key}] from IndexedDB:`, err);
    return null;
  }
}

export async function idbSetKV(key: string, value: any): Promise<void> {
  try {
    const db = await getDB();
    await db.put('kv_store', { key, value });
  } catch (err) {
    console.error(`Failed to set KV [${key}] in IndexedDB:`, err);
  }
}

export async function idbRemoveKV(key: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('kv_store', key);
  } catch (err) {
    console.error(`Failed to delete KV [${key}] from IndexedDB:`, err);
  }
}

export async function idbClearData(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear('bp_logs');
    await db.clear('weight_logs');
  } catch (err) {
    console.error('Failed to clear data in IndexedDB:', err);
  }
}

export async function idbResetAll(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear('bp_logs');
    await db.clear('weight_logs');
    await db.clear('profiles');
    await db.clear('ai_tips');
    await db.clear('kv_store');
  } catch (err) {
    console.error('Failed to reset IndexedDB:', err);
  }
}
