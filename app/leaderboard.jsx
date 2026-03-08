import { StyleSheet, Text, View, FlatList, TouchableOpacity, Image } from 'react-native'
import React, { useEffect, useState, useCallback } from 'react'
import { useRouter, useFocusEffect } from 'expo-router'
import ScreenWrapper from '../components/ScreenWrapper'
import Header from '../components/Header'
import { getLeaderboard } from '../services/challengesService'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { hp, wp } from '../helpers/common'
import Loading from '../components/Loading'
import Avatar from '../components/Avatar'
import { getUserData } from '../services/userService'
import { supabase } from '../lib/supabase'

const Leaderboard = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { user } = useAuth();
    const { theme } = useTheme();
    const styles = createStyles(theme);

    const [isCurrentUserVisible, setIsCurrentUserVisible] = useState(true);

    useFocusEffect(
        useCallback(() => {
            fetchLeaderboard();
        }, [])
    );

    useEffect(() => {
        const handleUsersUpdate = (payload) => {
            if (payload.eventType === 'UPDATE' && payload.new && payload.new.xp !== undefined) {
                setUsers(prevUsers => {
                    // Create a new array with the updated user
                    const updatedUsers = prevUsers.map(u => 
                        u.id === payload.new.id ? { ...u, xp: payload.new.xp } : u
                    );
                    
                    // Re-sort the array by XP descending to update the ranks dynamically
                    return updatedUsers.sort((a, b) => (b.xp || 0) - (a.xp || 0));
                });
            }
        };

        const globalUsersChannel = supabase
            .channel('public:users:leaderboard')
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'users'
            }, handleUsersUpdate)
            .subscribe();

        return () => {
            supabase.removeChannel(globalUsersChannel);
        };
    }, []);

    const fetchLeaderboard = async () => {
        setLoading(true);
        const res = await getLeaderboard();
        if(res.success) {
            setUsers(res.data);
        }
        setLoading(false);
    }

    const renderItem = ({ item, index }) => {
        const isCurrentUser = user && user.id === item.id;
        const rank = index + 1;
        
        let rankStyle = styles.rankText;
        if(rank === 1) rankStyle = [styles.rankText, { color: '#FFD700' }]; // Gold
        if(rank === 2) rankStyle = [styles.rankText, { color: '#C0C0C0' }]; // Silver
        if(rank === 3) rankStyle = [styles.rankText, { color: '#CD7F32' }]; // Bronze

        return (
            <View style={[styles.userCard, isCurrentUser && styles.currentUserCard]}>
                <View style={styles.rankContainer}>
                    <Text style={rankStyle}>#{rank}</Text>
                </View>
                <View style={styles.avatarContainer}>
                   <Avatar uri={item.image} size={hp(5)} rounded={theme.radius.xl} />
                </View>
                <View style={styles.userInfo}>
                    <Text style={styles.userName} numberOfLines={1}>
                        {item.name || 'Unknown User'}
                    </Text>
                    {isCurrentUser && (
                        <Text style={styles.youBadge}>(You)</Text>
                    )}
                </View>
                <View style={styles.xpContainer}>
                    <Text style={styles.xpAmount}>{item.xp || 0}</Text>
                    <Text style={styles.xpLabel}>XP</Text>
                </View>
            </View>
        )
    }

    const onViewableItemsChanged = useCallback(({ viewableItems }) => {
        if (!user) return;
        const isVisible = viewableItems.some(item => item.item.id === user.id);
        setIsCurrentUserVisible(isVisible);
    }, [user]);

    const viewabilityConfig = { itemVisiblePercentThreshold: 10 };

    const renderCurrentUserSticky = () => {
        if (!user || isCurrentUserVisible || !users.some(u => u.id === user.id)) return null;
        
        const index = users.findIndex(u => u.id === user.id);
        const item = users[index];
        const rank = index + 1;
        
        let rankStyle = styles.rankText;
        if(rank === 1) rankStyle = [styles.rankText, { color: '#FFD700' }];
        if(rank === 2) rankStyle = [styles.rankText, { color: '#C0C0C0' }];
        if(rank === 3) rankStyle = [styles.rankText, { color: '#CD7F32' }];

        return (
            <View style={[styles.userCard, styles.currentUserCard, styles.stickyCard]}>
                <View style={styles.rankContainer}>
                    <Text style={rankStyle}>#{rank}</Text>
                </View>
                <View style={styles.avatarContainer}>
                   <Avatar uri={item.image} size={hp(5)} rounded={theme.radius.xl} />
                </View>
                <View style={styles.userInfo}>
                    <Text style={styles.userName} numberOfLines={1}>
                        {item.name || 'Unknown User'}
                    </Text>
                    <Text style={styles.youBadge}>(You)</Text>
                </View>
                <View style={styles.xpContainer}>
                    <Text style={styles.xpAmount}>{item.xp || 0}</Text>
                    <Text style={styles.xpLabel}>XP</Text>
                </View>
            </View>
        )
    }

    return (
        <ScreenWrapper bg={theme.colors.background}>
            <Header title="Global Leaderboard" router={router} />
            <View style={styles.container}>
                {loading ? (
                    <View style={styles.center}>
                        <Loading size="large" />
                    </View>
                ) : (
                    <FlatList
                        data={users}
                        keyExtractor={item => item.id}
                        renderItem={renderItem}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContainer}
                        onViewableItemsChanged={onViewableItemsChanged}
                        viewabilityConfig={viewabilityConfig}
                        ListEmptyComponent={
                            <View style={styles.center}>
                                <Text style={styles.emptyText}>No users found.</Text>
                            </View>
                        }
                    />
                )}
                {renderCurrentUserSticky()}
            </View>
        </ScreenWrapper>
    )
}

export default Leaderboard

const createStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: wp(4),
    },
    listContainer: {
        paddingTop: hp(2),
        paddingBottom: hp(5),
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: hp(2),
        color: theme.colors.textLight,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: wp(4),
        marginBottom: hp(1.5),
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xxl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        shadowColor: theme.colors.darkLight,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    currentUserCard: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primaryDark + '10', // 10% opacity primary background
        borderWidth: 2,
    },
    stickyCard: {
        position: 'absolute',
        bottom: hp(2),
        left: wp(4),
        right: wp(4),
        elevation: 5,
        shadowOpacity: 0.2,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: -3 },
        backgroundColor: theme.colors.surface, // Override opacity to be fully solid so list items don't bleed through
    },
    rankContainer: {
        width: wp(10),
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankText: {
        fontSize: hp(2.2),
        fontWeight: theme.fonts.extraBold,
        color: theme.colors.textLight,
    },
    avatarContainer: {
        marginHorizontal: wp(3),
    },
    userInfo: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
    },
    userName: {
        fontSize: hp(2),
        fontWeight: theme.fonts.bold,
        color: theme.colors.textDark,
    },
    youBadge: {
        fontSize: hp(1.4),
        color: theme.colors.primary,
        marginTop: 2,
        fontWeight: theme.fonts.bold,
    },
    xpContainer: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    xpAmount: {
        fontSize: hp(2.2),
        fontWeight: theme.fonts.extraBold,
        color: theme.colors.primary,
    },
    xpLabel: {
        fontSize: hp(1.4),
        color: theme.colors.textLight,
        fontWeight: theme.fonts.medium,
    }
})
