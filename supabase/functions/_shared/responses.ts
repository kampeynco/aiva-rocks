import { corsHeaders } from "./cors.ts";

export function createErrorResponse(message: string, status: number): Response {
  console.error(`Error: ${message}`);
  return new Response(
    JSON.stringify({ error: message }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status 
    }
  );
}

export function createSuccessResponse(data: unknown): Response {
  return new Response(
    JSON.stringify(data),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    }
  );
}