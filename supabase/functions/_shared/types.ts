export interface Voice {
  id: string;
  name: string;
  description?: string;
  preview_url?: string;
  storage_path?: string;
}

export interface UltravoxVoice {
  voiceId: string;
  name: string;
  description: string;
  previewUrl: string;
}

export interface UltravoxResponse {
  next: string | null;
  previous: string | null;
  total: number;
  results: UltravoxVoice[];
}

export interface ProcessingResult {
  voiceId: string;
  error?: string;
}