import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { corsHeaders } from "../_shared/cors.ts";

interface VoiceFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch all files in the voice-previews bucket
    const { data: files, error: listError } = await supabase.storage
      .from('voice-previews')
      .list();

    if (listError) {
      throw new Error(`Failed to list files: ${listError.message}`);
    }

    const results: { file: string; newPath: string; success: boolean; error?: string }[] = [];

    for (const file of (files as VoiceFile[])) {
      try {
        // Extract language from filename or default to English
        const match = file.name.match(/-(\w+)\.mp3$/);
        const language = match ? match[1].toLowerCase() : 'english';
        const newPath = `${language}/${file.name}`;

        console.log(`Moving ${file.name} to ${newPath}`);

        // Move file to language subfolder
        const { error: moveError } = await supabase.storage
          .from('voice-previews')
          .move(file.name, newPath);

        if (moveError) {
          results.push({
            file: file.name,
            newPath,
            success: false,
            error: moveError.message
          });
          continue;
        }

        // Update file path in voices table
        const { error: updateError } = await supabase
          .from('voices')
          .update({ storage_path: newPath })
          .eq('storage_path', file.name);

        if (updateError) {
          results.push({
            file: file.name,
            newPath,
            success: false,
            error: `Database update failed: ${updateError.message}`
          });
          continue;
        }

        results.push({
          file: file.name,
          newPath,
          success: true
        });

      } catch (error) {
        results.push({
          file: file.name,
          newPath: 'unknown',
          success: false,
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Voice preview organization completed',
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to organize voice previews',
        details: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});