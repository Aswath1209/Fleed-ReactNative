import { Pressable, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Avatar from './Avatar';
import { useRouter } from 'expo-router';
import { createOrGetRoom } from '../services/chatServices';
import { hp, wp, formatDate } from '../helpers/common'; // Import formatDate
import { useTheme } from '../context/ThemeContext';
import { TouchableOpacity } from 'react-native';

const ChatListItem = ({ item }) => {
    const { user } = useAuth();
    const router = useRouter();
    const { theme } = useTheme();
    const styles = createStyles(theme);

    const otherUser = item.user_id_1 === user.id ? item.user2 : item.user1;
    const hasUnread = item.unreadCount > 0;

    const openChatRoom = async () => {
        if (item) {
            router.push({ pathname: '/chatRoom', params: { roomId: item.id, otherUserName: otherUser.name, otherUserImage: otherUser.image, otherUserId: otherUser.id } });
        }
    }

    const renderTime = (timestamp) => {
        return formatDate(timestamp);
    }

    const renderLastMessage = () => {
        return item.last_message || "Start a conversation";
    }

    return (
        <TouchableOpacity onPress={openChatRoom} style={styles.container}>
            <Avatar uri={otherUser.image} size={hp(6)} />
            <View style={styles.content}>
                <View style={styles.row}>
                    <Text style={styles.name}>{otherUser?.name}</Text>
                    <Text style={styles.time}>{renderTime(item.last_updated)}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={[styles.lastMessage, { color: hasUnread ? theme.colors.text : theme.colors.textLight, fontWeight: hasUnread ? '600' : 'normal' }]}>
                        {renderLastMessage()}
                    </Text>
                    {item.unreadCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{item.unreadCount}</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    )
}

export default ChatListItem

const createStyles = (theme) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 0.5,
        borderBottomColor: theme.colors.border
    },
    content: {
        flex: 1,
        marginLeft: 10,
        gap: 5
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    name: {
        fontSize: hp(1.8),
        fontWeight: '600',
        color: theme.colors.text
    },
    time: {
        fontSize: hp(1.6),
        color: theme.colors.textLight
    },
    lastMessage: {
        fontSize: hp(1.6),
        flex: 1
    },
    badge: {
        backgroundColor: theme.colors.primary,
        borderRadius: 20,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: 5,
        minWidth: 20,
        alignItems: 'center',
        justifyContent: 'center'
    },
    badgeText: {
        color: 'white',
        fontSize: hp(1.4),
        fontWeight: 'bold'
    }
})