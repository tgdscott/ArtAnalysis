import { openDB, DBSchema } from 'idb';
import { SavedArtwork, AnalysisRecord, User } from '../types';

interface ArtTherapyDB extends DBSchema {
  gallery: {
    key: string;
    value: SavedArtwork;
  };
  analysis: {
    key: string;
    value: AnalysisRecord;
  };
  users: {
    key: string; // email as key for simplicity in this prototype
    value: User;
  };
  session: {
    key: string;
    value: { activeEmail: string };
  };
}

const DB_NAME = 'projective-art-db';
const VERSION = 2; // Incremented for Users

const getDB = async () => {
  return openDB<ArtTherapyDB>(DB_NAME, VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('gallery')) {
        db.createObjectStore('gallery', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('analysis')) {
        db.createObjectStore('analysis', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'email' });
      }
      if (!db.objectStoreNames.contains('session')) {
        db.createObjectStore('session', { keyPath: 'key' });
      }
    },
  });
};

export const storageService = {
  // --- User / Auth ---
  async loginOrRegister(name: string, email: string, username?: string): Promise<User> {
    const db = await getDB();
    const existing = await db.get('users', email);
    
    if (existing) {
      // Login: Update session
      await db.put('session', { key: 'current', activeEmail: email });
      return existing;
    } else {
      // Register
      const newUser: User = {
        id: crypto.randomUUID(),
        name,
        email,
        username: username && username.trim() !== '' ? username : email,
        createdAt: Date.now()
      };
      await db.put('users', newUser);
      await db.put('session', { key: 'current', activeEmail: email });
      return newUser;
    }
  },

  async getCurrentUser(): Promise<User | null> {
    const db = await getDB();
    const session = await db.get('session', 'current');
    if (!session) return null;
    return (await db.get('users', session.activeEmail)) || null;
  },

  async logout(): Promise<void> {
    const db = await getDB();
    await db.delete('session', 'current');
  },

  // --- Gallery (Generated Art) ---

  async saveArtwork(artwork: SavedArtwork): Promise<void> {
    const db = await getDB();
    await db.put('gallery', artwork);
  },

  async getGallery(): Promise<SavedArtwork[]> {
    const db = await getDB();
    const all = await db.getAll('gallery');
    // Sort by newest first
    return all.sort((a, b) => b.timestamp - a.timestamp);
  },

  async getArtworkById(id: string): Promise<SavedArtwork | undefined> {
    const db = await getDB();
    return db.get('gallery', id);
  },

  // --- Analysis History ---

  async saveAnalysis(record: AnalysisRecord): Promise<void> {
    const db = await getDB();
    await db.put('analysis', record);
  },

  async getHistory(): Promise<AnalysisRecord[]> {
    const db = await getDB();
    const all = await db.getAll('analysis');
    return all.sort((a, b) => b.timestamp - a.timestamp);
  }
};