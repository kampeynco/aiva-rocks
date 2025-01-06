import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import twilio from "npm:twilio";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const { areaCode } = await req.json();
    console.log("Searching for numbers with area code:", areaCode);

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");

    if (!accountSid || !authToken) {
      throw new Error("Missing Twilio credentials");
    }

    const client = new twilio(accountSid, authToken);

    const searchParams = {
      limit: 20,
      areaCode: areaCode,
      capabilities: {
        voice: true,
        SMS: true,
        MMS: true,
      },
    };

    console.log("Calling Twilio API with params:", searchParams);
    const availableNumbers = await client.availablePhoneNumbers("US")
      .local.list(searchParams);

    // Additional verification of each number's capabilities
    const verifiedNumbers = availableNumbers.filter(number => 
      number.capabilities.voice &&
      number.capabilities.SMS &&
      number.capabilities.MMS
    ).map(number => ({
      phoneNumber: number.phoneNumber,
      friendlyName: number.friendlyName,
      locality: number.locality,
      region: number.region,
      capabilities: {
        voice: number.capabilities.voice,
        sms: number.capabilities.SMS,
        mms: number.capabilities.MMS,
      }
    }));

    console.log(`Found ${verifiedNumbers.length} verified available numbers with required capabilities`);
    
    if (verifiedNumbers.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "No local phone numbers with voice, SMS, and MMS capabilities available in this area code.",
          code: "NO_NUMBERS_AVAILABLE"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    return new Response(
      JSON.stringify({ numbers: verifiedNumbers }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error searching for numbers:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        code: "SEARCH_ERROR"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});