import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Icon from '../assets/icons'
import CommentItem from '../components/CommentItem'
import Header from '../components/Header'
import Loading from '../components/Loading'
import PostCard from '../components/PostCard'
import Input from '../components/input'
import { useAlert } from '../context/AlertContext'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { hp, wp } from '../helpers/common'
import { supabase } from '../lib/supabase'
import { uploadFile } from '../services/ImageService'
import { createNotifications } from '../services/notificationService'
import { createComment, fetchPostDetails, removePost, removePostComment } from '../services/postService'
import { getUserData } from '../services/userService'


const PostDetails = () => {
    const { postId, commentId } = useLocalSearchParams();
    const { showAlert } = useAlert();
    const { user } = useAuth();
    const router = useRouter();
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const [post, setPost] = useState(null);
    const [startLoading, setStartLoading] = useState(true)
    const [loading, setLoading] = useState(false)
    const inputRef = useRef(null);
    const commentRef = useRef('');
    const bottomSheetRef = useRef(null);
    const snapPoints = ['90%'];

    const handleNewComment = async (payload) => {
        console.log('got New Comment', payload)

        if (payload.new) {
            let newComment = { ...payload.new };
            let res = await getUserData(newComment.userId);
            newComment.user = res.success ? res.data : {};
            setPost(prevPost => {
                // Deduplicate: Check if comment already exists in state
                if (prevPost.comments.find(c => c.id === newComment.id)) {
                    console.log('Comment already exists, skipping realtime update');
                    return prevPost;
                }
                return {
                    ...prevPost,
                    comments: [newComment, ...prevPost.comments]
                }
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
        if (!startLoading && post) {
            // Slight delay to ensure the BottomSheetModal is mounted after loading state changes
            setTimeout(() => {
                bottomSheetRef.current?.present();
            }, 50);
        }
    }, [startLoading, post])



    const getPostDetails = async () => {
        console.log('getPostDetails: fetching id:', postId);
        if (postId) {
            let res = await fetchPostDetails(postId)

            console.log('getPostDetails: result:', res);
            if (res.success) {
                res.data.comments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                setPost(res.data)
            }
            setStartLoading(false)

            if (!res.success) {
                showAlert('Post', res.msg)
            }
        }
    }

    console.log("Fetched Post Details", post)

    const addComment = async () => {
        console.log("add Comment Pressed");
        if (!commentRef.current) return null;

        setLoading(true)

        let data = {
            userId: user?.id,
            postId: post?.id,
            text: commentRef.current,
        }
        let res = await createComment(data);

        setLoading(false);
        if (res.success) {
            let newComment = { ...res.data, user: user };
            setPost(prevPost => {
                return {
                    ...prevPost,
                    comments: [newComment, ...prevPost.comments]
                }
            })
            if (user.id != post.userId) {
                let notify = {
                    senderId: user.id,
                    receiverId: post.userId,
                    title: 'Commented On Your Post',
                    data: JSON.stringify({ postId: post.id, commentId: res?.data?.id })
                }
                console.log('Sending Notification:', notify);
                let notifRes = await createNotifications(notify);
                console.log('Notification Result:', notifRes);
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
            setPost(prevPost => {
                let updatedPost = { ...prevPost };
                updatedPost.comments = updatedPost.comments.filter(c => c.id !== comment.id);
                return updatedPost;
            }
            )
        } else {
            showAlert('Comment', res.msg)
        }
    }

    const onDeletePost = async (item) => {
        let res = await removePost(item?.id)
        if (res.success) {
            router.back();
        } else {
            showAlert('Post', res.msg)
        }

    }
    const onEditPost = async (item) => {
        router.back();
        router.push({ pathname: 'newPost', params: { ...item } });
    }

    if (startLoading) {
        return (
            <View style={styles.center}>
                <Loading />
            </View>

        )
    }

    if (!post) {
        return (
            <View style={[styles.center, { justifyContent: 'flex-start', marginTop: 100 }]}>
                <Text style={styles.notFound}>Post Not Found:(</Text>

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
                <View style={[styles.container, { paddingTop: 10 }]}>
                    <Header title="Post Details" router={router} mb={10} showBackButton={false} />
                    <BottomSheetScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
                        <PostCard
                            item={{ ...post, comments: [{ count: post?.comments?.length }] }}
                            currentUser={user}
                            router={router}
                            hasShadow={false}
                            showMoreIcon={false}
                            showDelete={true}
                            onDelete={onDeletePost}
                            onEdit={onEditPost}
                        />
                        <View style={styles.inputContainer}>
                            <Input
                                inputRef={inputRef}
                                placeholder="Write A Comment..."
                                placeholderTextColor={theme.colors.textLight}
                                containerStyle={{ flex: 1, height: hp(6.2), borderRadius: theme.radius.xl }}
                                onChangeText={value => commentRef.current = value}
                            />
                            {loading ?
                                (
                                    <View style={styles.loading}>
                                        <Loading size="small" />
                                    </View>
                                ) :
                                (
                                    <TouchableOpacity style={styles.sendIcon} onPress={addComment}>
                                        <Icon name="send" color={theme.colors.primaryDark} />
                                    </TouchableOpacity>
                                )
                            }

                        </View>
                        <View style={{ marginVertical: 15, gap: 17 }}>
                            {
                                post?.comments?.map(comment =>
                                    <CommentItem
                                        key={comment?.id?.toString()}
                                        item={comment}
                                        highlight={comment.id == commentId}
                                        canDelete={user.id == comment.userId || user.id == post.userId}
                                        onDelete={onDeleteComment}
                                    />
                                )
                            }

                            {
                                post?.comments?.length == 0 && (
                                    <Text style={{ color: theme.colors.text, marginLeft: 5 }}>
                                        Be First To Comment!
                                    </Text>
                                )
                            }
                        </View>
                    </BottomSheetScrollView>
                </View>
            </BottomSheetModal>
        </View>
    )
}

export default PostDetails

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
    loading: {
        height: hp(5.8),
        width: hp(5.8),
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ scale: 1.3 }]
    },
    notFound: {
        fontSize: hp(2.5),
        color: theme.colors.text,
        fontWeight: theme.fonts.medium,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
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
    list: {
        paddingHorizontal: wp(4)
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    container: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        paddingHorizontal: wp(7)
    }
})