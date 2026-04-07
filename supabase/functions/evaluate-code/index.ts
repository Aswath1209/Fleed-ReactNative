import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { challengeId, userId, code, language, challengeTitle, challengeDescription } = await req.json();

    if (!code) {
      return new Response(JSON.stringify({ error: 'No code provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use Groq API (primary) or Gemini API (fallback)
    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!groqApiKey && !geminiApiKey) {
      throw new Error('No AI API key configured. Set GROQ_API_KEY or GEMINI_API_KEY.');
    }

    const prompt = `You are an expert coding instructor and automated grader.

The user is attempting to solve the following challenge:
Title: ${challengeTitle}
Description: ${challengeDescription}

The user selected the language: ${language}
The user submitted the following code:
\`\`\`${language}
${code}
\`\`\`

Your task:
1. FIRST, verify that the submitted code is actually written in ${language}. If the code is clearly written in a different programming language, immediately fail the submission with feedback telling them to use the correct language.
2. If the language is correct, evaluate if this code successfully solves the problem described.
3. Be lenient on minor syntax variations if the core logic handles the problem's constraints.

Respond ONLY with valid JSON (no markdown, no extra text):
{"passed": boolean, "score": number (0-100), "feedback": "string"}`;

    let aiTextResponse: string | null = null;

    // ---- Try Groq first (30 RPM free, very fast) ----
    if (groqApiKey) {
      try {
        console.log("Calling Groq API...");
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqApiKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: 'You are a code evaluator. Always respond with valid JSON only, no markdown.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.1,
            response_format: { type: "json_object" },
          }),
        });

        const groqData = await groqResponse.json();
        console.log("Groq status:", groqResponse.status);

        if (groqResponse.ok && groqData.choices?.[0]?.message?.content) {
          aiTextResponse = groqData.choices[0].message.content;
          console.log("Groq response received successfully");
        } else {
          console.error("Groq error:", JSON.stringify(groqData));
        }
      } catch (groqErr) {
        console.error("Groq fetch error:", groqErr);
      }
    }

    // ---- Fallback to Gemini if Groq failed ----
    if (!aiTextResponse && geminiApiKey) {
      try {
        console.log("Falling back to Gemini API...");
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json" }
            }),
          }
        );

        const geminiData = await geminiResponse.json();
        console.log("Gemini status:", geminiResponse.status);

        if (geminiResponse.ok && geminiData.candidates?.[0]?.content?.parts?.[0]?.text) {
          aiTextResponse = geminiData.candidates[0].content.parts[0].text;
          console.log("Gemini response received successfully");
        } else {
          console.error("Gemini error:", JSON.stringify(geminiData));
        }
      } catch (geminiErr) {
        console.error("Gemini fetch error:", geminiErr);
      }
    }

    // ---- If both APIs failed ----
    if (!aiTextResponse) {
      return new Response(
        JSON.stringify({
          passed: false,
          score: 0,
          feedback: "⏳ AI Grader is temporarily unavailable. Please try again in a moment."
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
      );
    }

    // Parse the AI's JSON response
    let evaluationResult;
    try {
      evaluationResult = JSON.parse(aiTextResponse);
    } catch(e) {
      console.error("Failed to parse AI response:", aiTextResponse);
      throw new Error("AI returned invalid formatting instead of JSON.");
    }

    // Record completion and award XP
    if (evaluationResult.passed && challengeId && userId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

        const { data: existing } = await supabaseAdmin
          .from('challenge_completions')
          .select('id')
          .eq('user_id', userId)
          .eq('challenge_id', challengeId)
          .single();

        if (!existing) {
          const { error: insertError } = await supabaseAdmin.from('challenge_completions').insert({
            user_id: userId,
            challenge_id: challengeId,
            score: evaluationResult.score
          });

          if (!insertError) {
              const { data: challengeData } = await supabaseAdmin
                .from('challenges')
                .select('reward_xp')
                .eq('id', challengeId)
                .single();
                
              const rewardXp = challengeData?.reward_xp || 0;

              if (rewardXp > 0) {
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

    return new Response(
      JSON.stringify(evaluationResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    )

  } catch (error) {
    console.error("Evaluation Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    )
  }
})
