import { FlatList, RefreshControl,Pressable, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import ScreenWrapper from '../../components/ScreenWrapper'
import { hp, wp } from '../../helpers/common'
import { theme } from '../../constants/theme'
import Icon from '../../assets/icons'
import { useRouter } from 'expo-router'
import Avatar from '../../components/Avatar'
import { useAuth } from '../../context/AuthContext'
import { fetchPost } from '../../services/postService'
import PostCard from '../../components/PostCard'
import Loading from '../../components/Loading'
import { supabase } from '../../lib/supabase'
import { getUserData } from '../../services/userService'

var limit = 0;

const Home = () => {
    const { user, setAuth } = useAuth()
    const router = useRouter();
    const [post, setPost] = useState([])
    const [hasMore, setHasMore] = useState(true)
    const [refreshing, setRefreshing] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0)

    const handlePostEvent = async (payload) => {
        if (payload.eventType == 'INSERT' && payload?.new?.id) {
            let newPost = { ...payload.new }
            let res = await getUserData(newPost.userId)
            newPost.postLikes = [];
            newPost.comments = [{ count: 0 }]

            newPost.user = res.success ? res.data : {};
            setPost(prevPost => [newPost, ...prevPost]);
        }
        if (payload.eventType == 'DELETE' && payload.old.id) {
            setPost(prevPosts => {
                let updatedPosts = prevPosts.filter(post => post.id != payload.old.id)
                return updatedPosts
            })
        }
        if (payload.eventType == 'UPDATE' && payload?.new?.id) {
            setPost(prevPosts => {
                let updatedPosts = prevPosts.map(post => {
                    if (post.id == payload.new.id) {
                        post.body = payload.new.body;
                        post.file = payload.new.file;
                    }
                    return post;
                })
                return updatedPosts;
            })
        }
    }

    const handleNotificationEvent = async (payload) => {
        if (payload.eventType == 'INSERT' && payload.new.id) {
            setNotificationCount(prev => prev + 1)
        }
    }
    useEffect(() => {
        if (!user) return;

        // Reset limit and fetch posts
        limit = 0;
        getPosts();

        let postChannel = supabase
            .channel('posts')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, handlePostEvent)
            .subscribe();

        let notificationChannel = supabase
            .channel('notifications')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `receiverId=eq.${user.id}` }, handleNotificationEvent)

            .subscribe();
        return () => {
            supabase.removeChannel(postChannel);
            supabase.removeChannel(notificationChannel);
        }
    }, [user])


const onRefresh = async() => {
    setRefreshing(true);
    limit=0;
    setHasMore(true);
    await getPosts();
    setRefreshing(false);
}


    const [isFetching, setIsFetching] = useState(false);

    const getPosts = async () => {
        if (!hasMore || isFetching) return null;
        setIsFetching(true);
        try {
            limit = limit + 10;
            let res = await fetchPost(limit);
            if (res.success) {
                if (post.length == res.data.length) {
                    setHasMore(false)
                }
                setPost(res.data)
            }
        } finally {
            setIsFetching(false);
        }
    }

    console.log("Got Posts", post)

    return (
        <ScreenWrapper bg="white">
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Fleed</Text>
                    <View style={styles.icons}>
                        <Pressable onPress={() => {
                            setNotificationCount(0)
                            router.push('notifications')
                        }}>
                            <Icon name="heart" size={hp(3.2)} strokeWidth={2} color={theme.colors.text} />
                            {
                                notificationCount > 0 &&
                                <View style={styles.pill}>
                                    <Text style={styles.pillText}>{notificationCount}</Text>
                                </View>
                            }
                        </Pressable>
                        <Pressable onPress={() => router.push('newPost')}>
                            <Icon name="plus" size={hp(3.2)} strokeWidth={2} color={theme.colors.text} />
                        </Pressable>
                        <Pressable onPress={() => router.push('profile')}>
                            <Avatar
                                uri={user?.image}
                                size={hp(4.3)}
                                rounded={theme.radius.sm}
                                style={{ borderWidth: 2 }}
                            />
                        </Pressable>

                    </View>
                </View>
                <FlatList
                    data={post}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listStyle}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => <PostCard
                        item={item}
                        currentUser={user}
                        router={router}

                    />}
                    onEndReached={() => {
                        getPosts();
                    }}
                    onEndReachedThreshold={0}
                    ListEmptyComponent={!hasMore && (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 }}>
                            <Text style={styles.noPosts}>No Posts Yet</Text>
                        </View>
                    )}
                    ListFooterComponent={hasMore ? (
                        <View style={{ marginVertical: 30 }}>
                            <Loading />
                        </View>) : (
                        <View style={{ marginVertical: 30 }}>
                            <Text style={styles.noPosts}>No More Posts Available</Text>
                        </View>

                    )}
                />

            </View>

        </ScreenWrapper>

    )
}

export default Home

const styles = StyleSheet.create({
    pillText: {
        color: 'white',
        fontSize: hp(1.2),
        fontWeight: theme.fonts.bold
    },
    pill: {
        position: 'absolute',
        right: -10,
        top: -4,
        height: hp(2.2),
        width: hp(2.2),
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: theme.colors.roseLight

    },
    noPosts: {
        fontSize: hp(2),
        textAlign: 'center',
        color: theme.colors.text
    },
    listStyle: {
        paddingTop: 20,
        paddingHorizontal: wp(4)
    },
    container: {
        flex: 1
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        marginHorizontal: wp(4)
    },
    title: {
        color: theme.colors.text,
        fontSize: hp(3.2),
        fontWeight: theme.fonts.bold
    },
    avatarImages: {
        height: hp(4.3),
        width: hp(4.3),
        borderRadius: theme.radius.bold,
        borderCurve: 'continuous',
        borderColor: theme.colors.gray,
        borderWidth: 3
    },
    icons: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 18
    }
})