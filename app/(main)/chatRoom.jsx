import { Alert, FlatList, KeyboardAvoidingView, Pressable, StyleSheet, Text, View, Platform } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { fetchChatHistory, sendMessage, markMessagesAsRead, deleteMessage } from '../../services/chatServices';
import { supabase } from '../../lib/supabase';
import ScreenWrapper from '../../components/ScreenWrapper';
import Header from '../../components/Header';
import Input from '../../components/input';
import Icon from '../../assets/icons';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/Avatar';
import { hp, wp, formatDate } from '../../helpers/common';
import { theme } from '../../constants/theme';
import Loading from '../../components/Loading';
import { useAlert } from '../../context/AlertContext';

const ChatRoom = () => {
  const { showAlert } = useAlert();
  const { roomId, otherUserName, otherUserImage, otherUserId } = useLocalSearchParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const messageRef = useRef(null);
  const router = useRouter();
  const flatListRef = useRef(null);

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
    if(item.sender_id !== user.id){
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
      ]} onLongPress={()=>deleteMsg(item)}>
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

  return (
    <ScreenWrapper bg="white">
      <Header title={otherUserName} router={router} userImage={otherUserImage} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
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
    backgroundColor: '#f1f5f9', // Light gray 
    borderBottomLeftRadius: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.05)'
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
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)'
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