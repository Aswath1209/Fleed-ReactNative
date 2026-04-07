import { FlatList, StyleSheet, Text, View, RefreshControl } from 'react-native'
import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'expo-router';
import { fetchChallenges, fetchCompletedChallengeIds } from '../../services/challengesService';
import ScreenWrapper from '../../components/ScreenWrapper';
import Loading from '../../components/Loading';
import ChallengeCard from '../../components/ChallengeCard';
import { hp ,wp} from '../../helpers/common';
import { useTheme } from '../../context/ThemeContext';
import Icon from '../../assets/icons';
import { TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';

const Challenges = () => {
  const { user } = useAuth();
  const[challenges,setChallenges]=useState([]);
  const[completedIds,setCompletedIds]=useState([]);
  const[loading,setLoading]=useState(true);
  const[refreshing,setRefreshing]=useState(false);
  const router=useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  useEffect(()=>{
    getChallenges();
  },[])

  const getChallenges=async()=>{
    setLoading(true);
    const res=await fetchChallenges();
    if(res.success){
      setChallenges(res.data);
    }
    if (user?.id) {
      const compRes = await fetchCompletedChallengeIds(user.id);
      if (compRes.success) setCompletedIds(compRes.data);
    }
    setLoading(false);
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await getChallenges();
    setRefreshing(false);
  }, []);
  return (
   <ScreenWrapper bg='white'>
    <View style={styles.container}>
      <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <Text style={styles.headerTitle}>Challenges</Text>
        <View style={styles.headerButtonsContainer}>
            {user?.is_admin && (
                <TouchableOpacity 
                   onPress={() => router.push('/createChallenge')} 
                   style={styles.adminBtn}
                >
                    <Icon name="plus" color={theme.colors.primary} size={hp(2.5)} />
                    <Text style={styles.leaderboardBtnText}>New</Text>
                </TouchableOpacity>
            )}
            <TouchableOpacity 
               onPress={() => router.push('/leaderboard')} 
               style={styles.leaderboardBtn}
            >
                <Icon name="trophy" color={theme.colors.primary} size={hp(2.5)} />
                <Text style={styles.leaderboardBtnText}>Ranks</Text>
            </TouchableOpacity>
        </View>
      </View>
        {loading?(
          <View style={styles.loadingContainer}>
            <Loading size='large'/>
            </View>
        ):(
          <FlatList
          data={challenges}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          keyExtractor={(item)=>item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} colors={[theme.colors.primary]} />
          }
          renderItem={({item})=>(
            <ChallengeCard item={item} router={router} isCompleted={completedIds.includes(item.id)} />
          )}
          ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No active challenges right now.</Text>
                            </View>
          }
          />
          
          
        )}
    </View>
   </ScreenWrapper>
  )
   
}

export default Challenges

const createStyles = (theme) => StyleSheet.create({
  container: {
        flex: 1,
        paddingHorizontal: wp(4),
    },
    header: {
        marginTop: hp(2),
        marginBottom: hp(2),
    },
    headerTitle: {
        fontSize: hp(3.2),
        fontWeight: theme.fonts.bold,
        color: theme.colors.textDark,
    },
    listContainer: {
        paddingTop: 10,
        paddingBottom: hp(10), // Padding so the bottom list items don't hide under the tab bar
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: hp(10),
    },
    emptyText: {
        fontSize: hp(2),
        color: theme.colors.textLight,
    },
    headerButtonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(2),
    },
    leaderboardBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primaryDark + '20', // Give it a slight tint
        paddingHorizontal: wp(3),
        paddingVertical: hp(0.8),
        borderRadius: theme.radius.xl,
        gap: 5
    },
    adminBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primaryDark + '15',
        paddingHorizontal: wp(3),
        paddingVertical: hp(0.8),
        borderRadius: theme.radius.xl,
        gap: 5,
        borderWidth: 1,
        borderColor: theme.colors.primaryDark + '30',
    },
    leaderboardBtnText: {
        fontSize: hp(1.6),
        fontWeight: theme.fonts.bold,
        color: theme.colors.primary
    }
})