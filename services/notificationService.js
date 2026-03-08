import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

export const registerForPushNotificationsAsync = async () => {
    let token;

    if (!Device.isDevice) {
        console.log('Must use physical device for Push Notifications');
        return;
    }

    try {
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('fleed_alerts', {
                name: 'Fleed Alerts',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            alert('Failed to get push token for push notification!');
            return;
        }

        // Get the token
        token = (await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig.extra.eas.projectId,
        })).data;

        console.log("Push Token:", token);
    } catch (error) {
        console.log("Error getting push token:", error);
    }

    return token;
}

export const updatePushToken = async (userId) => {
    try {
        const token = await registerForPushNotificationsAsync();
        if (token) {
            const { error } = await supabase
                .from('users')
                .update({ push_token: token })
                .eq('id', userId);

            if (error) throw error;
            console.log("Push Token Updated in DB");
            return token;
        }
    } catch (error) {
        console.log("Error updating push token:", error);
    }
}

export const sendPushNotification = async (expoPushToken, title, body, data) => {
    const message = {
        to: expoPushToken,
        sound: 'default',
        title,
        body,
        data,
        channelId: 'fleed_alerts', // Explicitly map to our new high-priority channel
    };
    await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
    });
}

export const fetchNotifications = async (receiverId) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select(`
                *,
                sender: senderId(id, name, image)
            `)
            .eq('receiverId', receiverId)
            .order("created_at", { ascending: false });

        if (error) {
            return { success: false, msg: error.message };
        }
        return { success: true, data };
    } catch (error) {
        return { success: false, msg: error.message };
    }
}

export const createNotifications = async (notify) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .insert(notify)
            .select()
            .single();

        if (error) {
            console.log('Error creating notification', error);
            return { success: false, msg: error.message };
        }

        return { success: true, data };
    } catch (error) {
        console.log('Error creating notification', error);
        return { success: false, msg: error.message };
    }
}