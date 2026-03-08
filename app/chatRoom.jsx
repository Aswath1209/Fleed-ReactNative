import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from '../assets/icons';
import Avatar from '../components/Avatar';
import Header from '../components/Header';
import Input from '../components/input';
import Loading from '../components/Loading';
import ScreenWrapper from '../components/ScreenWrapper';
import VideoCall from '../components/VideoCall';
import { useTheme } from '../context/ThemeContext';
import { useAlert } from '../context/AlertContext';
import { useAuth } from '../context/AuthContext';
import { formatDate, hp, wp } from '../helpers/common';
import { supabase } from '../lib/supabase';
import { deleteMessage, fetchChatHistory, markMessagesAsRead, sendMessage } from '../services/chatServices';
import { sendPushNotification } from '../services/notificationService';
import { getUserData } from '../services/userService';

const ChatRoom = () => {
  const { showAlert } = useAlert();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { roomId, otherUserName, otherUserImage, otherUserId, startCall } = useLocalSearchParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(startCall === 'true');
  const { user } = useAuth();
  const messageRef = useRef(null);
  const router = useRouter();
  const flatListRef = useRef(null);

  useEffect(() => {
    if (startCall === 'true') {
      setShowVideoCall(true);
    }
  }, [startCall]);

  useEffect(() => {
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          console.log('New message received:', payload.new);
          setMessages(prevMessages => [...prevMessages, payload.new]);
        }
      )
      .subscribe();

    // Mark existing messages as read
    markMessagesAsRead(roomId, user.id);

    return () => {
      supabase.removeChannel(channel);
    }
  }, [roomId]);

  const fetchMessages = async () => {
    if (!roomId) return;
    const res = await fetchChatHistory(roomId);
    if (res.success) {
      setMessages(res.data);
    } else {
      showAlert("Error", res.msg);
    }
  }

  const send = async () => {
    if (!text.trim()) return;
    const msg = text;

    setLoading(true);
    let res = await sendMessage(roomId, user.id, otherUserId, msg);
    setLoading(false);
    if (res.success) {
      setText("");
      fetchMessages();
    } else {
      showAlert("Error", res.msg);
    }
  }

  const deleteMsg = async (item) => {
    if (item.sender_id !== user.id) {
      return;
    }
    showAlert("Confirm", "Are you sure,you want to delete?", [
      {
        text: 'Cancel',
        onPress: () => console.log("delete Cancelled"),
        style: 'cancel'
      }, {
        text: "Delete",
        onPress: () => onDelete(item),
        style: 'destructive'
      }

    ])

  }

  const onDelete = async (item) => {
    console.log("Delete Item", item);
    const res = await deleteMessage(item.id);
    if (res.success) {
      fetchMessages();
    } else {
      showAlert("Error", res.msg);
    }
  }

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);


  const renderMessageItem = ({ item }) => {
    const isMyMessage = item.sender_id === user.id;
    return (
      <Pressable style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
      ]} onLongPress={() => deleteMsg(item)}>
        {/* Show avatar for other user's message */}
        {!isMyMessage && (
          <Avatar
            uri={otherUserImage}
            size={hp(4)}
            rounded={theme.radius.sm}
            style={{ marginRight: 8 }}
          />
        )}

        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.otherMessageText
          ]}>
            {item.text}
          </Text>
          <Text style={[
            styles.timeText,
            isMyMessage ? styles.myMessageText : styles.otherTimeText
          ]}>
            {formatDate(item.created_at)}
          </Text>
        </View>
      </Pressable>
    );
  }

  if (showVideoCall) {
    return (
      <VideoCall
        channelName={roomId}
        currentUserId={user?.id}
        onClose={() => setShowVideoCall(false)}
        otherUserName={otherUserName}
        otherUserId={otherUserId}
      />
    )
  }

    const startVideoCall = () => {
    setShowVideoCall(true);
    // Use a unique channel for sending to avoid stale subscriptions
    const callChannel = supabase.channel(`profile:${otherUserId}_call_signal`);
    callChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        try {
          await callChannel.send({
            type: 'broadcast',
            event: 'incoming_call',
            payload: {
              roomId: roomId,
              senderId: user.id,
              senderName: user.name,
              senderImage: user.image
            }
          });
        } catch (error) {
          console.log('Failed to send incoming_call signal', error);
        }

        // Send Push Notification for background ringing
        const { data: receiver } = await getUserData(otherUserId);
        if (receiver && receiver.push_token) {
          const title = "Incoming Video Call";
          const body = `${user.name} is calling you...`;
          const data = { roomId, senderId: user.id, senderName: user.name, senderImage: user.image, isVideoCall: true };
          await sendPushNotification(receiver.push_token, title, body, data);
        }

        // Remove channel after sending signal so it doesn't leak memory and works next time
        supabase.removeChannel(callChannel);
      }
    });
  };

  return (
    <ScreenWrapper bg="white">
      <Header
        title={otherUserName}
        router={router}
        userImage={otherUserImage}
        rightActions={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
            <Pressable onPress={startVideoCall} style={{ padding: 5 }}>
              <Icon name="video" size={hp(3.5)} color={theme.colors.primary} />
            </Pressable>
          </View>
        }
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.listContainer}>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </View>

        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <Input
              inputRef={messageRef}
              containerStyle={styles.input}
              placeholder="Type a message..."
              onChangeText={value => setText(value)}
              value={text}
            />
            {loading ?
              (
                <View style={styles.sendButton}>
                  <Loading size="small" />
                </View>
              ) :
              (
                <Pressable style={styles.sendButton} onPress={send}>
                  <Icon name="send" color={theme.colors.primaryDark} />
                </Pressable>
              )
            }
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  )
}

export default ChatRoom

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  listContainer: {
    flex: 1,
    overflow: 'visible'
  },
  listContent: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(2),
    gap: hp(1.5) // Gap between messages
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 2
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(4),
    borderRadius: 20,
    maxWidth: wp(75),
  },
  myMessageBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 2,
  },
  otherMessageBubble: {
    backgroundColor: theme.colors.surface, // Light gray in light mode, dark surface in dark mode
    borderBottomLeftRadius: 2,
    borderWidth: 0.5,
    borderColor: theme.colors.border
  },
  messageText: {
    fontSize: hp(1.9),
  },
  myMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: theme.colors.text,
  },
  inputWrapper: {
    width: '100%',
    paddingTop: hp(1),
    paddingBottom: hp(2), // Safe area bottom
    paddingHorizontal: wp(4),
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,

  },
  input: {
    flex: 1,
    height: hp(7),
    borderRadius: 25,
    borderWidth: 1,
    borderColor: theme.colors.gray

  },
  sendButton: {
    height: hp(7),
    width: hp(7),
    borderRadius: hp(2.5),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 194, 111, 0.1)' // Primary color with low opacity
  },
  timeText: {
    fontSize: hp(1.3),
    marginTop: 4,
    alignSelf: 'flex-end',
    opacity: 0.8
  },
  myTimeText: {
    color: 'rgba(255,255,255,0.9)'
  },
  otherTimeText: {
    color: theme.colors.textLight
  }
})
