import { supabase } from "../lib/supabase";
import { uploadFile } from "./ImageService";

export const createOrUpdatePost = async (post) => {
    try {
        if (post.file && typeof post.file == 'object') {
            let isImage = post?.file?.type == 'image';
            let folderName = isImage ? 'postImages' : 'postVideos';
            let fileResult = await uploadFile(folderName, post?.file?.uri, isImage)
            if (fileResult.success) post.file = fileResult.data;
            else {
                return fileResult;
            }



        }


        const { data, error } = await supabase
            .from('posts')
            .upsert(post)
            .select()
            .single();

        if (error) {
            return { success: false, msg: 'Could not Create your post' }
        }
        return { success: true, data: data };
    } catch (error) {
        return { success: false, msg: 'Could not Create your post' }

    }
}
export const fetchPost = async (limit = 10, userId) => {
    try {
        let data, error;
        if (userId) {
            const response = await supabase
                .from('posts')
                .select(`
            *,
            user:users(id,name,image),
            postLikes!postLikes_postId_fkey(*),
            comments!comments_postId_fkey(count)
            `)
                .order('created_at', { ascending: false })
                .eq('userId', userId)
                .limit(limit);
            data = response.data;
            error = response.error;

        } else {
            const response = await supabase
                .from('posts')
                .select(`
            *,
            user:users(id,name,image),
            postLikes!postLikes_postId_fkey(*),
            comments!comments_postId_fkey(count)
            `)
                .order('created_at', { ascending: false })
                .limit(limit);
            data = response.data;
            error = response.error;
        }




        if (error) {
            console.log('fetchPost Error:', error);
            return { success: false, msg: 'Could not fetch posts' }
        }
        return { success: true, data: data };
    } catch (error) {
        return { success: false, msg: 'Could not fetch posts' }

    }
}


export const createPostLike = async (postLike) => {
    try {
        const { data, error } = await supabase
            .from('postLikes')
            .insert(postLike)
            .select()
            .single();


        if (error) {
            return { success: false, msg: 'Could not like the post' }
        }
        return { success: true, data: data };
    } catch (error) {
        return { success: false, msg: 'Could not like the post' }

    }
}

export const removePostLike = async (postId, userId) => {
    try {
        const { error } = await supabase
            .from('postLikes')
            .delete()
            .eq('userId', userId)
            .eq('postId', postId)



        if (error) {
            return { success: false, msg: 'Could not remove the like' }
        }
        return { success: true };
    } catch (error) {
        return { success: false, msg: 'Could not remove the like' }

    }
}

export const fetchPostDetails = async (postId) => {
    try {
        const { data, error } = await supabase
            .from('posts')
            .select(`
            *,
            user:users(id,name,image),
            postLikes!postLikes_postId_fkey(*),
            comments!comments_postId_fkey(*,user:users(id,name,image))
            `)
            .eq('id', postId)
            .single();



        if (error) {
            console.log('fetch Post Details Error', error)
            return { success: false, msg: 'Could not fetch post details' }
        }
        return { success: true, data: data };
    } catch (error) {
        console.log('fetch Post Details Error', error)
        return { success: false, msg: 'Could not fetch post details' }

    }
}

export const createComment = async (commentData) => {
    try {
        const { data, error } = await supabase
            .from('comments')
            .insert(commentData)
            .select()
            .single();


        if (error) {
            console.log('Comment Error', error)
            return { success: false, msg: 'Could not make your comment' }
        }
        return { success: true, data: data };
    } catch (error) {
        return { success: false, msg: 'Could not make your comment' }

    }
}

export const removePostComment = async (commentId) => {
    try {
        const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', commentId)



        if (error) {
            console.log('Remove Comment Error', error)
            return { success: false, msg: 'Could not remove the comment' }
        }
        return { success: true, data: { commentId } };
    } catch (error) {
        console.log('Remove Comment Error', error)
        return { success: false, msg: 'Could not remove the comment' }

    }
}

export const removePost = async (postId) => {
    try {
        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId)



        if (error) {
            console.log('Remove Post Error', error)
            return { success: false, msg: 'Could not remove your post' }
        }
        return { success: true, data: { postId } };
    } catch (error) {
        console.log('Remove Comment Error', error)
        return { success: false, msg: 'Could not remove your post' }

    }
}