import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Log the request headers for debugging
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));

    // Check for authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const apiKey = Deno.env.get('ULTRAVOX_API_KEY');
    if (!apiKey) {
      console.error('ULTRAVOX_API_KEY is not set in environment variables');
      throw new Error('ULTRAVOX_API_KEY is not set');
    }

    console.log('Fetching voices from Ultravox API...');
    const response = await fetch("https://api.ultravox.ai/api/voices", {
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to fetch voices:', error);
      throw new Error(`Failed to fetch voices: ${JSON.stringify(error)}`);
    }

    const { voices } = await response.json();
    console.log(`Successfully fetched ${voices.length} voices`);

    // Process each voice
    for (const voice of voices) {
      if (voice.preview_url) {
        console.log(`Processing voice: ${voice.id}`);
        
        // Download preview audio
        const audioResponse = await fetch(voice.preview_url);
        if (!audioResponse.ok) {
          console.error(`Failed to fetch preview for voice ${voice.id}`);
          continue;
        }

        const audioBlob = await audioResponse.blob();
        const fileName = `${voice.id}.mp3`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('voice-previews')
          .upload(fileName, audioBlob, {
            contentType: 'audio/mpeg',
            upsert: true
          });

        if (uploadError) {
          console.error(`Failed to upload preview for voice ${voice.id}:`, uploadError);
          continue;
        }

        console.log(`Successfully uploaded preview for voice ${voice.id}`);

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('voice-previews')
          .getPublicUrl(fileName);

        // Update voice record in database
        const { error: dbError } = await supabase
          .from('voices')
          .upsert({
            id: voice.id,
            name: voice.name,
            description: voice.description || null,
            preview_url: voice.preview_url,
            storage_path: fileName,
          });

        if (dbError) {
          console.error(`Failed to update voice ${voice.id} in database:`, dbError);
        } else {
          console.log(`Successfully updated voice ${voice.id} in database`);
        }
      }
    }

    return new Response(
      JSON.stringify({ message: 'Voices synced successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in sync-voices function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});