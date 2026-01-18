import { supabase } from "../lib/supabase";

export const fetchReels = async (limit = 10) => {
    try {
            const {data,error} = await supabase
                .from('posts')
                .select(`
            *,
            user:users(id,name,image),
            postLikes!postLikes_postId_fkey(*),
            comments!comments_postId_fkey(count)
            `)
            .ilike('file', '%postVideos%')
                .order('created_at', { ascending: false })
                .limit(limit);
            
        
        if (error) {
            console.log('fetchReels Error:', error);
            return { success: false, msg: 'Could not fetch posts' }
        }
        return { success: true, data: data };
    } catch (error) {
        return { success: false, msg: 'Could not fetch posts' }

    }
}