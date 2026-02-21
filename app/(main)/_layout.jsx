import { Tabs } from 'expo-router';
import Icon from '../../assets/icons';
import { theme } from '../../constants/theme';
import { StyleSheet, View } from 'react-native';
import { updatePushToken } from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MainLayout() {
    const { user } = useAuth();
    const withInsets = useSafeAreaInsets();

    useEffect(() => {
        if (user) {
            updatePushToken(user.id);
        }
    }, [user])

    return (
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
