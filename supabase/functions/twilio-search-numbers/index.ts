import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Twilio } from "npm:twilio";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { areaCode } = await req.json();
    console.log("Searching for numbers with area code:", areaCode);

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");

    if (!accountSid || !authToken) {
      throw new Error("Missing Twilio credentials");
    }

    const client = new Twilio(accountSid, authToken);

    const searchParams = {
      limit: 10,
      capabilities: ["voice", "SMS"],
      areaCode: areaCode,
    };

    console.log("Calling Twilio API with params:", searchParams);
    const availableNumbers = await client.availablePhoneNumbers("US")
      .local.list(searchParams);

    const numbers = availableNumbers.map((number) => ({
      phoneNumber: number.phoneNumber,
      friendlyName: number.friendlyName,
      locality: number.locality,
      region: number.region,
    }));

    console.log("Found numbers:", numbers);
    return new Response(
      JSON.stringify({ numbers }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error searching for numbers:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});