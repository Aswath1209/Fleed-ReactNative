import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import Icon from '../assets/icons'
import { useTheme } from '../context/ThemeContext'
import { hp } from '../helpers/common'

const ChallengeCard = ({item, router, isCompleted = false}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <TouchableOpacity style={[styles.card, isCompleted && styles.completedCard]} onPress={()=>router.push(`/challengeDetails?id=${item.id}`)}>
        <View style={styles.cardHeader}>
            <View style={styles.titleContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.communityName}>{item.communities?.name}</Text>
            </View>
            <View style={styles.badgeRow}>
                {isCompleted && (
                    <View style={styles.completedBadge}>
                        <Text style={styles.completedText}>✓ Done</Text>
                    </View>
                )}
                <View style={styles.xpBadge}>
                    <Text style={styles.xpText}>{item.reward_xp} XP</Text>
                </View>
            </View>
        </View>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        <View style={styles.cardFooter}>
            <Icon name="location" size={16} color={theme.colors.textLight} />
            <Text style={styles.footerText}>{isCompleted ? 'Completed ✓' : 'Open for submissions'}</Text>
        </View>
    </TouchableOpacity>
  )
}

export default ChallengeCard

const createStyles = (theme) => StyleSheet.create({
    card:{
        backgroundColor: theme.colors.surface,
        padding:15,
        borderRadius:theme.radius.xxl,
        marginBottom:15,
        borderWidth:0.5,
        borderColor:theme.colors.border,
        shadowColor:'#000',
        shadowOffset:{width:0,height:2},
        shadowRadius:5,
        elevation:2,
    },
    completedCard: {
        borderColor: '#22c55e',
        borderWidth: 1.5,
        backgroundColor: '#22c55e08',
    },
    cardHeader:{
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'flex-start',
        marginBottom:8,
    },
    titleContainer:{
        flex:1,
        paddingRight:10,
    },
    title:{
        fontSize: hp(2.2),
        fontWeight: theme.fonts.semibold,
        color: theme.colors.textDark,
    },
    communityName: {
        fontSize: hp(1.6),
        color: theme.colors.textLight,
        fontWeight: theme.fonts.medium,
        marginTop: 2,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    completedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#22c55e',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: theme.radius.sm,
    },
    completedText: {
        fontSize: hp(1.4),
        fontWeight: theme.fonts.bold,
        color: 'white',
    },
    xpBadge: {
        backgroundColor: theme.colors.primary + '15', 
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: theme.radius.sm,
    },
    xpText: {
        fontSize: hp(1.6),
        fontWeight: theme.fonts.bold,
        color: theme.colors.primary,
    },
    description: {
        fontSize: hp(1.8),
        color: theme.colors.text,
        marginBottom: 12,
        lineHeight: hp(2.5),
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        paddingTop: 12,
        gap: 6,
    },
    footerText: {
        fontSize: hp(1.6),
        color: theme.colors.textLight,
        fontWeight: theme.fonts.medium,
    }
})