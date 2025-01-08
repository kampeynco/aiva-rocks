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
    const { phoneNumber, userId } = await req.json();
    console.log('Received request to purchase number:', phoneNumber, 'for user:', userId);

    if (!phoneNumber || !userId) {
      throw new Error("Phone number and user ID are required");
    }

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

    console.log('Attempting to purchase number:', phoneNumber);
    
    try {
      // Verify number availability before purchase
      const availableNumbers = await client.availablePhoneNumbers('US')
        .local
        .list({ phoneNumber });

      if (!availableNumbers.length) {
        console.error('Number no longer available:', phoneNumber);
        return new Response(
          JSON.stringify({ 
            error: 'The requested phone number is no longer available. Please try again.',
            code: 'NUMBER_UNAVAILABLE'
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }

      // Purchase the phone number
      const purchasedNumber = await client.incomingPhoneNumbers.create({
        phoneNumber: phoneNumber,
        voiceUrl: 'https://demo.twilio.com/welcome/voice/',
        smsUrl: 'https://demo.twilio.com/welcome/sms/reply/',
      });

      console.log('Number purchased successfully:', purchasedNumber.sid);

      // Extract area code from the phone number
      const areaCode = phoneNumber.slice(2, 5);

      // Store the phone number in the database with the user ID
      const { error: dbError } = await supabase.from("phone_numbers").insert({
        phone_number: purchasedNumber.phoneNumber,
        friendly_name: purchasedNumber.friendlyName,
        country_code: 'US',
        area_code: areaCode,
        twilio_sid: purchasedNumber.sid,
        status: "active",
        created_by: userId
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
        }
      );
    } catch (twilioError: any) {
      console.error('Twilio error:', twilioError);
      
      // Handle specific Twilio errors
      if (twilioError.code === 21404) {
        return new Response(
          JSON.stringify({ 
            error: 'The requested phone number is no longer available. Please try again.',
            code: 'NUMBER_UNAVAILABLE'
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }
      
      throw twilioError;
    }
  } catch (error: any) {
    console.error('Error in twilio-purchase-number function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        code: error.code || 'UNKNOWN_ERROR',
        details: error 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: error.status || 500,
      }
    );
  }
});