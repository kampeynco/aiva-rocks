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
      .list({ 
        areaCode: phoneNumber.slice(2, 5),
        limit: 1
      });

    if (!availableNumbers || availableNumbers.length === 0) {
      console.error('No numbers available in this area code');
      return new Response(
        JSON.stringify({ 
          error: 'No phone numbers available in this area code. Please try a different area code.',
          code: 'NO_NUMBERS_AVAILABLE'
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Use the first available number instead of the specific one
    const numberToPurchase = availableNumbers[0].phoneNumber;
    console.log('Found available number:', numberToPurchase);
    
    // Purchase the phone number
    const purchasedNumber = await client.incomingPhoneNumbers.create({
      phoneNumber: numberToPurchase,
      voiceUrl: 'https://demo.twilio.com/welcome/voice/',
      smsUrl: 'https://demo.twilio.com/welcome/sms/reply/',
    });

    console.log('Number purchased successfully:', purchasedNumber.sid);

    const countryCode = 'US';
    const areaCode = numberToPurchase.slice(2, 5);

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
    
    let message = 'An unexpected error occurred';
    let code = 'UNKNOWN_ERROR';
    let status = 500;

    if (error.code === 21404) {
      message = 'The requested phone number is no longer available. Please try again.';
      code = 'NUMBER_UNAVAILABLE';
      status = 400;
    }
    
    return new Response(
      JSON.stringify({ 
        error: message,
        code: code,
        details: error 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status,
      },
    );
  }
});