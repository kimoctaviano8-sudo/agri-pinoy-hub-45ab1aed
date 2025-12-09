import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Optimized plant health analysis using Gemini Vision AI
const analyzePlantHealth = async (imageBase64: string) => {
  const startTime = Date.now();
  console.log('Starting optimized Gemini Vision AI plant analysis...');
  
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  // Quick validation
  if (!imageBase64 || typeof imageBase64 !== 'string' || imageBase64.length < 500) {
    throw new Error('Invalid or insufficient image data');
  }

  // Prepare image URL efficiently
  const imageUrl = imageBase64.startsWith('data:') 
    ? imageBase64 
    : `data:image/jpeg;base64,${imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')}`;

  // Optimized prompt - more concise for faster processing
  const systemPrompt = `Expert agricultural AI for Filipino crop disease detection. Analyze image and respond ONLY with valid JSON:
{"disease":"Name or Healthy Crop","confidence":85,"severity":"low|medium|high","description":"Brief analysis","recommendations":["Rec1","Rec2","Rec3"],"foliarProducts":[{"name":"Product","type":"Type","description":"Desc","usage":"Usage"}]}
Focus on: rice, corn, tomato, potato, eggplant. For non-crops, set disease to "Not a valid crop".`;

  // Call Gemini Vision API with optimized settings
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this crop image for diseases. Respond with JSON only.' },
            { type: 'image_url', image_url: { url: imageUrl } }
          ]
        }
      ],
      max_completion_tokens: 800, // Reduced for faster response
      temperature: 0.3 // Lower temperature for more deterministic, faster responses
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error:', response.status, errorText);
    throw new Error(`AI analysis failed: ${response.status}`);
  }

  const data = await response.json();
  const aiContent = data.choices?.[0]?.message?.content;
  
  if (!aiContent) {
    throw new Error('No response from AI');
  }

  // Fast JSON parsing
  let analysisResult;
  try {
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
    analysisResult = JSON.parse(jsonMatch ? jsonMatch[0] : aiContent.trim());
  } catch {
    console.error('JSON parse error, raw:', aiContent);
    throw new Error('Failed to parse AI response');
  }

  console.log(`Analysis completed in ${Date.now() - startTime}ms`);

  return {
    disease: analysisResult.disease || 'Unknown',
    confidence: Math.min(100, Math.max(0, analysisResult.confidence || 50)),
    severity: analysisResult.severity || 'medium',
    description: analysisResult.description || 'Analysis completed',
    recommendations: Array.isArray(analysisResult.recommendations) 
      ? analysisResult.recommendations.slice(0, 5) 
      : ['Consult with agricultural expert'],
    foliarProducts: Array.isArray(analysisResult.foliarProducts)
      ? analysisResult.foliarProducts.slice(0, 3)
      : []
  };
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Plant disease analyzer started');
    
    // Create Supabase client for authentication and credit management
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    
    // Get user from authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      console.log('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Check and consume credit using database function
    const { data: creditConsumed, error: creditError } = await supabaseClient
      .rpc('consume_credit', { user_id_param: user.id });
    
    if (creditError) {
      console.error('Credit check error:', creditError);
      return new Response(
        JSON.stringify({ error: 'Failed to process credit' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    if (!creditConsumed) {
      // User has no credits left
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient credits',
          message: 'You have no remaining scan credits. Please purchase more credits to continue scanning.',
          creditsRequired: true
        }),
        { 
          status: 402, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const { image } = await req.json();

    if (!image) {
      console.log('No image provided');
      return new Response(
        JSON.stringify({ error: 'Image is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Starting Gemini Vision plant analysis...');
    const analysisResult = await analyzePlantHealth(image);
    console.log('Analysis completed successfully');

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Analysis error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Analysis failed',
        details: error instanceof Error ? error.message : String(error),
        disease: "Analysis Error",
        confidence: 0,
        severity: "medium",
        description: "Unable to analyze the plant image. Please try again with a clear photo of an agricultural crop.",
        recommendations: [
          "Take a clear, well-lit photo of the plant",
          "Focus on affected leaves or plant parts",
          "Ensure the image shows an agricultural crop",
          "Check your internet connection and try again"
        ],
        foliarProducts: []
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});