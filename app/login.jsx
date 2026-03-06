import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React, { useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import Icon from '../assets/icons'
import BackButton from '../components/BackButton'
import Button from '../components/Button'
import Input from '../components/input'
import ScreenWrapper from '../components/ScreenWrapper'
import { theme } from '../constants/theme'
import { useAlert } from '../context/AlertContext'
import { hp, wp } from '../helpers/common'
import { supabase } from '../lib/supabase'

const Login = () => {
    const router = useRouter();
    const { showAlert } = useAlert();
    const emailRef = useRef("")
    const passwordRef = useRef("")
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const onSubmit = async () => {
        if (!emailRef.current || !passwordRef.current) {
            showAlert("Login", "Please fill all the field!")
            return;
        }
        let email = emailRef.current.trim()
        let password = passwordRef.current.trim()
        setLoading(true)
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        setLoading(false)
        if (error) {
            showAlert('Login', error.message)
        }

    }
    return (
        <ScreenWrapper bg="white">
            <StatusBar style="dark" />
            <View style={{ paddingHorizontal: wp(5), paddingTop: 10, paddingBottom: 10 }}>
                <BackButton router={router} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.container}>

                        <View>
                            <Text style={styles.welcomeText}>Hey,</Text>
                            <Text style={styles.welcomeText}>Welcome Back</Text>
                        </View>

                        <View style={styles.form}>
                            <Text style={{ fontSize: hp(1.5), color: theme.colors.text }}>
                                Please login to continue
                            </Text>
                            <Input
                                icon={<Icon name="mail" size={26} strokeWidth={1.6} />}
                                placeholder='Enter your Email'
                                onChangeText={value => emailRef.current = value}
                            />
                            <Input
                                icon={<Icon name="lock" size={26} strokeWidth={1.6} />}
                                placeholder='Enter your Password'
                                secureTextEntry={!showPassword}
                                onChangeText={value => passwordRef.current = value}
                                rightIcon={
                                    <Pressable onPress={() => setShowPassword(!showPassword)}>
                                        <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color={theme.colors.textLight} />
                                    </Pressable>
                                }
                            />
                            <Text style={styles.forgotPassword}>
                                Forgot Password?
                            </Text>
                            <Button title={"Log In"} loading={loading} onPress={onSubmit} />
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>
                                Don&apos;t have an account?
                            </Text>
                            <Pressable onPress={() => router.push('signUp')}>
                                <Text style={[styles.footerText, { color: theme.colors.primaryDark, fontWeight: theme.fonts.semiBold }]}>
                                    Sign Up
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    )
}

export default Login

const styles = StyleSheet.create({
    footerText: {
        textAlign: 'center',
        color: theme.colors.text,
        fontSize: hp(1.6)
    },
    container: {
        flex: 1,
        gap: 45,
        paddingHorizontal: wp(5),
        justifyContent: 'center'
    },
    welcomeText: {
        fontSize: hp(4),
        fontWeight: theme.fonts.bold,
        color: theme.colors.text,
    },
    form: {
        gap: 25,
    },
    forgotPassword: {
        textAlign: 'right',
        fontWeight: theme.fonts.semiBold,
        color: theme.colors.text,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5,
    }
})
