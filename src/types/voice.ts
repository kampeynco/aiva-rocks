export interface Voice {
  id: string
  name: string
  language: string | null
  description?: string | null
  preview_url?: string | null
  storage_path?: string | null
  created_at?: string
  updated_at?: string
}