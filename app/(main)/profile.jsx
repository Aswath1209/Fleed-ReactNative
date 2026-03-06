import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import ImageViewing from "react-native-image-viewing"
import Icon from '../../assets/icons'
import Avatar from '../../components/Avatar'
import Button from '../../components/Button'
import Header from '../../components/Header'
import Loading from '../../components/Loading'
import PostCard from '../../components/PostCard'
import ScreenWrapper from '../../components/ScreenWrapper'
import { theme } from '../../constants/theme'
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
const Profile = () => {
    const { user: currentUser } = useAuth();
    const { showAlert } = useAlert();
    const { userId } = useLocalSearchParams();
    const router = useRouter();

    const targetUserId = userId || currentUser?.id;

    const [posts, setPosts] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [profileUser, setProfileUser] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);

    useEffect(() => {
        console.log('Profile: mounting');
        if (currentUser) {
            setPosts([]);
            setHasMore(true);
            limit = 0;
            getPosts();
        }
    }, [targetUserId, currentUser, userId]);

    const fetchFollowData = async (uid) => {
        if (!uid) return;
        let res = await fetchFollowCounts(uid)
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
            let res = await fetchFollowStatus(currentUser.id, targetId)
            if (res.success && res.data) {
                setIsFollowing(true)
            } else {
                setIsFollowing(false)
            }
        }
    }

    useEffect(() => {
        if (currentUser) {
            fetchProfileData();
        }
    }, [userId, currentUser])

    const fetchProfileData = async () => {
        if (!currentUser) return; // Wait until authenticated session hydrates
        let uid = userId && userId !== currentUser?.id ? userId : currentUser?.id;
        if (userId && userId !== currentUser?.id) {
            const res = await getUserData(userId);
            if (res.success) {
                setProfileUser(res.data);
                checkFollowData(res.data.id);
                fetchFollowData(res.data.id);
            }
            else {
                setProfileUser(currentUser);
                if (currentUser?.id) fetchFollowData(currentUser.id);
            }
        } else {
            setProfileUser(currentUser);
            if (currentUser?.id) fetchFollowData(currentUser.id);
        }
    }

    const createRoom = async () => {
        if (!currentUser || !profileUser) return;
        console.log(profileUser.name)

        const res = await createOrGetRoom(currentUser.id, profileUser.id);
        if (res.success) {
            console.log("Room created", res.data);
            router.push({ pathname: '/chatRoom', params: { roomId: res.data.id, otherUserName: profileUser.name, otherUserImage: profileUser.image, otherUserId: profileUser.id } });
        }
        else {
            showAlert(res.msg)
        }
    }
    const onLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            showAlert("LogOut", "Error Signing Out")
        }

    }
    const [isFetching, setIsFetching] = useState(false);

    const getPosts = async () => {
        if (!hasMore || isFetching) return null;
        setIsFetching(true);
        try {
            limit = limit + 10;
            let res = await fetchPost(limit, targetUserId);
            if (res.success) {
                if (posts.length == res.data.length) {
                    setHasMore(false)
                }
                setPosts(res.data)
            }
        } finally {
            setIsFetching(false);
        }
    }
    const handleLogout = async () => {
        showAlert("Confirm", "Are you sure you want to logout?", [
            {
                text: 'Cancel',
                onPress: () => console.log("log Out Cancelled"),
                style: 'cancel'
            }, {
                text: "LogOut",
                onPress: () => onLogout(),
                style: 'destructive'
            }

        ])

    }

    const follow = async () => {
        if (!currentUser || !profileUser) return;
        console.log("Pressed")
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
        if (!currentUser) return;
        let followeeId = profileUser?.id;
        if (!followeeId) return;
        setLoading(true);
        const res = await unfollowUser(currentUser.id, followeeId)
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

    if (!currentUser) {
        return (
            <ScreenWrapper bg="white">
                <Loading style={{ marginTop: 200 }} />
            </ScreenWrapper>
        )
    }

    return (
        <ScreenWrapper bg="white">
            <FlatList
                data={posts}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListHeaderComponent={<UserHeader user={profileUser} loading={loading} router={router} createRoom={createRoom} handleLogout={handleLogout} isOwnProfile={targetUserId === currentUser?.id} onFollow={follow} isFollowing={isFollowing} onUnfollow={Unfollow} followerCount={followerCount} followingCount={followingCount} />}
                ListHeaderComponentStyle={{ marginBottom: 30 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listStyle}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => <PostCard
                    item={item}
                    currentUser={currentUser}
                    router={router}

                />}
                onEndReached={() => {
                    getPosts();
                }}
                onEndReachedThreshold={0}
                ListFooterComponent={hasMore ? (
                    <View style={{ marginHorizontal: posts.length == 0 ? 100 : 30 }}>
                        <Loading />
                    </View>) : (
                    <View style={{ marginVertical: 30 }}>
                        <Text style={styles.noPosts}>No More Posts Available</Text>
                    </View>

                )}
            />
        </ScreenWrapper>
    )
}

