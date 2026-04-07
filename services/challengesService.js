import { supabase } from "../lib/supabase"

export const fetchChallenges=async()=>{
    try{
        const{data,error}=await supabase
        .from('challenges')
        .select('*,communities(name))')
        .order('created_at',{ascending:false});
        if(error){
            return {success:false,msg:'Failed to fetch challenges'};
        }
        return {success:true,data:data};
    }catch(error){
        console.error('Error fetching challenges:',error);
        return {success:false,msg:'Failed to fetch challenges'};
    }
}

export const createChallenge = async (title, description, reward_xp, communitiesId) => {
    try {
        // Find the "General" community ID to associate the challenge with
        let community_id = communitiesId;
        if (!community_id) {
            const { data: communityData } = await supabase
                .from('communities')
                .select('id')
                .eq('name', 'General')
                .single();
            community_id = communityData?.id;
        }

        // Default the deadline to exactly 1 year from now 
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);

        const { data, error } = await supabase
            .from('challenges')
            .insert([
                { 
                    title, 
                    description, 
                    reward_xp,
                    community_id: community_id,
                    deadline: nextYear.toISOString()
                }
            ])
            .select();

        if (error) {
            console.error('Error creating challenge:', error);
            return { success: false, msg: error.message || 'Failed to create challenge' };
        }
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error creating challenge:', error);
        return { success: false, msg: 'An unexpected error occurred' };
    }
}

export const fetchChallengeById=async(challengeId)=>{
    try{
        const{data,error}=await supabase
        .from('challenges')
        .select('*,communities(name))')
        .eq('id',challengeId)
        .single();
        if(error){
            return {success:false,msg:'Failed to fetch the challenge'};
        }
        return {success:true,data:data};
    }catch(error){
        console.error('Error fetching the challenge:',error);
        return {success:false,msg:'Failed to fetch the challenge'};
    }
}

export const submitChallengeCode = async (challengeId, challengeTitle, challengeDescription, code, language, userId) => {
    try {
        const { data, error } = await supabase.functions.invoke('evaluate-code', {
            body: {
                challengeId,
                userId,
                code,
                language,
                challengeTitle,
                challengeDescription
            }
        });

        if (error) {
            console.error("Edge Function Error:", error);
            const errorMessage = error?.message ? String(error.message) : JSON.stringify(error);
            return { success: false, msg: errorMessage || "Failed to contact the evaluation server." }
        }

        // Data should contain our JSON: { passed: boolean, score: number, feedback: string }
        if (data && typeof data.passed === 'boolean') {
            return { success: true, data: data };
        } else {
             const fallbackMsg = data?.error ? (typeof data.error === 'string' ? data.error : JSON.stringify(data.error)) : "Received invalid response from evaluator.";
             return { success: false, msg: fallbackMsg }
        }

    } catch (err) {
        console.error("Submission Error:", err);
        return { success: false, msg: err?.message || "An unexpected error occurred during submission." }
    }
}

export const getLeaderboard = async () => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, name, image, xp')
            .order('xp', { ascending: false })
            .limit(50);

        if (error) {
            return { success: false, msg: 'Failed to fetch leaderboard' };
        }
        return { success: true, data: data };
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return { success: false, msg: 'Failed to fetch leaderboard' };
    }
}

export const fetchCompletedChallengeIds = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('challenge_completions')
            .select('challenge_id')
            .eq('user_id', userId);
        if (error) return { success: false, msg: error.message };
        return { success: true, data: data.map(d => d.challenge_id) };
    } catch (error) {
        return { success: false, msg: 'Error fetching completions' };
    }
}