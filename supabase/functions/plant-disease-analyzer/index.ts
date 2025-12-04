import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Analyze plant health using Gemini Vision AI
const analyzePlantHealth = async (imageBase64: string) => {
  try {
    console.log('Starting Gemini Vision AI plant analysis...');
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Validate image data
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      throw new Error('Invalid image data');
    }

    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    
    if (base64Data.length < 500) {
      throw new Error('Image data too small for analysis');
    }

    // Prepare the image URL for Gemini
    const imageUrl = imageBase64.startsWith('data:') 
      ? imageBase64 
      : `data:image/jpeg;base64,${base64Data}`;

    // Call Gemini Vision API
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert agricultural AI specializing in plant disease detection for Filipino farmers. Analyze crop images and provide:
1. Disease identification (if any)
2. Confidence level (0-100%)
3. Severity (low/medium/high)
4. Detailed description
5. Specific treatment recommendations
6. Suggested foliar fertilizer products

Focus ONLY on agricultural crops (rice, corn, tomato, potato, etc.). If image shows non-crop plants, people, or objects, clearly state it's not a valid crop scan.

Respond in this EXACT JSON format:
{
  "disease": "Disease Name or Healthy Crop",
  "confidence": 85,
  "severity": "low|medium|high",
  "description": "Detailed analysis",
  "recommendations": ["Rec 1", "Rec 2", "Rec 3"],
  "foliarProducts": [
    {
      "name": "Product Name",
      "type": "Product Type",
      "description": "Product description",
      "usage": "Application instructions"
    }
  ]
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this plant image for diseases. If this is not an agricultural crop, or if you detect people or other objects, please indicate that clearly. Focus on Filipino agricultural crops like rice, corn, tomato, potato, eggplant, etc.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_completion_tokens: 1500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini response received');
    
    const aiContent = data.choices?.[0]?.message?.content;
    if (!aiContent) {
      throw new Error('No response from AI');
    }

    // Parse JSON response
    let analysisResult;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                       aiContent.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : aiContent;
      analysisResult = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.log('AI response:', aiContent);
      throw new Error('Failed to parse AI response');
    }

    // Validate and ensure all required fields
    return {
      disease: analysisResult.disease || 'Unknown',
      confidence: Math.min(100, Math.max(0, analysisResult.confidence || 50)),
      severity: analysisResult.severity || 'medium',
      description: analysisResult.description || 'Analysis completed',
      recommendations: Array.isArray(analysisResult.recommendations) 
        ? analysisResult.recommendations 
        : ['Consult with agricultural expert'],
      foliarProducts: Array.isArray(analysisResult.foliarProducts)
        ? analysisResult.foliarProducts
        : []
    };
    
  } catch (error) {
    console.error('Error in Gemini plant analysis:', error);
    throw error;
  }
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