const UserHeader = ({ user, router, handleLogout, isOwnProfile, onFollow, isFollowing, onUnfollow, loading, createRoom, followerCount, followingCount }) => {
    const [modalVisible, setModalVisible] = useState(false);
    return (
        <View style={{ flex: 1, backgroundColor: "white", paddingHorizontal: wp(4) }}>
            <View>
                <Header title="Profile" mb={30} router={router} showBackButton={false} />
                {isOwnProfile && (
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Icon name="logout" color={theme.colors.rose} />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.container}>
                <View style={{ gap: 15 }}>
                    <View style={styles.avatarContainer}>
                        <Pressable onPress={() => user?.image && setModalVisible(true)}>
                            <Avatar
                                uri={user?.image}
                                size={hp(12)}
                                rounded={theme.radius.xxl * 1.4}
                            />
                        </Pressable>
                        <ImageViewing
                            images={[{ uri: getUserImageSrc(user?.image).uri }]}
                            imageIndex={0}
                            visible={modalVisible}
                            onRequestClose={() => setModalVisible(false)}
                        />

                        {isOwnProfile && (
                            <Pressable style={styles.editIcon} onPress={() => router.push('editProfile')}>
                                <Icon name="edit" strokeWidth={2.5} />
                            </Pressable>
                        )}
                    </View>

                    <View style={{ alignItems: 'center', gap: 4 }}>
                        <Text style={styles.userName}>{user && user.name}</Text>
                        {user && user.address && (
                            <View style={styles.info}>
                                <Icon name="location" size={18} color={theme.colors.textLight} />
                                <Text style={styles.infoText}>{user.address}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{followerCount || 0}</Text>
                            <Text style={styles.statLabel}>Followers</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{followingCount || 0}</Text>
                            <Text style={styles.statLabel}>Following</Text>
                        </View>
                    </View>

                    <View style={{ gap: 10 }}>
                        {isOwnProfile && (
                            <View style={styles.info}>
                                <Icon name="mail" size={20} color={theme.colors.textLight} />
                                <Text style={styles.infoText}>{user && user.email}</Text>
                            </View>
                        )}
                        {user && user.phoneNumber && isOwnProfile && (
                            <View style={styles.info}>
                                <Icon name="call" size={20} color={theme.colors.textLight} />
                                <Text style={styles.infoText}>{user && user.phoneNumber}</Text>
                            </View>
                        )}
                        {user && user.bio && (
                            <Text style={styles.bioText}>{user.bio}</Text>
                        )}
                    </View>

                    {!isOwnProfile && (
                        <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center', alignItems: 'center', marginTop: hp(2) }}>
                            <Button
                                loading={loading}
                                title={isFollowing ? "Unfollow" : "Follow"}
                                onPress={isFollowing ? onUnfollow : onFollow}
                                buttonStyle={{
                                    backgroundColor: isFollowing ? theme.colors.rose : theme.colors.primary,
                                    paddingHorizontal: 0,
                                    flex: 1
                                }}
                            />
                            <Button
                                title="Message"
                                buttonStyle={{
                                    backgroundColor: theme.colors.gray,
                                    paddingHorizontal: 0,
                                    flex: 1
                                }}
                                textStyle={{ color: theme.colors.text }}
                                onPress={createRoom}
                            />
                        </View>
                    )}
                </View>
            </View>
        </View>
    )
}

export default Profile

const styles = StyleSheet.create({
    infoText: {
        fontSize: hp(1.8),
        color: theme.colors.textLight
    },
    bioText: {
        fontSize: hp(1.8),
        fontWeight: '500',
        color: theme.colors.text,
        marginTop: 5,
        textAlign: 'center',
    },
    logoutButton: {
        position: 'absolute',
        right: 0,
        padding: 5,
        borderRadius: theme.radius.sm,
        backgroundColor: '#fee2e3'
    },
    listStyle: {
        paddingHorizontal: wp(4),
        paddingBottom: 30
    },
    noPosts: {
        fontSize: hp(2),
        textAlign: 'center',
        color: theme.colors.text
    },
    info: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    editIcon: {
        position: 'absolute',
        bottom: 0,
        right: -12,
        padding: 7,
        borderRadius: 50,
        backgroundColor: 'white',
        shadowColor: theme.colors.textLight,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
        elevation: 7
    },
    userName: {
        fontSize: hp(3),
        fontWeight: 'bold',
        color: theme.colors.textDark
    },
    avatarContainer: {
        height: hp(12),
        width: hp(12),
        alignSelf: 'center'
    },
    headerShape: {
        width: wp(100),
        height: hp(20)
    },
    container: {
        flex: 1
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 30,
        marginVertical: 15,
        backgroundColor: theme.colors.gray,
        paddingVertical: 10,
        borderRadius: theme.radius.md,
        marginHorizontal: wp(5)
    },
    statItem: {
        alignItems: 'center'
    },
    statNumber: {
        fontSize: hp(2.5),
        fontWeight: 'bold',
        color: theme.colors.textDark
    },
    statLabel: {
        fontSize: hp(1.6),
        color: theme.colors.textLight
    },
    divider: {
        width: 1,
        height: '60%',
        backgroundColor: '#ccc'
    }
})
