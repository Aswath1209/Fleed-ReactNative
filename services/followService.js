import { supabase } from "../lib/supabase";


export const followUser = async (followData) => {
    try {
        const { data, error } = await supabase
            .from('follows')
            .insert(followData)
            .select()
            .single();


        if (error) {
            return { success: false, msg: 'Could not Follow The User' };
        }
        return { success: true, data: data };
    } catch (error) {
        return { success: false, msg: 'Could not Follow The User' };

    }
}


export const unfollowUser = async (followerId, followingId) => {
    try {
        const { error } = await supabase
            .from('follows')
            .delete()
            .eq('follower_id', followerId)
            .eq('following_id', followingId)



        if (error) {
            return { success: false, msg: 'Could not unfollow the user' };
        }
        return { success: true };
    } catch (error) {
        return { success: false, msg: 'Could not unfollow the user' };

    }
}

export const fetchFollowStatus = async (followerId, followingId) => {
    try {
        const { data, error } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', followerId)
            .eq('following_id', followingId)
            .single();

        if (error && error.code !== 'PGRST116') {
            return { success: false, msg: 'Could not check follow status' };
        }

        return { success: true, data: data };
    } catch (error) {
        return { success: false, msg: 'Could not check follow status' };
    }
}

export const fetchFollowCounts = async (userId) => {
    try {
        const { count: followersCount, error: followersError } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', userId);

        const { count: followingCount, error: followingError } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', userId);

        if (followersError || followingError) {
            return { success: false, msg: 'Could not fetch counts' };
        }

        return { success: true, data: { followers: followersCount, following: followingCount } };

    } catch (error) {
        return { success: false, msg: 'Could not fetch counts' };
    }
}