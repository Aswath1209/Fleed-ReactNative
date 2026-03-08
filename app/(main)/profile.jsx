import { useFocusEffect, useRouter } from 'expo-router'
import React, { useEffect, useState, useCallback } from 'react'
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import ImageViewing from "react-native-image-viewing"
import Icon from '../../assets/icons'
import Avatar from '../../components/Avatar'
import Header from '../../components/Header'
import Loading from '../../components/Loading'
import PostCard from '../../components/PostCard'
import ScreenWrapper from '../../components/ScreenWrapper'
import { useTheme } from '../../context/ThemeContext'
import { useAlert } from '../../context/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { hp, wp } from '../../helpers/common'
import { supabase } from '../../lib/supabase'
import { fetchFollowCounts } from '../../services/followService'
import { getUserImageSrc } from '../../services/ImageService'
import { fetchPost } from '../../services/postService'
import { getUserData } from '../../services/userService'

let limit = 0;
const Profile = () => {
    const { user: currentUser } = useAuth();
    const { showAlert } = useAlert();
    const router = useRouter();
    const { theme } = useTheme();
    const styles = createStyles(theme);

    const [posts, setPosts] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [profileUser, setProfileUser] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        if (currentUser) {
            setPosts([]);
            setHasMore(true);
            limit = 0;
            getPosts();
        }
    }, [currentUser]);

    useFocusEffect(
        useCallback(() => {
            if (currentUser) fetchProfileData();
        }, [currentUser])
    );

    useEffect(() => {
        if (!currentUser) return;

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

        const userIdToWatch = currentUser.id;

        let userChannel = supabase
            .channel(`public:users:${userIdToWatch}`)
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'users', 
                filter: `id=eq.${userIdToWatch}` 
            }, handleUserUpdate)
            .subscribe();

        return () => {
            supabase.removeChannel(userChannel);
        };
    }, [currentUser]);

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

    const fetchProfileData = async () => {
        if (!currentUser) return; 
        const res = await getUserData(currentUser.id);
        if (res.success) {
            setProfileUser(res.data);
            fetchFollowData(res.data.id);
        } else {
            setProfileUser(currentUser);
            fetchFollowData(currentUser.id);
        }
    }

    const onLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            showAlert("LogOut", "Error Signing Out")
        }
    }

    const getPosts = async () => {
        if (!hasMore || isFetching || !currentUser) return null;
        setIsFetching(true);
        try {
            limit = limit + 10;
            let res = await fetchPost(limit, currentUser.id);
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
                style: 'cancel'
            }, {
                text: "LogOut",
                onPress: () => onLogout(),
                style: 'destructive'
            }
        ])
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
                ListHeaderComponent={<UserHeader user={profileUser} router={router} handleLogout={handleLogout} followerCount={followerCount} followingCount={followingCount} />}
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
                    </View>) : (
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

const UserHeader = ({ user, router, handleLogout, followerCount, followingCount }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [settingsVisible, setSettingsVisible] = useState(false);
    const { theme } = useTheme();
    const styles = createStyles(theme);
    
    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingHorizontal: wp(4) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <Header title="My Profile" mb={0} router={router} showBackButton={false} />
                <TouchableOpacity onPress={() => setSettingsVisible(!settingsVisible)} style={{ padding: 5 }}>
                    <Icon name="threeDotsHorizontal" size={24} color={theme.colors.text} />
                </TouchableOpacity>
            </View>

            {/* Settings Dropdown Overlay */}
            {settingsVisible && (
                <View style={styles.settingsDropdown}>
                    <TouchableOpacity style={styles.dropdownItem} onPress={() => {
                        setSettingsVisible(false);
                        handleLogout();
                    }}>
                        <Icon name="logout" size={20} color={theme.colors.rose} />
                        <Text style={[styles.dropdownText, { color: theme.colors.rose }]}>Log Out</Text>
                    </TouchableOpacity>
                </View>
            )}

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

            {/* Level Progress Bar below the bio */}
            <View style={styles.levelProgressContainer}>
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${(user?.xp || 0) % 100}%` }]} />
                </View>
                <Text style={styles.progressText}>
                    {(user?.xp || 0) % 100} / 100 XP to Level {Math.floor((user?.xp || 0) / 100) + 2}
                </Text>
            </View>

            {/* Private Contact Options aligned horizontally */}
            {(user?.email || user?.phoneNumber) && (
                 <View style={styles.contactContainer}>
                    {user.email && (
                        <View style={styles.contactChip}>
                            <Icon name="mail" size={16} color={theme.colors.textLight} />
                            <Text style={styles.contactText}>{user.email}</Text>
                        </View>
                    )}
                    {user.phoneNumber && (
                        <View style={styles.contactChip}>
                            <Icon name="call" size={16} color={theme.colors.textLight} />
                            <Text style={styles.contactText}>{user.phoneNumber}</Text>
                        </View>
                    )}
                 </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.editBtn} onPress={() => router.push('editProfile')}>
                    <Text style={styles.editBtnText}>Edit Profile</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

export default Profile

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
        marginBottom: hp(2)
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
    contactContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        paddingHorizontal: wp(2),
        marginBottom: hp(2)
    },
    contactChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 4,
        paddingHorizontal: 10,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.sm,
        borderWidth: 1,
        borderColor: theme.colors.border
    },
    contactText: {
        fontSize: hp(1.6),
        color: theme.colors.textLight,
    },
    levelProgressContainer: {
        paddingHorizontal: wp(2),
        marginBottom: hp(3),
    },
    progressBarBg: {
        width: '100%',
        height: 6,
        backgroundColor: theme.colors.gray,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 6,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: theme.colors.primary,
        borderRadius: 4,
    },
    progressText: {
        fontSize: hp(1.5),
        color: theme.colors.textLight,
        fontWeight: theme.fonts.medium,
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: wp(2)
    },
    editBtn: {
        flex: 1,
        backgroundColor: theme.colors.primary,
        paddingVertical: hp(1.2),
        borderRadius: theme.radius.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    editBtnText: {
        color: 'white',
        fontSize: hp(1.8),
        fontWeight: theme.fonts.semibold
    },
    settingsDropdown: {
        position: 'absolute',
        top: 50,
        right: wp(4),
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        padding: 5,
        borderWidth: 1,
        borderColor: theme.colors.border,
        shadowColor: theme.colors.dark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
        zIndex: 50
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 10,
        paddingHorizontal: 15
    },
    dropdownText: {
        fontSize: hp(1.8),
        fontWeight: theme.fonts.medium
    }
});
