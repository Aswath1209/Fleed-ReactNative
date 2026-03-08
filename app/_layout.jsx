import "react-native-gesture-handler";
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider } from '../context/AlertContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext'; // Import ThemeProvider
import { supabase } from '../lib/supabase';
import { getUserData } from '../services/userService';

import * as Notifications from 'expo-notifications';
import { LogBox, useColorScheme } from 'react-native';

LogBox.ignoreLogs([
  'Supabase: gotrue-js',
  '@supabase/gotrue-js: Lock',
  'Warning: TNodeChildRenderer',
  'Warning: MemorizedTNodeRenderer',
  'Warning: TRenderEngineProvider'
]);

// Instructs Expo how to handle incoming notifications when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const _layout = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AlertProvider>
          <MainLayout />
        </AlertProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

const MainLayout = () => {

  const { setAuth, setUserData } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const checkConnection = async () => {
      console.log('Checking Supabase connection...');
      const { data, error } = await supabase.from('users').select('*').limit(1);
      if (error) {
        console.error('Supabase connection error:', error);
      } else {
        console.log('Supabase connection successful. Data:', data);
      }
    };
    checkConnection();
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Prevent routing to home if they haven't verified OTP yet
      if (session && session.user?.email_confirmed_at) {
        setAuth(session?.user);
        updatedUserData(session?.user, session?.user?.email)
        router.replace('/home')
      } else if (!session) {
        setAuth(null)
        router.replace('/welcome')
      }
    })
    return () => subscription.unsubscribe();
  }, []);

  const updatedUserData = async (user, email) => {
    let res = await getUserData(user?.id);
    if (res.success) {
      setUserData({ ...res.data, email })
    }
  }

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('Notification tapped, data:', data);

      // Chat room / video call notification
      if (data?.roomId) {
        router.push({
          pathname: '/chatRoom',
          params: {
            roomId: data.roomId,
            otherUserId: data.senderId,
            otherUserName: data.senderName,
            otherUserImage: data.senderImage,
            startCall: data.isVideoCall ? 'true' : undefined
          }
        });
        return;
      }

      // Comment or like notification — navigate to post
      if (data?.postId) {
        try {
          const parsed = typeof data === 'string' ? JSON.parse(data) : data;
          router.push({
            pathname: '/postDetails',
            params: {
              postId: parsed.postId,
              commentId: parsed.commentId ?? null
            }
          });
        } catch (e) {
          console.log('Failed to parse notification data:', e);
        }
        return;
      }

      // Challenge notification
      if (data?.challengeId) {
        router.push({
          pathname: '/challengeDetails',
          params: { challengeId: data.challengeId }
        });
        return;
      }
    });
    return () => subscription.remove();
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <Stack
            screenOptions={{
              headerShown: false
            }}
          >
            <Stack.Screen
              name='postDetails'
              options={{
                presentation: 'transparentModal',
                animation: 'fade',
                gestureEnabled: false
              }}
            />
            <Stack.Screen
              name='feedComment'
              options={{
                presentation: 'transparentModal',
                animation: 'fade',
                gestureEnabled: false
              }}
            />
          </Stack>
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

export default _layout

