
import { supabase } from "../lib/supabase";
import { getUserData } from "./userService";
import { sendPushNotification } from "./notificationService";

export const createOrGetRoom = async (userId1, userId2) => {
    try {
        // Check for existing room with (user_id_1, user_id_2)
        const { data: room1, error: error1 } = await supabase
            .from('rooms')
            .select('*')
            .eq('user_id_1', userId1)
            .eq('user_id_2', userId2)
            .maybeSingle();

        if (room1) {
            return { success: true, data: room1 };
        }

        // Check for existing room with flipped IDs (user_id_2, user_id_1)
        const { data: room2, error: error2 } = await supabase
            .from('rooms')
            .select('*')
            .eq('user_id_1', userId2)
            .eq('user_id_2', userId1)
            .maybeSingle();

        if (room2) {
            return { success: true, data: room2 };
        }

        // If no room exists, create a new one
        const { data: newRoom, error: createError } = await supabase
            .from('rooms')
            .insert([
                { user_id_1: userId1, user_id_2: userId2, created_at: new Date() }
            ])
            .select()
            .single();

        if (createError) {
            return { success: false, msg: createError.message };
        }

        return { success: true, data: newRoom };
    } catch (error) {
        return { success: false, msg: error.message };
    }
}

export const sendMessage = async (roomId, senderId, receiverId, text) => {
    try {
        const { data, error } = await supabase
            .from('messages')
            .insert([{ room_id: roomId, sender_id: senderId, text: text }])
            .select()
            .single();

        if (error) {
            return { success: false, msg: error.message };
        }

        // Update the room with the last message
        const { error: roomError } = await supabase
            .from('rooms')
            .update({ last_message: text, last_updated: new Date() })
            .eq('id', roomId);

        if (roomError) {
            console.log(roomError);
            return { success: false, msg: roomError.message };
        }

        // Send Push Notification
        if (receiverId) {
            const { data: receiver } = await getUserData(receiverId);
            if (receiver && receiver.push_token) {
                const { data: sender } = await getUserData(senderId);
                const title = sender ? sender.name : "New Message";
                const body = text;
                const data = { roomId, senderId, senderName: sender?.name, senderImage: sender?.image }; // Payload for navigation
                await sendPushNotification(receiver.push_token, title, body, data);
            }
        }


        return { success: true, data };
    } catch (error) {
        return { success: false, msg: error.message };
    }
}

export const fetchChatHistory = async (roomId) => {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('room_id', roomId)
            .order('created_at', { ascending: true });

        if (error) {
            return { success: false, msg: error.message };
        }
        return { success: true, data };
    } catch (error) {
        return { success: false, msg: error.message };
    }
}

export const fetchMyChats = async (userId) => {
    try {
        const { data: rooms, error } = await supabase
            .from('rooms')
            .select(`
                *,
                user1:users!user_id_1(*),
                user2:users!user_id_2(*)
            `)
            .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
            .order('last_updated', { ascending: false });

        if (error) {
            return { success: false, msg: error.message };
        }

        // ... existing code ...
        return { success: true, data: rooms };
    } catch (error) {
        return { success: false, msg: error.message };
    }
}

export const markMessagesAsRead = async (roomId, userId) => {
    try {
        const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('room_id', roomId)
            .neq('sender_id', userId)
            .eq('is_read', false);

        if (error) {
            return { success: false, msg: error.message };
        }
        return { success: true };
    } catch (error) {
        return { success: false, msg: error.message };
    }
}

export const fetchUnreadCounts = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('room_id')
            .eq('is_read', false)
            .neq('sender_id', userId);

        if (error) {
            return { success: false, msg: error.message };
        }

        // Aggregate counts by roomId
        const counts = {};
        data.forEach(msg => {
            counts[msg.room_id] = (counts[msg.room_id] || 0) + 1;
        });

        return { success: true, data: counts };
    } catch (error) {
        return { success: false, msg: error.message };
    }
}

export const deleteMessage = async (messageId) => {
    try {
        const { error } = await supabase
            .from('messages')
            .delete()
            .eq('id', messageId)



        if (error) {
            console.log("Delete Message Error", error)
            return { success: false, msg: 'Could not delete the message' }
        }
        return { success: true };
    } catch (error) {
        console.log("Delete Message Error", error)
        return { success: false, msg: 'Could not delete the message' }

    }
}