import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import React, { useState, useRef } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import Header from '../components/Header'
import { useTheme } from '../context/ThemeContext'
import { hp, wp } from '../helpers/common'
import Button from '../components/Button'
import { submitChallengeCode } from '../services/challengesService'
import { useAlert } from '../context/AlertContext'
import { useAuth } from '../context/AuthContext'
import ScreenWrapper from '../components/ScreenWrapper';

const submitChallenge = () => {
    const { challengeId, challengeTitle, challengeDescription } = useLocalSearchParams();
    const router = useRouter();
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const { showAlert } = useAlert();
    const { user } = useAuth();

    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [loading, setLoading] = useState(false);
    
    // We no longer need to track selection or auto-close brackets as the new editor handles it natively
    const LANGUAGES = [
        { id: 'javascript', name: 'JavaScript' },
        { id: 'python', name: 'Python' },
        { id: 'cpp', name: 'C++' },
        { id: 'java', name: 'Java' },
    ];

    const onSubmit = async () => {
        if (!code.trim()) {
            showAlert("Error", "Please enter some code to submit.");
            return;
        }

        setLoading(true);
        // Call the Supabase Edge Function
        const res = await submitChallengeCode(challengeId, challengeTitle, challengeDescription, code, language, user?.id);
        setLoading(false);

        if (res?.success) {
            const { passed, score, feedback } = res.data;
            const title = passed ? "Challenge Passed! 🎉" : "Challenge Failed ❌";
            const message = `Score: ${score}/100\n\n${feedback}`;
            
            showAlert(title, message, [
                {
                    text: passed ? "Awesome!" : "Try Again",
                    onPress: () => {
                        if (passed) router.back()
                    }
                }
            ]);
        } else {
            const errorMessage = typeof res?.msg === 'string' ? res.msg : JSON.stringify(res?.msg || "Unknown error occurred");
            showAlert("Submission Failed", errorMessage);
        }
    }

    return (
        <ScreenWrapper bg={theme.colors.background}>
            <Header title="Submit Solution" router={router} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                    
                    <View style={styles.headerInfo}>
                        <Text style={styles.subtitle}>Challenge:</Text>
                        <Text style={styles.challengeTitle}>{challengeTitle || "Unknown Challenge"}</Text>
                        {challengeDescription ? (
                            <Text style={styles.challengeDesc}>{challengeDescription}</Text>
                        ) : null}
                    </View>

                    <Text style={styles.label}>Select Language</Text>
                    <View style={styles.languageSelector}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                            {LANGUAGES.map(lang => (
                                <TouchableOpacity
                                    key={lang.id}
                                    style={[
                                        styles.langPill,
                                        language === lang.id && styles.activeLangPill
                                    ]}
                                    onPress={() => setLanguage(lang.id)}
                                >
                                    <Text style={[
                                        styles.langPillText,
                                        language === lang.id && styles.activeLangPillText
                                    ]}>
                                        {lang.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <Text style={styles.label}>Your Code</Text>
                    
                    <View style={styles.editorContainerOuter}>
                        <TextInput
                            style={[styles.editorContainerInner, { color: theme.colors.textDark }]}
                            multiline
                            textAlignVertical="top"
                            autoCapitalize="none"
                            autoCorrect={false}
                            spellCheck={false}
                            value={code}
                            onChangeText={setCode}
                            placeholder="// Write your solution here..."
                            placeholderTextColor={theme.colors.textLight}
                        />
                    </View>

                </ScrollView>
                <View style={styles.footer}>
                    <Button 
                        title="Submit Code" 
                        loading={loading} 
                        onPress={onSubmit} 
                    />
                </View>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    )
}

export default submitChallenge

const createStyles = (theme) => StyleSheet.create({
    container: {
        paddingHorizontal: wp(4),
        paddingBottom: hp(4),
        paddingTop: hp(2)
    },
    headerInfo: {
        marginBottom: hp(3),
        padding: 15,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border
    },
    subtitle: {
        fontSize: hp(1.6),
        color: theme.colors.textLight,
        marginBottom: 4
    },
    challengeTitle: {
        fontSize: hp(2.2),
        fontWeight: theme.fonts.bold,
        color: theme.colors.textDark,
        marginBottom: 8
    },
    challengeDesc: {
        fontSize: hp(1.8),
        color: theme.colors.text,
        lineHeight: hp(2.5)
    },
    label: {
        fontSize: hp(1.8),
        fontWeight: theme.fonts.semibold,
        color: theme.colors.text,
        marginBottom: hp(1.5),
        marginTop: hp(1)
    },
    languageSelector: {
        marginBottom: hp(3)
    },
    langPill: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.2),
        borderRadius: theme.radius.xxl,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border
    },
    activeLangPill: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primaryDark
    },
    langPillText: {
        fontSize: hp(1.7),
        fontWeight: theme.fonts.medium,
        color: theme.colors.text
    },
    activeLangPillText: {
        color: 'white',
        fontWeight: theme.fonts.bold
    },
    editorContainerOuter: {
        minHeight: hp(40),
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden'
    },
    editorContainerInner: {
        flex: 1,
        padding: 15,
        fontSize: hp(1.8),
        lineHeight: hp(2.6),
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    footer: {
        paddingHorizontal: wp(4),
        paddingBottom: hp(4),
        paddingTop: hp(1.5),
        backgroundColor: theme.colors.background,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border
    }
})
