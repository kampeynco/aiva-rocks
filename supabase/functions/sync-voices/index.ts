import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getRequiredEnvVar } from "../_shared/config.ts";
import { createErrorResponse, createSuccessResponse } from "../_shared/responses.ts";
import { UltravoxResponse } from "../_shared/types.ts";
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

    const apiKey = getRequiredEnvVar('ULTRAVOX_API_KEY');

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
    const { voices } = data as UltravoxResponse;
    
    if (!Array.isArray(voices)) {
      return createErrorResponse('Invalid response format from Ultravox API', 500);
    }

    console.log(`Successfully fetched ${voices.length} voices`);

    const results = await Promise.allSettled(voices.map(processVoice));

    const successful = results.filter(r => 
      r.status === 'fulfilled' && !r.value.error
    ).length;
    
    const failed = results.filter(r => 
      r.status === 'rejected' || (r.status === 'fulfilled' && r.value.error)
    ).length;

    return createSuccessResponse({ 
      message: 'Voice sync completed',
      summary: {
        total: voices.length,
        successful,
        failed
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse('An unexpected error occurred', 500);
  }
});