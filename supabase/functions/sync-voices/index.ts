import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getRequiredEnvVar } from "../_shared/config.ts";
import { createErrorResponse, createSuccessResponse } from "../_shared/responses.ts";
import { UltravoxResponse, Voice } from "../_shared/types.ts";
import { processVoice } from "./voice-service.ts";

serve(async (req) => {
  console.log('Received request:', req.method, req.url);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('No Authorization header present', 401);
    }

    // Get the API key using the helper function that checks if it exists
    const apiKey = getRequiredEnvVar('ULTRAVOX_API_KEY');
    console.log('Retrieved Ultravox API key from environment variables');

    console.log('Fetching voices from Ultravox API...');
    const response = await fetch("https://api.ultravox.ai/api/voices", {
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch voices:', errorText);
      return createErrorResponse(
        `Failed to fetch voices: ${errorText}`, 
        response.status === 401 ? 401 : 500
      );
    }

    const data = await response.json();
    console.log('Received response from Ultravox API:', JSON.stringify(data));

    // Check if data has the expected structure
    if (!data || typeof data !== 'object' || !Array.isArray(data.voices)) {
      console.error('Invalid response structure:', data);
      return createErrorResponse('Invalid response format from Ultravox API', 500);
    }

    const { voices } = data as UltravoxResponse;
    console.log(`Successfully fetched ${voices.length} voices`);

    // Process each voice and store in database
    const results = await Promise.allSettled(voices.map(processVoice));

    const successful = results.filter(r => 
      r.status === 'fulfilled' && !r.value.error
    ).length;
    
    const failed = results.filter(r => 
      r.status === 'rejected' || (r.status === 'fulfilled' && r.value.error)
    ).length;

    console.log(`Voice processing complete. Success: ${successful}, Failed: ${failed}`);

    return createSuccessResponse(voices);
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse('An unexpected error occurred', 500);
  }
});