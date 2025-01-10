import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Add authorization header if required by the storage bucket
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header is missing' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // List all files in the voice-previews bucket recursively
    const { data: files, error: listError } = await supabaseClient.storage
      .from('voice-previews')
      .list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (listError) {
      throw listError;
    }

    console.log(`Found ${files.length} files to revert`);

    const results = await Promise.all(
      files.map(async (file) => {
        try {
          // Skip files that are already in the root
          if (!file.name.includes('/')) {
            console.log(`Skipping ${file.name} - already in root`);
            return { file: file.name, success: true, skipped: true };
          }

          const newPath = file.name.split('/').pop() || file.name;
          console.log(`Moving ${file.name} to ${newPath}`);

          // Move file to root
          const { error: moveError } = await supabaseClient.storage
            .from('voice-previews')
            .move(file.name, newPath);

          if (moveError) {
            console.error(`Failed to move ${file.name}:`, moveError);
            return { file: file.name, success: false, error: moveError.message };
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
    console.error('Error in revert-voice-previews function:', error);
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
