import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import twilio from "npm:twilio";

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
    const { areaCode } = await req.json();
    console.log('Received request to purchase number with area code:', areaCode);

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");

    if (!accountSid || !authToken) {
      console.error('Missing Twilio credentials');
      throw new Error("Missing Twilio credentials");
    }

    const client = twilio(accountSid, authToken);

    // First, verify numbers are available in this area code
    console.log('Verifying number availability...');
    const availableNumbers = await client.availablePhoneNumbers('US')
      .local
      .list({ 
        areaCode: areaCode,
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

    // Use the first available number
    const numberToPurchase = availableNumbers[0].phoneNumber;
    console.log('Found available number:', numberToPurchase);
    
    try {
      // Purchase the phone number
      const purchasedNumber = await client.incomingPhoneNumbers.create({
        phoneNumber: numberToPurchase,
        voiceUrl: 'https://demo.twilio.com/welcome/voice/',
        smsUrl: 'https://demo.twilio.com/welcome/sms/reply/',
      });

      console.log('Number purchased successfully:', purchasedNumber.sid);

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
    } catch (purchaseError) {
      console.error('Error purchasing number:', purchaseError);
      
      // Handle specific Twilio error codes
      if (purchaseError.code === 21404) {
        return new Response(
          JSON.stringify({ 
            error: 'The requested phone number is no longer available. Please try again.',
            code: 'NUMBER_UNAVAILABLE',
            details: purchaseError
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          },
        );
      }

      throw purchaseError; // Re-throw other errors to be caught by the outer catch block
    }
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