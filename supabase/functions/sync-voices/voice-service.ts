import { MAX_FILE_SIZE } from "../_shared/config.ts";
import { Voice, ProcessingResult } from "../_shared/types.ts";
import { createSupabaseClient } from "../_shared/supabase.ts";

async function validateAndGetAudioBlob(response: Response, voiceId: string): Promise<Blob> {
  const blob = await response.blob();
  if (blob.size > MAX_FILE_SIZE) {
    console.error(`Voice ${voiceId} audio file exceeds maximum size of ${MAX_FILE_SIZE} bytes`);
    throw new Error('Audio file too large');
  }
  return blob;
}

export async function processVoice(voice: Voice): Promise<ProcessingResult> {
  if (!voice.preview_url) {
    console.log(`Skipping voice ${voice.id} - no preview URL`);
    return { voiceId: voice.id };
  }

  console.log(`Processing voice: ${voice.id}`);
  
  try {
    const audioResponse = await fetch(voice.preview_url);
    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch preview: ${audioResponse.statusText}`);
    }

    const audioBlob = await validateAndGetAudioBlob(audioResponse, voice.id);
    const fileName = `${voice.id}.mp3`;
    const supabase = createSupabaseClient();

    const { error: uploadError } = await supabase.storage
      .from('voice-previews')
      .upload(fileName, audioBlob, {
        contentType: 'audio/mpeg',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    console.log(`Successfully uploaded preview for voice ${voice.id}`);

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
      throw new Error(`Database update failed: ${dbError.message}`);
    }

    console.log(`Successfully updated voice ${voice.id} in database`);
    return { voiceId: voice.id };
  } catch (error) {
    console.error(`Error processing voice ${voice.id}:`, error);
    return { voiceId: voice.id, error: error.message };
  }
}