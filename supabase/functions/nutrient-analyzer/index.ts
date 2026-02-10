import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SymptomData {
  symptoms: string[];
  imageBase64?: string;
}

const symptomLabels: Record<string, string> = {
  'yellowing_leaves': 'Yellowing Leaves',
  'poor_flowering': 'Poor Flowering',
  'weak_stems': 'Weak Stems',
  'stunted_growth': 'Stunted Growth',
  'leaf_curling': 'Leaf Curling',
  'brown_tips': 'Brown Tips',
  'purple_leaves': 'Purple Leaves',
  'poor_roots': 'Weak Root System',
  'interveinal_chlorosis': 'Yellow Between Veins',
  'small_fruits': 'Small Fruits'
};

const analyzeNutrientDeficiency = async (data: SymptomData) => {
  const startTime = Date.now();
  console.log('Starting nutrient deficiency analysis...');
  
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  if (!data.symptoms || data.symptoms.length === 0) {
    throw new Error('At least one symptom is required');
  }

  const symptomDescriptions = data.symptoms
    .map(s => symptomLabels[s] || s)
    .join(', ');

  const systemPrompt = `You are an expert agricultural nutritionist specializing in plant nutrient deficiencies and foliar fertilizer recommendations. 
  
Analyze the provided plant symptoms and determine the most likely nutrient deficiency. Respond ONLY with valid JSON in this exact format:
{
  "nutrient": "Nitrogen/Phosphorus/Potassium/Calcium/Magnesium/Iron/Zinc/etc",
  "confidence": 75,
  "deficiency_level": "mild|moderate|severe",
  "description": "Brief explanation of the deficiency and why these symptoms indicate it",
  "symptoms_matched": ["Symptom 1", "Symptom 2"],
  "foliar_products": [
    {
      "name": "Product Name",
      "type": "NPK/Micronutrient/Amino Acid/etc",
      "description": "What this product provides",
      "dosage": "2-3 ml per liter of water",
      "frequency": "Every 7-10 days"
    }
  ],
  "application_tips": [
    "Apply during early morning or late evening",
    "Avoid application during rain or extreme heat",
    "Ensure complete leaf coverage"
  ]
}

IMPORTANT GUIDELINES:
- Focus on nutrition advice, NOT disease diagnosis
- Recommend foliar fertilizers as the primary solution
- Include Herogra Especiales products when appropriate (Herofol Denso, Herofol Amino-K, Herofol Ca-Mg, Heromar, Aminofulvat)
- Provide practical, actionable dosage and frequency recommendations
- Consider the symptoms holistically to identify the most likely deficiency
- If multiple deficiencies are possible, focus on the most probable one`;

  const userContent: any[] = [
    { 
      type: 'text', 
      text: `A farmer has observed the following symptoms on their plants: ${symptomDescriptions}

Based on these symptoms, analyze the likely nutrient deficiency and recommend appropriate foliar fertilizers. Respond with JSON only.` 
    }
  ];

  if (data.imageBase64 && data.imageBase64.length > 500) {
    const imageUrl = data.imageBase64.startsWith('data:') 
      ? data.imageBase64 
      : `data:image/jpeg;base64,${data.imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')}`;
    
    userContent.push({
      type: 'image_url',
      image_url: { url: imageUrl }
    });
    
    userContent[0].text += '\n\nThe farmer has also provided a photo of the affected plant. Use this visual information to refine your analysis.';
  }

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
        { role: 'user', content: userContent }
      ],
      max_completion_tokens: 1000,
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error:', response.status, errorText);
    throw new Error(`AI analysis failed: ${response.status}`);
  }

  const responseData = await response.json();
  const aiContent = responseData.choices?.[0]?.message?.content;
  
  if (!aiContent) {
    throw new Error('No response from AI');
  }

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
    nutrient: analysisResult.nutrient || 'Unknown',
    confidence: Math.min(100, Math.max(0, analysisResult.confidence || 50)),
    deficiency_level: analysisResult.deficiency_level || 'moderate',
    description: analysisResult.description || 'Analysis completed',
    symptoms_matched: Array.isArray(analysisResult.symptoms_matched) 
      ? analysisResult.symptoms_matched 
      : [],
    foliar_products: Array.isArray(analysisResult.foliar_products)
      ? analysisResult.foliar_products.slice(0, 3)
      : [],
    application_tips: Array.isArray(analysisResult.application_tips)
      ? analysisResult.application_tips.slice(0, 5)
      : ['Apply during early morning or late evening for best absorption']
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Nutrient deficiency analyzer started');
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const requestData = await req.json();
    const { symptoms, image } = requestData;

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one symptom is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing symptoms:', symptoms);
    const analysisResult = await analyzeNutrientDeficiency({ 
      symptoms, 
      imageBase64: image 
    });
    
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
        nutrient: "Analysis Error",
        confidence: 0,
        deficiency_level: "moderate",
        description: "Unable to analyze the symptoms. Please try again.",
        symptoms_matched: [],
        foliar_products: [],
        application_tips: [
          "Please select clear symptoms and try again",
          "Optionally add a photo for better analysis"
        ]
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
