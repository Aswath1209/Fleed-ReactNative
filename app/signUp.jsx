import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
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

const SignUp = () => {
    const router = useRouter();
    const emailRef = useRef("")
    const nameRef = useRef("")
    const passwordRef = useRef("")
    const [loading, setLoading] = useState(false)
    const onSubmit = async () => {
        console.log("pressed")
        if (!emailRef.current || !passwordRef.current || !nameRef.current) {
            Alert.alert("SignUp", "Please fill all the field!")
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
            Alert.alert("SignUp", error.message)
            setLoading(false) // moved this inside error block or after success logic to ensure it doesn't stop too early
            return; // added return
        }
        // console.log("session", session);



        if (!session) {
            Alert.alert("SignUp Success", "Please check your inbox to enable your account!")
        }


        setLoading(false)
    }
    return (
        <ScreenWrapper bg="white">
            <StatusBar style="dark" />
            <View style={styles.container}>
                <BackButton router={router} />
            </View>
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
        paddingHorizontal: wp(5)
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

