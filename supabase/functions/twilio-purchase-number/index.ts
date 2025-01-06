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

    // First, verify the number is still available
    console.log('Verifying number availability...');
    const availableNumbers = await client.availablePhoneNumbers('US')
      .local
      .list({ phoneNumber });

    if (!availableNumbers || availableNumbers.length === 0) {
      console.error('Phone number is no longer available:', phoneNumber);
      return new Response(
        JSON.stringify({ 
          error: 'Phone number is no longer available',
          code: 'NUMBER_UNAVAILABLE'
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    console.log('Number is available, attempting to purchase...');
    
    // Purchase the phone number
    const purchasedNumber = await client.incomingPhoneNumbers.create({
      phoneNumber: phoneNumber,
      voiceUrl: 'https://demo.twilio.com/welcome/voice/',
      smsUrl: 'https://demo.twilio.com/welcome/sms/reply/',
    });

    console.log('Number purchased successfully:', purchasedNumber.sid);

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
    
    // Check if it's a Twilio API error
    const status = error.status === 400 ? 400 : 500;
    const message = error.code === 21404 
      ? 'Phone number is no longer available'
      : error.message;
    
    return new Response(
      JSON.stringify({ 
        error: message,
        code: error.code || 'UNKNOWN_ERROR',
        details: error 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status,
      },
    );
  }
});