import { openDB, DBSchema } from 'idb';
import { SavedArtwork, AnalysisRecord } from '../types';

/**
 * GOOGLE CLOUD MIGRATION NOTE:
 * This service currently uses IndexedDB for local browser persistence.
 * To migrate to Google Cloud:
 * 1. Replace the `idb` logic with calls to your backend API.
 * 2. The backend should interact with a database like Cloud SQL (PostgreSQL) or Firestore.
 * 3. `saveArtwork` -> POST /api/artwork
 * 4. `getGallery` -> GET /api/artwork
 * 5. `saveAnalysis` -> POST /api/analysis
 */

interface ArtTherapyDB extends DBSchema {
  gallery: {
    key: string;
    value: SavedArtwork;
  };
  analysis: {
    key: string;
    value: AnalysisRecord;
  };
}

const DB_NAME = 'projective-art-db';
const VERSION = 1;

const getDB = async () => {
  return openDB<ArtTherapyDB>(DB_NAME, VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('gallery')) {
        db.createObjectStore('gallery', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('analysis')) {
        db.createObjectStore('analysis', { keyPath: 'id' });
      }
    },
  });
};

export const storageService = {
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
