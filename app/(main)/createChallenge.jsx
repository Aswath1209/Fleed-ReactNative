import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native'
import React, { useState } from 'react'
import { useRouter } from 'expo-router'
import ScreenWrapper from '../../components/ScreenWrapper'
import Header from '../../components/Header'

import Button from '../../components/Button'
import { useTheme } from '../../context/ThemeContext'
import { hp, wp } from '../../helpers/common'
import { createChallenge } from '../../services/challengesService'
import Icon from '../../assets/icons'
import { useAuth } from '../../context/AuthContext'
import Input from '../../components/input'

const CreateChallenge = () => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const router = useRouter();
    const { user } = useAuth();

    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [rewardXp, setRewardXp] = useState('100'); // Default to 100 XP

    const handleSubmit = async () => {
        if (!title.trim() || !description.trim() || !rewardXp.trim()) {
            Alert.alert("Missing Fields", "Please fill out all fields before submitting.");
            return;
        }

        const xpValue = parseInt(rewardXp, 10);
        if (isNaN(xpValue) || xpValue <= 0) {
            Alert.alert("Invalid XP", "Reward XP must be a positive number.");
            return;
        }

        setLoading(true);
        const res = await createChallenge(title, description, xpValue, null); // passing null defaults to General community
        setLoading(false);

        if (res.success) {
            Alert.alert("Success", "Challenge created successfully!", [
                {
                    text: "Done",
                    onPress: () => router.back()
                }
            ]);
        } else {
            Alert.alert("Error", res.msg || "Failed to create challenge.");
        }
    }

    if (!user?.is_admin) {
         return (
             <ScreenWrapper bg={theme.colors.background}>
                 <Header title="Create Challenge" router={router} />
                 <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                     <Icon name="lock" size={hp(10)} color={theme.colors.textLight} />
                     <Text style={[styles.title, { marginTop: hp(2), textAlign: 'center' }]}>Access Denied</Text>
                     <Text style={styles.descriptionText}>You do not have permission to create challenges. Please contact an administrator.</Text>
                 </View>
             </ScreenWrapper>
         )
    }

    return (
        <ScreenWrapper bg={theme.colors.background}>
            <Header title="Create Challenge" router={router} />
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                
                <View style={styles.headerInfo}>
                    <Icon name="edit" size={hp(4)} color={theme.colors.primary} />
                    <Text style={styles.descriptionText}>
                        Use this admin panel to construct a new coding problem for your users. Challenges are immediately pushed to the live database.
                    </Text>
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.label}>Challenge Title</Text>
                    <Input
                        placeholder="e.g. Reverse a String"
                        value={title}
                        onChangeText={setTitle}
                        containerStyle={styles.inputContainer}
                        icon={<Icon name="text" size={24} color={theme.colors.textLight} />}
                    />
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.label}>Problem Description</Text>
                    <Input 
                        placeholder="Write a completely detailed problem statement here outlining the expected inputs, outputs, and edge cases. (Markdown is supported by the AI Grader)"
                        value={description}
                        onChangeText={setDescription}
                        multiline={true}
                        containerStyle={[styles.inputContainer, styles.multilineContainer]}
                        style={styles.multilineInput}
                        textAlignVertical="top"
                    />
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.label}>Reward XP</Text>
                    <Input 
                        placeholder="100"
                        value={rewardXp}
                        onChangeText={setRewardXp}
                        keyboardType="numeric"
                        containerStyle={styles.inputContainer}
                        icon={<Icon name="trophy" size={24} color={theme.colors.primary} />}
                    />
                    <Text style={styles.helperText}>Standard challenges offer 100 XP. Increase this for difficult problems.</Text>
                </View>

                <Button 
                    title="Publish Challenge Live"
                    loading={loading}
                    onPress={handleSubmit}
                    buttonStyle={styles.submitButton}
                />
                
            </ScrollView>
        </ScreenWrapper>
    )
}

export default CreateChallenge

const createStyles = (theme) => StyleSheet.create({
    container: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(2),
        gap: hp(2.5),
        paddingBottom: hp(10), // extra padding so button doesn't hug bottom
    },
    headerInfo: {
        backgroundColor: theme.colors.primaryDark + '10', // Light tint
        padding: wp(4),
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.primaryDark + '30',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        marginBottom: hp(1)
    },
    title: {
        fontSize: hp(2.5),
        fontWeight: theme.fonts.bold,
        color: theme.colors.textDark,
    },
    descriptionText: {
        fontSize: hp(1.8),
        color: theme.colors.text,
        lineHeight: hp(2.6),
        flex: 1,
    },
    formSection: {
        gap: hp(1),
    },
    label: {
        fontSize: hp(1.9),
        fontWeight: theme.fonts.semibold,
        color: theme.colors.textDark,
        paddingLeft: wp(1),
    },
    inputContainer: {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderWidth: 1,
    },
    multilineContainer: {
        height: hp(25),
        alignItems: 'flex-start',
        paddingTop: hp(1.5),
    },
    multilineInput: {
        flex: 1,
        height: '100%',
        paddingTop: 0, // Reset default padding since container has padding
    },
    helperText: {
        fontSize: hp(1.5),
        color: theme.colors.textLight,
        paddingLeft: wp(1),
        fontStyle: 'italic',
    },
    submitButton: {
        marginTop: hp(2),
        backgroundColor: theme.colors.primary,
        shadowColor: theme.colors.primaryDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    }
})
