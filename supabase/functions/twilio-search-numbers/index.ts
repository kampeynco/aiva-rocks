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
      limit: 20, // Increased limit to ensure we get enough valid numbers
      capabilities: ["voice", "SMS"],
      areaCode: areaCode,
    };

    console.log("Calling Twilio API with params:", searchParams);
    const availableNumbers = await client.availablePhoneNumbers("US")
      .local.list(searchParams);

    // Additional verification of each number's availability
    const verifiedNumbers = [];
    for (const number of availableNumbers) {
      try {
        // Check if the number is still available by attempting to fetch its details
        const numberDetails = await client.availablePhoneNumbers("US")
          .local.list({ phoneNumber: number.phoneNumber });
        
        // If the number is found in available numbers, it's still purchasable
        if (numberDetails && numberDetails.length > 0) {
          verifiedNumbers.push({
            phoneNumber: number.phoneNumber,
            friendlyName: number.friendlyName,
            locality: number.locality,
            region: number.region,
          });
        }
      } catch (error) {
        console.error(`Error verifying number ${number.phoneNumber}:`, error);
        // Skip this number if verification fails
        continue;
      }
    }

    console.log(`Found ${verifiedNumbers.length} verified available numbers`);
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
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});