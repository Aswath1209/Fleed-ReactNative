import { Alert, FlatList, StyleSheet, Text, View } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { fetchMyChats, fetchUnreadCounts } from '../../services/chatServices';
import { supabase } from '../../lib/supabase';
import ScreenWrapper from '../../components/ScreenWrapper';
import ChatListItem from '../../components/ChatListItem';
import { useFocusEffect } from 'expo-router';
import { useAlert } from '../../context/AlertContext';
import { useTheme } from '../../context/ThemeContext';

const ChatList = () => {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [chats, setChats] = useState([]);

  useEffect(() => {
    getChats();

    const channel = supabase
      .channel('chat_list_updates')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          if (payload.new.sender_id !== user.id) {
            setChats(prevChats => {
              return prevChats.map(chat => {
                if (chat.id === payload.new.room_id) {
                  return {
                    ...chat,
                    last_message: payload.new.text,
                    last_updated: payload.new.created_at,
                    unreadCount: (chat.unreadCount || 0) + 1
                  };
                }
                return chat;
              }).sort((a, b) => new Date(b.last_updated) - new Date(a.last_updated));
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    }

  }, [])

  useFocusEffect(
    useCallback(() => {
      getChats();
    }, [])
  );

  const getChats = async () => {
    const res = await fetchMyChats(user.id);
    const countRes = await fetchUnreadCounts(user.id);

    if (res.success) {
      const chatsWithCount = res.data.map(room => ({
        ...room,
        unreadCount: countRes.success ? (countRes.data[room.id] || 0) : 0
      }));
      setChats(chatsWithCount);
    }
    else {
      showAlert("Error", res.msg);
    }
  }

  if (!chats.length) {
    return (
      <ScreenWrapper bg={theme.colors.background}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.colors.text }}>No chats yet</Text>
        </View>
      </ScreenWrapper>
    )
  }
  return (
    <ScreenWrapper bg={theme.colors.background}>
      <FlatList
        data={chats}
        renderItem={({ item }) => (
          <ChatListItem item={item} />
        )}
        keyExtractor={item => item.id.toString()}
      />
    </ScreenWrapper>
  )
}

export default ChatList

const createStyles = (theme) => StyleSheet.create({})