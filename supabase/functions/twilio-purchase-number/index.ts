import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import twilio from "npm:twilio";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { phoneNumber } = await req.json();
    console.log('Received request to purchase number:', phoneNumber);

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!accountSid || !authToken) {
      console.error('Missing Twilio credentials');
      throw new Error("Missing Twilio credentials");
    }

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      throw new Error("Missing Supabase credentials");
    }

    const client = twilio(accountSid, authToken);
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Attempting to purchase number through Twilio...');
    
    // Purchase the phone number
    const purchasedNumber = await client.incomingPhoneNumbers.create({
      phoneNumber,
    });

    console.log('Number purchased successfully:', purchasedNumber.sid);

    // Extract country code from the phone number (assuming US numbers for now)
    // For US numbers, we can hardcode 'US' since that's what we're working with
    const countryCode = 'US';

    // Store the phone number in the database
    const { error: dbError } = await supabase.from("phone_numbers").insert({
      phone_number: purchasedNumber.phoneNumber,
      friendly_name: purchasedNumber.friendlyName,
      country_code: countryCode,
      area_code: phoneNumber.slice(2, 5), // Extract area code from the phone number
      twilio_sid: purchasedNumber.sid,
      status: "active",
    });

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    console.log('Number saved to database successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        sid: purchasedNumber.sid,
        number: purchasedNumber 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error in twilio-purchase-number function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});