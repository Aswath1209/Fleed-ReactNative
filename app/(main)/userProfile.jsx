import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState, useCallback } from 'react'
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import ImageViewing from "react-native-image-viewing"
import Icon from '../../assets/icons'
import Avatar from '../../components/Avatar'
import Button from '../../components/Button'
import Header from '../../components/Header'
import Loading from '../../components/Loading'
import PostCard from '../../components/PostCard'
import ScreenWrapper from '../../components/ScreenWrapper'
import { useTheme } from '../../context/ThemeContext'
import { useAlert } from '../../context/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { hp, wp } from '../../helpers/common'
import { supabase } from '../../lib/supabase'
import { createOrGetRoom } from '../../services/chatServices'
import { fetchFollowCounts, fetchFollowStatus, followUser, unfollowUser } from '../../services/followService'
import { getUserImageSrc } from '../../services/ImageService'
import { fetchPost } from '../../services/postService'
import { getUserData } from '../../services/userService'

let limit = 0;

const UserProfile = () => {
    const { user: currentUser } = useAuth();
    const { showAlert } = useAlert();
    const { userId } = useLocalSearchParams();
    const router = useRouter();
    const { theme } = useTheme();
    const styles = createStyles(theme);

    const [posts, setPosts] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [profileUser, setProfileUser] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        if (userId) {
            setPosts([]);
            setHasMore(true);
            limit = 0;
            getPosts();
        }
    }, [userId]);

    useFocusEffect(
        useCallback(() => {
            if (userId) fetchProfileData();
        }, [userId])
    );

    useEffect(() => {
        if (!userId) return;

        const handleUserUpdate = (payload) => {
            if (payload.eventType === 'UPDATE' && payload.new && payload.new.xp !== undefined) {
                setProfileUser(prevUser => {
                    if (prevUser && prevUser.id === payload.new.id) {
                        return { ...prevUser, xp: payload.new.xp };
                    }
                    return prevUser;
                });
            }
        };

        let userChannel = supabase
            .channel(`public:users:${userId}`)
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'users', 
                filter: `id=eq.${userId}` 
            }, handleUserUpdate)
            .subscribe();

        return () => {
            supabase.removeChannel(userChannel);
        };
    }, [userId]);

    const fetchFollowData = async (uid) => {
        if (!uid) return;
        let res = await fetchFollowCounts(uid);
        if (res.success && res.data) {
            setFollowerCount(res.data.followers);
            setFollowingCount(res.data.following);
        } else {
            setFollowerCount(0);
            setFollowingCount(0);
        }
    }

    const checkFollowData = async (targetId) => {
        if (!currentUser) return;
        if (targetId && targetId !== currentUser.id) {
            let res = await fetchFollowStatus(currentUser.id, targetId);
            if (res.success && res.data) setIsFollowing(true);
            else setIsFollowing(false);
        }
    }

    const fetchProfileData = async () => {
        if (!userId) return;
        const res = await getUserData(userId);
        if (res.success) {
            setProfileUser(res.data);
            checkFollowData(res.data.id);
            fetchFollowData(res.data.id);
        }
    }

    const createRoom = async () => {
        if (!currentUser || !profileUser) return;
        const res = await createOrGetRoom(currentUser.id, profileUser.id);
        if (res.success) {
            router.push({ pathname: '/chatRoom', params: { roomId: res.data.id, otherUserName: profileUser.name, otherUserImage: profileUser.image, otherUserId: profileUser.id } });
        } else {
            showAlert(res.msg);
        }
    }

    const getPosts = async () => {
        if (!hasMore || isFetching || !userId) return null;
        setIsFetching(true);
        try {
            limit = limit + 10;
            let res = await fetchPost(limit, userId);
            if (res.success) {
                if (posts.length == res.data.length) setHasMore(false);
                setPosts(res.data);
            }
        } finally {
            setIsFetching(false);
        }
    }

    const follow = async () => {
        if (!currentUser || !profileUser) return;
        setLoading(true);
        const res = await followUser({ follower_id: currentUser.id, following_id: profileUser.id });
        setLoading(false);
        if (res.success) {
            setIsFollowing(true);
            setFollowerCount(followerCount + 1);
        } else {
            showAlert("Error", res.msg);
        }
    }

    const Unfollow = async () => {
        if (!currentUser || !profileUser) return;
        setLoading(true);
        const res = await unfollowUser(currentUser.id, profileUser.id);
        setLoading(false);
        if (res.success) {
            setIsFollowing(false);
            setFollowerCount(followerCount - 1);
        } else {
            showAlert("Error", res.msg);
        }
    }

    const onRefresh = async () => {
        setRefreshing(true);
        limit = 0;
        setHasMore(true);
        await getPosts();
        await fetchProfileData();
        setRefreshing(false);
    }

    if (!profileUser) {
        return (
            <ScreenWrapper bg={theme.colors.background}>
                <Loading style={{ marginTop: 200 }} />
            </ScreenWrapper>
        )
    }

    return (
        <ScreenWrapper bg={theme.colors.background}>
            <FlatList
                data={posts}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListHeaderComponent={<PublicHeader user={profileUser} loading={loading} router={router} createRoom={createRoom} onFollow={follow} isFollowing={isFollowing} onUnfollow={Unfollow} followerCount={followerCount} followingCount={followingCount} />}
                ListHeaderComponentStyle={{ marginBottom: 30 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listStyle}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => <PostCard item={item} currentUser={currentUser} router={router} />}
                onEndReached={getPosts}
                onEndReachedThreshold={0}
                ListFooterComponent={hasMore ? (
                    <View style={{ marginHorizontal: posts.length == 0 ? 100 : 30 }}>
                        <Loading />
                    </View>
                ) : (
                    <View style={{ marginVertical: 30 }}>
                        <Text style={styles.noPosts}>
                            {posts.length === 0 ? "No posts yet" : "No More Posts Available"}
                        </Text>
                    </View>
                )}
            />
        </ScreenWrapper>
    )
}

