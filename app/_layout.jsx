import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect } from 'react'
import { Stack, useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { getUserData } from '../services/userService';

import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  'Supabase: gotrue-js',
  '@supabase/gotrue-js: Lock',
  'Warning: TNodeChildRenderer',
  'Warning: MemorizedTNodeRenderer',
  'Warning: TRenderEngineProvider'
]);

const _layout = () => {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
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
      if (session) {
        setAuth(session?.user);
        updatedUserData(session?.user, session?.user?.email)
        router.replace('/home')
      } else {
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
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false
        }}
      >
        <Stack.Screen
          name='postDetails'
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            gestureEnabled: true
          }}
        />
        <Stack.Screen
          name='feedComment'
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            gestureEnabled: true
          }}
        />
      </Stack>

    </SafeAreaProvider>

  )
}

export default _layout

