import { Alert, StyleSheet, Text, TouchableOpacity, View, FlatList, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { createComment, fetchPostDetails, removePostComment } from '../services/postService'
import { hp, wp } from '../helpers/common'
import { theme } from '../constants/theme'
import { useAuth } from '../context/AuthContext'
import Loading from '../components/Loading'
import Input from '../components/input'
import Icon from '../assets/icons'
import CommentItem from '../components/CommentItem'
import { supabase } from '../lib/supabase'
import { getUserData } from '../services/userService'
import { createNotifications } from '../services/notificationService'
import Header from '../components/Header'
import ScreenWrapper from '../components/ScreenWrapper'

const FeedComment = () => {
    const { postId } = useLocalSearchParams();
    const { user } = useAuth();
    const router = useRouter();
    const [comments, setComments] = useState([]);
    const [startLoading, setStartLoading] = useState(true)
    const [loading, setLoading] = useState(false)
    const inputRef = useRef(null);
    const commentRef = useRef('');
    const [postOwnerId, setPostOwnerId] = useState(null);

    const handleNewComment = async (payload) => {
        if (payload.new) {
            let newComment = { ...payload.new };
            let res = await getUserData(newComment.userId);
            newComment.user = res.success ? res.data : {};
            setComments(prevComments => {
                if (prevComments.find(c => c.id === newComment.id)) {
                    return prevComments;
                }
                return [newComment, ...prevComments]
            })
        }
    }

    useEffect(() => {
        let commentsChannel = supabase
            .channel('comments')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `postId=eq.${postId}` }, handleNewComment)
            .subscribe();

        getPostDetails()
        return () => (
            supabase.removeChannel(commentsChannel)
        )
    }, [])

    const getPostDetails = async () => {
        let res = await fetchPostDetails(postId)
        if (res.success) {
            let sortedComments = res.data.comments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setComments(sortedComments)
            setPostOwnerId(res.data.userId)
        }
        setStartLoading(false)

        if (!res.success) {
            Alert.alert('Error', res.msg)
        }
    }

    const addComment = async () => {
        if (!commentRef.current) return null;
        let data = {
            userId: user?.id,
            postId: postId,
            text: commentRef.current
        }
        setLoading(true)
        let res = await createComment(data);

        setLoading(false);
        if (res.success) {
            if (user.id != postOwnerId) {
                let notify = {
                    senderId: user.id,
                    receiverId: postOwnerId,
                    title: 'Commented On Your Reel',
                    data: JSON.stringify({ postId: postId, commentId: res?.data?.id })
                }
                createNotifications(notify);
            }
            inputRef?.current?.clear()
            commentRef.current = "";
        }
        else {
            Alert.alert("Comment", res.msg)
        }
    }

    const onDeleteComment = async (comment) => {
        let res = await removePostComment(comment?.id)
        if (res.success) {
            setComments(prev => prev.filter(c => c.id !== comment.id));
        } else {
            Alert.alert('Comment', res.msg)
        }
    }

    if (startLoading) {
        return (
            <View style={styles.center}>
                <Loading />
            </View>
        )
    }

    return (
        <ScreenWrapper bg="white">
            <View style={styles.container}>
                <Header title="Comments" router={router} mb={10} />

                <FlatList
                    data={comments}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.list}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => (
                        <CommentItem
                            item={item}
                            canDelete={user.id == item.userId || user.id == postOwnerId}
                            onDelete={onDeleteComment}
                        />
                    )}
                    ListEmptyComponent={
                        <View style={{ marginTop: 50, alignItems: 'center' }}>
                            <Text style={{ color: theme.colors.text }}>No comments yet. Be the first!</Text>
                        </View>
                    }
                />

                <KeyboardAvoidingView behavior={Platform.OS == 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={10}>
                    <View style={styles.inputContainer}>
                        <Input
                            inputRef={inputRef}
                            placeholder="Add a comment..."
                            placeholderTextColor={theme.colors.textLight}
                            containerStyle={{ flex: 1, height: hp(6.2), borderRadius: theme.radius.xl }}
                            onChangeText={value => commentRef.current = value}
                        />
                        {loading ? (
                            <View style={styles.loading}>
                                <Loading size="small" />
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.sendIcon} onPress={addComment}>
                                <Icon name="send" color={theme.colors.primaryDark} />
                            </TouchableOpacity>
                        )}
                    </View>
                </KeyboardAvoidingView>

            </View>
        </ScreenWrapper>
    )
}

export default FeedComment

const styles = StyleSheet.create({
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    container: {
        flex: 1,
        backgroundColor: 'white',
        paddingHorizontal: wp(4),
        paddingBottom: 20
    },
    list: {
        paddingBottom: 20
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingTop: 10,
        backgroundColor: 'white'
    },
    loading: {
        height: hp(5.8),
        width: hp(5.8),
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendIcon: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 0.8,
        borderColor: theme.colors.primary,
        borderRadius: theme.radius.lg,
        borderCurve: 'continuous',
        height: hp(5.8),
        width: hp(5.8),
    }
})