const PublicHeader = ({ user, router, onFollow, isFollowing, onUnfollow, loading, createRoom, followerCount, followingCount }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const { theme } = useTheme();
    const styles = createStyles(theme);
    
    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingHorizontal: wp(4) }}>
            <Header title={user?.name || "Profile"} mb={20} router={router} />
            
            <View style={styles.headerGrid}>
                {/* Left side: Avatar */}
                <View style={styles.avatarColumn}>
                    <Pressable onPress={() => user?.image && setModalVisible(true)}>
                        <Avatar
                            uri={user?.image}
                            size={hp(10.5)}
                            rounded={theme.radius.xxl * 1.4}
                            showRank={true}
                            xp={user?.xp || 0}
                        />
                    </Pressable>
                    <ImageViewing
                        images={[{ uri: getUserImageSrc(user?.image).uri }]}
                        imageIndex={0}
                        visible={modalVisible}
                        onRequestClose={() => setModalVisible(false)}
                    />
                </View>

                {/* Right side: Stats Grid */}
                <View style={styles.statsColumn}>
                    <View style={styles.statBox}>
                        <Text style={styles.statVal}>{Math.floor((user?.xp || 0) / 100) + 1}</Text>
                        <Text style={styles.statLabel}>Level</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statVal}>{followerCount || 0}</Text>
                        <Text style={styles.statLabel}>Followers</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statVal}>{followingCount || 0}</Text>
                        <Text style={styles.statLabel}>Following</Text>
                    </View>
                </View>
            </View>

            {/* User Info (Bio & Location) */}
            <View style={styles.infoSection}>
                <Text style={styles.userName}>{user?.name}</Text>
                
                {user?.address && (
                    <View style={styles.infoRow}>
                        <Icon name="location" size={16} color={theme.colors.textLight} />
                        <Text style={styles.infoText}>{user.address}</Text>
                    </View>
                )}
                
                {user?.bio && (
                    <Text style={styles.bioText}>{user.bio}</Text>
                )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
                <Button
                    loading={loading}
                    title={isFollowing ? "Unfollow" : "Follow"}
                    onPress={isFollowing ? onUnfollow : onFollow}
                    buttonStyle={{
                        backgroundColor: isFollowing ? theme.colors.surface : theme.colors.primary,
                        borderColor: isFollowing ? theme.colors.border : theme.colors.primary,
                        borderWidth: 1,
                        paddingHorizontal: 0,
                        flex: 1,
                        height: hp(5)
                    }}
                    textStyle={{
                        color: isFollowing ? theme.colors.text : 'white',
                        fontSize: hp(1.8)
                    }}
                />
                <Button
                    title="Message"
                    buttonStyle={{
                        backgroundColor: theme.colors.gray,
                        paddingHorizontal: 0,
                        flex: 1,
                        height: hp(5)
                    }}
                    textStyle={{ color: theme.colors.textDark, fontSize: hp(1.8) }}
                    onPress={createRoom}
                />
            </View>

        </View>
    );
}

export default UserProfile;

const createStyles = (theme) => StyleSheet.create({
    listStyle: {
        paddingHorizontal: wp(4),
        paddingBottom: 30
    },
    noPosts: {
        fontSize: hp(2),
        textAlign: 'center',
        color: theme.colors.text
    },
    headerGrid: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: hp(1),
        paddingHorizontal: wp(2),
    },
    avatarColumn: {
        marginRight: wp(5),
    },
    statsColumn: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    statBox: {
        alignItems: 'center',
    },
    statVal: {
        fontSize: hp(2.4),
        fontWeight: theme.fonts.bold,
        color: theme.colors.textDark,
    },
    statLabel: {
        fontSize: hp(1.6),
        color: theme.colors.textLight,
        fontWeight: theme.fonts.medium,
        marginTop: 2,
    },
    infoSection: {
        marginTop: hp(2),
        paddingHorizontal: wp(2),
    },
    userName: {
        fontSize: hp(2.2),
        fontWeight: theme.fonts.bold,
        color: theme.colors.textDark,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    infoText: {
        fontSize: hp(1.7),
        color: theme.colors.textLight,
    },
    bioText: {
        fontSize: hp(1.8),
        color: theme.colors.text,
        marginTop: 8,
        lineHeight: hp(2.5),
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 15,
        marginTop: hp(2.5),
        paddingHorizontal: wp(2),
    }
});
