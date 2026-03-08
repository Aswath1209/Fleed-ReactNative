import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { useTheme } from '../context/ThemeContext'
import { hp } from '../helpers/common'
import Avatar from './Avatar'
import moment from 'moment'

const NotificationItem = ({
    item,
    router
}) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);

     const createdAt = moment(item?.created_at).format('MMM D')
       
    const handleClick = () => {
        try {
            const parsed = typeof item?.data === 'string' ? JSON.parse(item.data) : (item?.data ?? {});

            if (parsed.postId) {
                router.push({ pathname: 'postDetails', params: { postId: parsed.postId, commentId: parsed.commentId ?? null } });
            } else if (parsed.challengeId) {
                router.push({ pathname: 'challengeDetails', params: { challengeId: parsed.challengeId } });
            } else if (parsed.roomId) {
                router.push({ pathname: 'chatRoom', params: { roomId: parsed.roomId, otherUserId: parsed.senderId } });
            }
        } catch (e) {
            console.log('NotificationItem: failed to parse data', e);
        }
    }
    return (
        <TouchableOpacity style={styles.container} onPress={handleClick}>
            <Avatar
                uri={item?.sender?.image}
                size={hp(5)}
            />
            <View style={styles.nameTitle}>
                <Text style={styles.text}>{
                    item?.sender?.name
                }</Text>
                <Text style={[styles.text,{color:theme.colors.textDark}]}>{
                    item?.title
                }</Text>
            </View>
            <Text style={[styles.text,{color:theme.colors.textLight}]}>{
                    createdAt
                }</Text>
        </TouchableOpacity>
    )
}

export default NotificationItem

const createStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        backgroundColor: theme.colors.surface,
        borderWidth: 0.5,
        borderColor: theme.colors.border,
        padding: 15,
        borderRadius: theme.radius.xxl,
        borderCurve: 'continuous'
    },
    nameTitle: {
        flex: 1,
        gap: 2
    },
    text: {
        fontSize: hp(1.6),
        fontWeight: theme.fonts.medium,
        color: theme.colors.text
    }
})