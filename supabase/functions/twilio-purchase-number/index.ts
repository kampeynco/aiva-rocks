import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Twilio } from "npm:twilio";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phoneNumber } = await req.json();

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!accountSid || !authToken) {
      throw new Error("Missing Twilio credentials");
    }

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }

    const client = new Twilio(accountSid, authToken);
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Purchase the phone number
    const purchasedNumber = await client.incomingPhoneNumbers.create({
      phoneNumber,
    });

    // Store the phone number in the database
    const { error: dbError } = await supabase.from("phone_numbers").insert({
      phone_number: purchasedNumber.phoneNumber,
      friendly_name: purchasedNumber.friendlyName,
      country_code: purchasedNumber.countryCode,
      area_code: purchasedNumber.addressRequirements,
      twilio_sid: purchasedNumber.sid,
      status: "active",
    });

    if (dbError) {
      throw dbError;
    }

    return new Response(
      JSON.stringify({ success: true, number: purchasedNumber }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});