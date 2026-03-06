import { Tabs, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../../assets/icons';
import IncomingCallModal from '../../components/IncomingCallModal';
import { theme } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { updatePushToken } from '../../services/notificationService';

export default function MainLayout() {
    const { user } = useAuth();
    const withInsets = useSafeAreaInsets();
    const [incomingCall, setIncomingCall] = useState(null);
    const router = useRouter();

    useEffect(() => {
        if (user) {
            updatePushToken(user.id);

            // Listen for incoming calls
            const channel = supabase.channel(`profile:${user.id}_call_signal`)
                .on('broadcast', { event: 'incoming_call' }, (payload) => {
                    console.log('Incoming call received!', payload);
                    if (payload.payload) {
                        setIncomingCall(payload.payload);
                    }
                })
                .on('broadcast', { event: 'call_cancelled' }, (payload) => {
                    console.log('Call cancelled by caller', payload);
                    setIncomingCall(null);
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            }
        }
    }, [user])

    const handleAcceptCall = (callData) => {
        setIncomingCall(null);
        router.push({
            pathname: '/chatRoom',
            params: {
                roomId: callData.roomId,
                otherUserId: callData.senderId,
                otherUserName: callData.senderName,
                otherUserImage: callData.senderImage,
                startCall: 'true'
            }
        });
    };

    const handleDeclineCall = () => {
        if (incomingCall) {
            // Tell the caller we declined
            const channel = supabase.channel(`profile:${incomingCall.senderId}_call_signal`);
            channel.subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    try {
                        await channel.send({
                            type: 'broadcast',
                            event: 'call_declined',
                            payload: { roomId: incomingCall.roomId }
                        });
                    } catch (error) {
                        console.log('Failed to send call_declined signal', error);
                    }
                    supabase.removeChannel(channel);
                }
            });
        }
        setIncomingCall(null);
    };

    return (
        <>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarShowLabel: false,
                    tabBarStyle: [
                        styles.tabBar,
                        {
                            height: 60 + withInsets.bottom,
                            paddingBottom: withInsets.bottom + 5,
                            paddingTop: 10
                        }
                    ],
                    tabBarActiveTintColor: theme.colors.primary,
                    tabBarInactiveTintColor: theme.colors.textLight,
                }}
            >
                <Tabs.Screen
                    name="home"
                    options={{
                        tabBarIcon: ({ color, size }) => (
                            <Icon name="home" color={color} size={size} />
                        ),
                        title: 'Home'
                    }}
                />
                <Tabs.Screen
                    name="search"
                    options={{
                        tabBarIcon: ({ color, size }) => (
                            <Icon name="search" color={color} size={size} />
                        ),
                        title: 'Search'
                    }}
                />

                <Tabs.Screen
                    name="newPost"
                    options={{
                        tabBarIcon: ({ color, size }) => (
                            <View style={styles.addPostButton}>
                                <Icon name="plus" color={'white'} size={size * 0.8} strokeWidth={3} />
                            </View>
                        ),
                        href: null,
                    }}
                />

                <Tabs.Screen
                    name="feed"
                    options={{
                        tabBarIcon: ({ color, size }) => (
                            <Icon name="video" color={color} size={size} />
                        ),
                        title: 'Feed'
                    }}
                />


                <Tabs.Screen
                    name="chatList"
                    options={{
                        tabBarIcon: ({ color, size }) => (
                            <Icon name="comment" color={color} size={size} />
                        ),
                        title: 'Chat'
                    }}
                />

                <Tabs.Screen
                    name="profile"
                    options={{
                        tabBarIcon: ({ color, size }) => (
                            <Icon name="user" color={color} size={size} />
                        ),
                        title: 'Profile',
                        href: null

                    }}
                />

                <Tabs.Screen
                    name="chatRoom"
                    options={{
                        href: null,
                        tabBarStyle: { display: 'none' } // Hide tab bar in chat room usually
                    }}
                />

                {/* Hide other screens from the tab bar but keep them in the stack/tab context */}
                <Tabs.Screen name="editProfile" options={{ href: null }} />
                <Tabs.Screen name="notifications" options={{ href: null }} />
                <Tabs.Screen name="postDetails" options={{ href: null }} />
                <Tabs.Screen name="feedComment" options={{ href: null }} />


            </Tabs>
            <IncomingCallModal
                incomingCall={incomingCall}
                onAccept={handleAcceptCall}
                onDecline={handleDeclineCall}
            />
        </>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray,
        // Height and padding are now dynamic
    },
    addPostButton: {
        backgroundColor: theme.colors.primary,
        padding: 6,
        borderRadius: 30,
    }
});
