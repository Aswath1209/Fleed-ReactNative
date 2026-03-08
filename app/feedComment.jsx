import { BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Icon from '../assets/icons'
import CommentItem from '../components/CommentItem'
import Header from '../components/Header'
import Loading from '../components/Loading'
import Input from '../components/input'
import { useAlert } from '../context/AlertContext'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { hp, wp } from '../helpers/common'
import { supabase } from '../lib/supabase'
import { uploadFile } from '../services/ImageService'
import { createNotifications } from '../services/notificationService'
import { createComment, fetchPostDetails, removePostComment } from '../services/postService'
import { getUserData } from '../services/userService'

const FeedComment = () => {
    const { postId } = useLocalSearchParams();
    const { user } = useAuth();
    const { showAlert } = useAlert();
    const router = useRouter();
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const [comments, setComments] = useState([]);
    const [startLoading, setStartLoading] = useState(true)
    const [loading, setLoading] = useState(false)
    const inputRef = useRef(null);
    const commentRef = useRef('');
    const bottomSheetRef = useRef(null);
    const snapPoints = ['85%'];
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

    useEffect(() => {
        if (!startLoading) {
            setTimeout(() => {
                bottomSheetRef.current?.present();
            }, 50);
        }
    }, [startLoading])

    const getPostDetails = async () => {
        let res = await fetchPostDetails(postId)
        if (res.success) {
            let sortedComments = res.data.comments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setComments(sortedComments)
            setPostOwnerId(res.data.userId)
        }
        setStartLoading(false)

        if (!res.success) {
            showAlert('Error', res.msg)
        }
    }

    const addComment = async () => {
        if (!commentRef.current) return null;

        setLoading(true)

        let data = {
            userId: user?.id,
            postId: postId,
            text: commentRef.current
        }
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
            showAlert("Comment", res.msg)
        }
    }

    const onDeleteComment = async (comment) => {
        let res = await removePostComment(comment?.id)
        if (res.success) {
            setComments(prev => prev.filter(c => c.id !== comment.id));
        } else {
            showAlert('Comment', res.msg)
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
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            <BottomSheetModal
                ref={bottomSheetRef}
                index={0}
                snapPoints={snapPoints}
                onDismiss={() => router.back()}
                enablePanDownToClose={true}
                enableDynamicSizing={false}
                backgroundStyle={{ borderRadius: 30, backgroundColor: theme.colors.surface }}
                handleIndicatorStyle={styles.dragHandle}
            >
                <View style={styles.container}>
                    <Header title="Comments" router={router} mb={10} showBackButton={false} />

                    <BottomSheetFlatList
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
            </BottomSheetModal>
        </View>
    )
}

export default FeedComment

const createStyles = (theme) => StyleSheet.create({
    dragHandleContainer: {
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: 5,
    },
    dragHandle: {
        width: 40,
        height: 5,
        backgroundColor: theme.colors.darkLight,
        borderRadius: 5,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    container: {
        flex: 1,
        backgroundColor: theme.colors.surface,
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
        backgroundColor: theme.colors.surface
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
    },
})
