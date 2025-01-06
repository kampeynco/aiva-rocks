export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      agents: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          phone_number: string | null
          prompt: string
          status: string | null
          updated_at: string
          voice_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          phone_number?: string | null
          prompt: string
          status?: string | null
          updated_at?: string
          voice_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          phone_number?: string | null
          prompt?: string
          status?: string | null
          updated_at?: string
          voice_id?: string | null
        }
        Relationships: []
      }
      calls: {
        Row: {
          agent_id: string | null
          created_at: string
          duration: number | null
          ended_at: string | null
          id: string
          phone_number: string
          started_at: string | null
          status: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          duration?: number | null
          ended_at?: string | null
          id?: string
          phone_number: string
          started_at?: string | null
          status: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          duration?: number | null
          ended_at?: string | null
          id?: string
          phone_number?: string
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "calls_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          }
        ]
      }
      phone_numbers: {
        Row: {
          id: string
          phone_number: string
          friendly_name: string | null
          country_code: string
          area_code: string | null
          twilio_sid: string
          status: string
          agent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          phone_number: string
          friendly_name?: string | null
          country_code: string
          area_code?: string | null
          twilio_sid: string
          status?: string
          agent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          phone_number?: string
          friendly_name?: string | null
          country_code?: string
          area_code?: string | null
          twilio_sid?: string
          status?: string
          agent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "phone_numbers_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean | null
        }
        Insert: {
          created_at?: string
          id: string
          is_admin?: boolean | null
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}