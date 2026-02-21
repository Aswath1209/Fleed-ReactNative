import { Alert, Pressable, StyleSheet, Text, View, KeyboardAvoidingView, ScrollView, Platform } from 'react-native'
import React, { useRef, useState } from 'react'
import ScreenWrapper from '../components/ScreenWrapper'
import Icon from '../assets/icons'
import { StatusBar } from 'expo-status-bar'
import BackButton from '../components/BackButton'
import { useRouter } from 'expo-router'
import { theme } from '../constants/theme'
import { hp, wp } from '../helpers/common'
import Input from '../components/input'
import Button from '../components/Button'
import { supabase } from '../lib/supabase'
import { useAlert } from '../context/AlertContext'

const SignUp = () => {
    const router = useRouter();
    const { showAlert } = useAlert();
    const emailRef = useRef("")
    const nameRef = useRef("")
    const passwordRef = useRef("")
    const [loading, setLoading] = useState(false)
    const onSubmit = async () => {
        console.log("pressed")
        if (!emailRef.current || !passwordRef.current || !nameRef.current) {
            showAlert("SignUp", "Please fill all the field!")
            return;
        }
        let name = nameRef.current.trim()
        let email = emailRef.current.trim()
        let password = passwordRef.current.trim()

        setLoading(true);
        const { data: { session }, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name
                }
            }
        });

        if (error) {
            showAlert("SignUp", error.message)
            setLoading(false)
            return;
        }

        if (!session) {
            showAlert("SignUp Success", "Please check your inbox to enable your account!")
        }


        setLoading(false)
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
                            <Text style={styles.welcomeText}>Let's</Text>
                            <Text style={styles.welcomeText}>Get Started</Text>
                        </View>

                        <View style={styles.form}>
                            <Text style={{ fontSize: hp(1.5), color: theme.colors.text }}>
                                Please Enter The Details To Create An New Account
                            </Text>
                            <Input
                                icon={<Icon name='user' size={26} strokeWidth={1.6} />}
                                placeholder='Enter your Name'
                                onChangeText={value => nameRef.current = value}
                            />
                            <Input
                                icon={<Icon name="mail" size={26} strokeWidth={1.6} />}
                                placeholder='Enter your Email'
                                onChangeText={value => emailRef.current = value}
                            />
                            <Input
                                icon={<Icon name="lock" size={26} strokeWidth={1.6} />}
                                placeholder='Enter your Password'
                                securedTextEntry
                                onChangeText={value => passwordRef.current = value}
                            />

                            <Button title={"SignUp"} loading={loading} onPress={onSubmit} />
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>
                                Already Have An Account?
                            </Text>
                            <Pressable onPress={() => router.push('login')}>
                                <Text style={[styles.footerText, { color: theme.colors.primaryDark, fontWeight: theme.fonts.semiBold }]}>
                                    Login
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    )
}

export default SignUp

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

