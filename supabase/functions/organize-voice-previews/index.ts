import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // List all files in the voice-previews bucket
    const { data: files, error: listError } = await supabaseClient.storage
      .from('voice-previews')
      .list();

    if (listError) {
      throw listError;
    }

    console.log(`Found ${files.length} files to organize`);

    const results = await Promise.all(
      files.map(async (file) => {
        try {
          // Extract language from filename (e.g., "voice-en.mp3" -> "en")
          const match = file.name.match(/-(\w+)\.mp3$/);
          const language = match ? match[1].toLowerCase() : 'en';
          
          // Skip if file is already in a language folder
          if (file.name.includes('/')) {
            console.log(`Skipping ${file.name} - already in subfolder`);
            return { file: file.name, success: true, skipped: true };
          }

          const newPath = `${language}/${file.name}`;
          console.log(`Moving ${file.name} to ${newPath}`);

          // Move file to language subfolder
          const { error: moveError } = await supabaseClient.storage
            .from('voice-previews')
            .move(file.name, newPath);

          if (moveError) {
            console.error(`Failed to move ${file.name}:`, moveError);
            return { file: file.name, success: false, error: moveError.message };
          }

          // Update storage_path in voices table if needed
          const { error: updateError } = await supabaseClient
            .from('voices')
            .update({ storage_path: newPath })
            .eq('storage_path', file.name);

          if (updateError) {
            console.error(`Failed to update voice record for ${file.name}:`, updateError);
            return { file: file.name, success: false, error: updateError.message };
          }

          return { file: file.name, success: true, newPath };
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          return { file: file.name, success: false, error: error.message };
        }
      })
    );

    return new Response(
      JSON.stringify({ results }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in organize-voice-previews function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});