import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch voices from Ultravox API with the correct header
    const response = await fetch("https://api.ultravox.ai/v1/voices", {
      headers: {
        'X-API-Key': Deno.env.get('ULTRAVOX_API_KEY') ?? '',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.statusText}`);
    }

    const { voices } = await response.json();

    // Process each voice
    for (const voice of voices) {
      if (voice.preview_url) {
        // Download preview audio
        const audioResponse = await fetch(voice.preview_url);
        if (!audioResponse.ok) continue;

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
        }
      }
    }

    return new Response(
      JSON.stringify({ message: 'Voices synced successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});