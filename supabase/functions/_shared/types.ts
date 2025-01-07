export interface Voice {
  id: string;
  name: string;
  description?: string;
  preview_url?: string;
  storage_path?: string;
}

export interface UltravoxResponse {
  voices: Voice[];
}

export interface ProcessingResult {
  voiceId: string;
  error?: string;
}