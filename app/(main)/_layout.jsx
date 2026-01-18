import { Tabs } from 'expo-router';
import Icon from '../../assets/icons';
import { theme } from '../../constants/theme';
import { StyleSheet } from 'react-native';

export default function MainLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: styles.tabBar,
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
                }}
            />

            <Tabs.Screen
                name="feed"
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="video" color={color} size={size} />
                    ),
                }}
            />

            <Tabs.Screen
                name="newPost"
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="plus" color={color} size={size * 1.2} strokeWidth={3} />
                    ),
                    href: null, // Hide from tab bar
                }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="user" color={color} size={size} />
                    ),
                    href: null, // Hide from tab bar
                }}
            />

            {/* Hide other screens from the tab bar but keep them in the stack/tab context */}
            <Tabs.Screen name="editProfile" options={{ href: null }} />
            <Tabs.Screen name="notifications" options={{ href: null }} />

        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray,
        height: 60,
        paddingBottom: 10,
        paddingTop: 10
    }
});
