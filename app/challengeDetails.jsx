import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { useRouter } from 'expo-router';
import { fetchChallengeById, fetchCompletedChallengeIds } from '../services/challengesService';
import Loading from '../components/Loading';
import ScreenWrapper from '../components/ScreenWrapper';
import Header from '../components/Header';
import { ScrollView } from 'react-native-gesture-handler';
import { hp, wp } from '../helpers/common';
import { useTheme } from '../context/ThemeContext';
import Icon from '../assets/icons';
import { TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';

const challengeDetails = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  const { user } = useAuth();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    getChallengeData();
  }, [])

  const getChallengeData = async () => {
    setLoading(true);
    const res = await fetchChallengeById(id);
    if (res.success) {
      setChallenge(res.data);
    }
    if (user?.id) {
      const compRes = await fetchCompletedChallengeIds(user.id);
      if (compRes.success && compRes.data.includes(id)) {
        setIsCompleted(true);
      }
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Loading size="large" />
      </View>
    )
  }

  if (!challenge) {
    return (
      <View style={styles.centerContainer}>
        <Text>Challenge not found</Text>
      </View>
    )
  }

  return (
    <ScreenWrapper bg='white'>
     
        <Header title="Challenge Details" router={router} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          <View style={styles.titleSection}>
            <Text style={styles.title}>{challenge.title}</Text>
            <Text style={styles.community}>By: {challenge.communities?.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoCard}>
              <Icon name="trophy" size={hp(2.5)} color={theme.colors.primary} />
              <View>
                <Text style={styles.infoLabel}>Reward</Text>
                <Text style={styles.infoValue}>{challenge.reward_xp} XP</Text>
              </View>
            </View>
            <View style={styles.infoCard}>
              <Icon name="location" size={hp(2.5)} color={isCompleted ? '#22c55e' : theme.colors.rose} />
              <View>
                <Text style={styles.infoLabel}>Status</Text>
                <Text style={[styles.infoValue, isCompleted && { color: '#22c55e' }]}>{isCompleted ? 'Completed' : 'Active'}</Text>
              </View>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Problem Statement</Text>
            <Text style={styles.descriptionText}>{challenge.description}</Text>
          </View>


        </ScrollView>
        <View style={styles.bottomBar}>
          {isCompleted ? (
            <View style={styles.completedBar}>
              <Text style={styles.completedBarText}>✓ Challenge Completed</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={() => router.push({ pathname: '/submitChallenge', params: { challengeId: challenge.id, challengeTitle: challenge.title, challengeDescription: challenge.description } })}
            >
              <Text style={styles.submitButtonText}>Submit Work</Text>
            </TouchableOpacity>
          )}
        </View>

    </ScreenWrapper>
  )
}

export default challengeDetails

const createStyles = (theme) => StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,

  },
  errorText: {
    fontSize: hp(2),
    color: theme.colors.textLight,


  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    marginBottom: 10,
  },
  scrollContainer: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(15),

  },
  titleSection: {
    marginTop: hp(2),
    marginBottom: hp(3),

  },
  title: {
    fontSize: hp(3.5),
    fontWeight: theme.fonts.bold,
    color: theme.colors.textDark,
    marginBottom: 8
  },
  community: {
    fontSize: hp(1.8),
    color: theme.colors.primary,
    fontWeight: theme.fonts.medium,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: hp(3),
    gap: 15
  },
  infoCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.gray + '30',
    padding: 15,
    borderRadius: theme.radius.xl,

  },
  infoLabel: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
    marginBottom: 2
  },
  infoValue: {
    fontSize: hp(1.8),
    color: theme.colors.textDark,
    fontWeight: theme.fonts.bold,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.gray,
    marginVertical: hp(2),

  },
  descriptionSection: {
    marginTop: hp(1),
  },
  sectionTitle: {
    fontSize: hp(2.2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.textDark,
    marginBottom: hp(1.5),
  },
  descriptionText: {
    fontSize: hp(1.9),
    color: theme.colors.text,
    lineHeight: hp(2.8),
  },
  bottomBar:{
    position:'absolute',
    bottom:0,
    left:0,
    right:0,
    backgroundColor: theme.colors.background,
    paddingHorizontal:wp(4),
    paddingBottom:hp(4),
    paddingTop:hp(2),
    borderTopWidth:1,
    borderTopColor:theme.colors.gray,
    
  },
  submitButton:{
    backgroundColor:theme.colors.primary,
    height: hp(6.5), 
    borderRadius:theme.radius.xl,
    alignItems:'center',
    justifyContent:'center',
    shadowColor:theme.colors.primaryDark,
    shadowOffset:{width:0,height:4},
    shadowOpacity:0.2,
    shadowRadius:5,
    elevation:5,
    
  },
  submitButtonText:{
    fontSize:hp(2),
    fontWeight:theme.fonts.bold,
    color:'white',
  },
  completedBar:{
    backgroundColor:'#22c55e',
    height: hp(6.5),
    borderRadius:theme.radius.xl,
    alignItems:'center',
    justifyContent:'center',
  },
  completedBarText:{
    fontSize:hp(2),
    fontWeight:theme.fonts.bold,
    color:'white',
  }
})