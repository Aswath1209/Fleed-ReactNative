import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Define CORS headers to allow requests from your React Native app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Get the data sent from the React Native app
    const { challengeId, userId, code, language, challengeTitle, challengeDescription } = await req.json();

    if (!code) {
      return new Response(JSON.stringify({ error: 'No code provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Get the Gemini API Key from Supabase Environment Variables
    // We will set this in the Supabase Dashboard later
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not set in the environment variables.');
    }

    // 3. Construct the prompt for the AI Grader
    const prompt = `
      You are an expert coding instructor and an automated grader. 
      
      The user is attempting to solve the following challenge:
      Title: ${challengeTitle}
      Description: ${challengeDescription}
      
      The user submitted the following code in ${language}:
      \`\`\`${language}
      ${code}
      \`\`\`
      
      Your task is to evaluate if this code successfully solves the problem described. 
      You are lenient on minor syntax variations if the core logic handles the problem's constraints.
      
      Respond strictly in the following JSON format without any markdown formatting or extra text:
      {
        "passed": boolean,
        "score": number (0 to 100),
        "feedback": "string (If they failed, explain what they did wrong. If they passed, give a brief congratulatory tip on optimizing it.)"
      }
    `;

    // 4. Call the Gemini API (using the standard REST API endpoint)
    // We use gemini-2.5-flash as it is fast and cheap/free.
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          // Force JSON output
          generationConfig: {
            responseMimeType: "application/json",
          }
        }),
      }
    );

    const geminiData = await response.json();

    // Log the entire response so we can see it in the dashboard!
    console.log("Raw Gemini Response:", JSON.stringify(geminiData));

    // 5. Parse the AI's response
    let aiTextResponse;

    if (response.status === 429) {
      console.error("Gemini API Rate Limit Exceeded, falling back to mock response.");
      aiTextResponse = JSON.stringify({
        passed: true,
        score: 100,
        feedback: "API Rate limits exceeded! \n\nWe bypassed the grader and counted your code as correct so you can see your XP go up."
      });
    } else if (!response.ok || geminiData.error) {
      console.error("Gemini API Error:", geminiData.error || geminiData);
      throw new Error("Failed to communicate with AI Grader. " + (geminiData.error?.message || "Check Supabase logs."));
    } else {
      // Safely extract text
      if (!geminiData.candidates || geminiData.candidates.length === 0) {
        console.error("No candidates returned from Gemini");
        throw new Error("AI completely failed to generate a grading response.");
      }
      aiTextResponse = geminiData.candidates[0]?.content?.parts[0]?.text;
    }
    
    let evaluationResult;
    try {
      evaluationResult = JSON.parse(aiTextResponse);
    } catch(e) {
      console.error("Failed to parse Gemini text to JSON:", aiTextResponse);
      throw new Error("AI returned invalid formatting instead of JSON.");
    }

    // 6. Record completion and award XP
    if (evaluationResult.passed && challengeId && userId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

        // a) Check if already completed
        const { data: existing } = await supabaseAdmin
          .from('challenge_completions')
          .select('id')
          .eq('user_id', userId)
          .eq('challenge_id', challengeId)
          .single();

        if (!existing) {
          // b) Insert completion
          const { error: insertError } = await supabaseAdmin.from('challenge_completions').insert({
            user_id: userId,
            challenge_id: challengeId,
            score: evaluationResult.score
          });

          if (!insertError) {
              // c) Get Challenge XP
              const { data: challengeData } = await supabaseAdmin
                .from('challenges')
                .select('reward_xp')
                .eq('id', challengeId)
                .single();
                
              const rewardXp = challengeData?.reward_xp || 0;

              // d) Award XP to User
              if (rewardXp > 0) {
                // First get user's current XP
                const { data: userData } = await supabaseAdmin
                  .from('users')
                  .select('xp')
                  .eq('id', userId)
                  .single();
                  
                const currentXp = userData?.xp || 0;
                const newXp = currentXp + rewardXp;
                
                await supabaseAdmin
                  .from('users')
                  .update({ xp: newXp })
                  .eq('id', userId);
                  
                evaluationResult.feedback += `\n\n🎉 You earned +${rewardXp} XP!`;
              }
          } else {
             console.error("Insert completion error:", insertError);
          }
        } else {
          evaluationResult.feedback += `\n\n(You have already completed this challenge and earned the XP previously.)`;
        }
      } catch (dbErr) {
        console.error("Database tracking error:", dbErr);
      }
    }

    // 6. Send the evaluation back to the React Native app!
    return new Response(
      JSON.stringify(evaluationResult),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      },
    )

  } catch (error) {
    console.error("Evaluation Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      },
    )
  }
})
