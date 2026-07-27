/**
 * Hand-maintained Database types aligned with supabase/migrations.
 * Regenerate with `npm run db:types` when using a local Supabase stack.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      agents: {
        Row: {
          id: string;
          slug: string;
          name: string;
          system_prompt_key: string;
          model: string | null;
          voice_config: Json;
          metadata: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          system_prompt_key?: string;
          model?: string | null;
          voice_config?: Json;
          metadata?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          system_prompt_key?: string;
          model?: string | null;
          voice_config?: Json;
          metadata?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      agent_tools: {
        Row: {
          id: string;
          agent_id: string;
          tool_name: string;
          config: Json;
          is_enabled: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          tool_name: string;
          config?: Json;
          is_enabled?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          agent_id?: string;
          tool_name?: string;
          config?: Json;
          is_enabled?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      calls: {
        Row: {
          id: string;
          vapi_call_id: string;
          agent_id: string | null;
          status: string;
          direction: string | null;
          phone_number: string | null;
          customer_number: string | null;
          started_at: string | null;
          ended_at: string | null;
          raw: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vapi_call_id: string;
          agent_id?: string | null;
          status?: string;
          direction?: string | null;
          phone_number?: string | null;
          customer_number?: string | null;
          started_at?: string | null;
          ended_at?: string | null;
          raw?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vapi_call_id?: string;
          agent_id?: string | null;
          status?: string;
          direction?: string | null;
          phone_number?: string | null;
          customer_number?: string | null;
          started_at?: string | null;
          ended_at?: string | null;
          raw?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      call_events: {
        Row: {
          id: string;
          call_id: string | null;
          vapi_call_id: string | null;
          event_type: string;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          call_id?: string | null;
          vapi_call_id?: string | null;
          event_type: string;
          payload?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          call_id?: string | null;
          vapi_call_id?: string | null;
          event_type?: string;
          payload?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      tool_invocations: {
        Row: {
          id: string;
          call_id: string | null;
          vapi_call_id: string | null;
          tool_name: string;
          tool_call_id: string | null;
          args: Json;
          result: Json | null;
          status: string;
          latency_ms: number | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          call_id?: string | null;
          vapi_call_id?: string | null;
          tool_name: string;
          tool_call_id?: string | null;
          args?: Json;
          result?: Json | null;
          status?: string;
          latency_ms?: number | null;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          call_id?: string | null;
          vapi_call_id?: string | null;
          tool_name?: string;
          tool_call_id?: string | null;
          args?: Json;
          result?: Json | null;
          status?: string;
          latency_ms?: number | null;
          error_message?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          call_id: string;
          role: string;
          content: string;
          intent: string | null;
          occurred_at: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          call_id: string;
          role: string;
          content?: string;
          intent?: string | null;
          occurred_at?: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          call_id?: string;
          role?: string;
          content?: string;
          intent?: string | null;
          occurred_at?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      call_summary: {
        Row: {
          id: string;
          call_id: string;
          summary: string;
          intent: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          call_id: string;
          summary: string;
          intent?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          call_id?: string;
          summary?: string;
          intent?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      patients: {
        Row: {
          patient_id: string;
          first_name: string;
          last_name: string;
          date_of_birth: string;
          sex: string;
          phone_number: string;
          email: string | null;
          address_line_1: string;
          address_line_2: string | null;
          city: string;
          state: string;
          zip_code: string;
          insurance_provider: string | null;
          insurance_member_id: string | null;
          preferred_language: string;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          patient_id?: string;
          first_name: string;
          last_name: string;
          date_of_birth: string;
          sex: string;
          phone_number: string;
          email?: string | null;
          address_line_1: string;
          address_line_2?: string | null;
          city: string;
          state: string;
          zip_code: string;
          insurance_provider?: string | null;
          insurance_member_id?: string | null;
          preferred_language?: string;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          patient_id?: string;
          first_name?: string;
          last_name?: string;
          date_of_birth?: string;
          sex?: string;
          phone_number?: string;
          email?: string | null;
          address_line_1?: string;
          address_line_2?: string | null;
          city?: string;
          state?: string;
          zip_code?: string;
          insurance_provider?: string | null;
          insurance_member_id?: string | null;
          preferred_language?: string;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
