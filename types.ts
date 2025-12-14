export interface AnalysisResult {
  visualEvidence: string[];
  personalitySnapshot: string;
  disclaimer: string;
}

export interface UploadedImage {
  base64: string;
  mimeType: string;
  previewUrl: string;
}

export interface SavedArtwork {
  id: string; // The 8-char hex code
  base64: string;
  promptLabel: string;
  timestamp: number;
}

export interface AnalysisRecord {
  id: string;
  artworkId?: string; // Optional link to a generated artwork ID
  userName?: string; // Self-identified name
  imageUrl: string;
  userEmotion?: {
    primary: string;
    secondary: string;
    tertiary?: string;
  };
  result: AnalysisResult;
  timestamp: number;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export enum ViewMode {
  ANALYZE = 'ANALYZE',
  GENERATE = 'GENERATE',
  HISTORY = 'HISTORY',
  ADMIN = 'ADMIN' // New Admin Dashboard
}

export interface PromptConfig {
  id: string;
  label: string;
  prompt: string;
  description: string; // Derived from the JSON keys for UI display
}