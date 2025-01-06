import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

// Type definitions
interface Voice {
  id: string
  name: string
  description?: string
  preview_url?: string
}

interface UltravoxResponse {
  voices: Voice[]
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// Environment validation
function getRequiredEnvVar(name: string): string {
  const value = Deno.env.get(name)
  if (!value) {
    console.error(`${name} environment variable is not set`)
    throw new Error(`${name} is required`)
  }
  return value
}

// Error response helper
function createErrorResponse(message: string, status: number): Response {
  console.error(`Error: ${message}`)
  return new Response(
    JSON.stringify({ error: message }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status 
    }
  )
}

async function validateAndGetAudioBlob(response: Response, voiceId: string): Promise<Blob> {
  const blob = await response.blob()
  if (blob.size > MAX_FILE_SIZE) {
    console.error(`Voice ${voiceId} audio file exceeds maximum size of ${MAX_FILE_SIZE} bytes`)
    throw new Error('Audio file too large')
  }
  return blob
}

serve(async (req) => {
  console.log('Received request:', req.method, req.url)

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Validate authorization
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return createErrorResponse('No Authorization header present', 401)
    }

    // Get required environment variables
    let supabaseUrl: string
    let supabaseKey: string
    let apiKey: string
    
    try {
      supabaseUrl = getRequiredEnvVar('SUPABASE_URL')
      supabaseKey = getRequiredEnvVar('SUPABASE_SERVICE_ROLE_KEY')
      apiKey = getRequiredEnvVar('ULTRAVOX_API_KEY')
    } catch (error) {
      return createErrorResponse(error.message, 400)
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Fetching voices from Ultravox API...')
    const response = await fetch("https://api.ultravox.ai/api/voices", {
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Failed to fetch voices:', errorText)
      return createErrorResponse(
        `Failed to fetch voices: ${errorText}`, 
        response.status === 401 ? 401 : 500
      )
    }

    const data = await response.json()
    const { voices } = data as UltravoxResponse
    
    if (!Array.isArray(voices)) {
      return createErrorResponse('Invalid response format from Ultravox API', 500)
    }

    console.log(`Successfully fetched ${voices.length} voices`)

    // Process voices in parallel
    const results = await Promise.allSettled(
      voices.map(async (voice) => {
        if (!voice.preview_url) {
          console.log(`Skipping voice ${voice.id} - no preview URL`)
          return
        }

        console.log(`Processing voice: ${voice.id}`)
        
        try {
          // Download preview audio
          const audioResponse = await fetch(voice.preview_url)
          if (!audioResponse.ok) {
            throw new Error(`Failed to fetch preview: ${audioResponse.statusText}`)
          }

          const audioBlob = await validateAndGetAudioBlob(audioResponse, voice.id)
          const fileName = `${voice.id}.mp3`

          // Upload to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('voice-previews')
            .upload(fileName, audioBlob, {
              contentType: 'audio/mpeg',
              upsert: true
            })

          if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`)
          }

          console.log(`Successfully uploaded preview for voice ${voice.id}`)

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('voice-previews')
            .getPublicUrl(fileName)

          // Update voice record in database
          const { error: dbError } = await supabase
            .from('voices')
            .upsert({
              id: voice.id,
              name: voice.name,
              description: voice.description || null,
              preview_url: voice.preview_url,
              storage_path: fileName,
            })

          if (dbError) {
            throw new Error(`Database update failed: ${dbError.message}`)
          }

          console.log(`Successfully updated voice ${voice.id} in database`)
          return voice.id
        } catch (error) {
          console.error(`Error processing voice ${voice.id}:`, error)
          return { voiceId: voice.id, error: error.message }
        }
      })
    )

    // Analyze results
    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value?.error)).length

    return new Response(
      JSON.stringify({ 
        message: 'Voice sync completed',
        summary: {
          total: voices.length,
          successful,
          failed
        }
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return createErrorResponse(
      'An unexpected error occurred',
      500
    )
  }
})