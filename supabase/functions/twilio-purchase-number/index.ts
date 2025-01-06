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
    // Note: phoneNumber should already be in E.164 format (+1XXXXXXXXXX)
    const purchasedNumber = await client.incomingPhoneNumbers.create({
      phoneNumber: phoneNumber,
      voiceUrl: 'https://demo.twilio.com/welcome/voice/', // Default Twilio voice URL
      smsUrl: 'https://demo.twilio.com/welcome/sms/reply/', // Default Twilio SMS URL
    });

    console.log('Number purchased successfully:', purchasedNumber.sid);

    // For US numbers, we can hardcode 'US' since that's what we're working with
    const countryCode = 'US';
    const areaCode = phoneNumber.slice(2, 5); // Extract area code from +1XXXXXXXXXX

    // Store the phone number in the database
    const { error: dbError } = await supabase.from("phone_numbers").insert({
      phone_number: purchasedNumber.phoneNumber,
      friendly_name: purchasedNumber.friendlyName,
      country_code: countryCode,
      area_code: areaCode,
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