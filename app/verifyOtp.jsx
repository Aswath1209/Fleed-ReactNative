import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native'
import OTPTextView from 'react-native-otp-textinput'
import BackButton from '../components/BackButton'
import Button from '../components/Button'
import ScreenWrapper from '../components/ScreenWrapper'
import { theme } from '../constants/theme'
import { useAlert } from '../context/AlertContext'
import { hp, wp } from '../helpers/common'
import { supabase } from '../lib/supabase'

const VerifyOtp = () => {
    const router = useRouter()
    const { email } = useLocalSearchParams();
    const { showAlert } = useAlert()
    const otpRef = useRef('')
    const [loading, setLoading] = useState(false)

    const onVerify = async () => {
        if (!otpRef.current) {
            showAlert("Verify OTP", "Please enter the OTP")
            return;
        }
        setLoading(true)
        const { data: { session }, error } = await supabase.auth.verifyOtp({
            email,
            token: otpRef.current,
            type: 'signup'
        })
        if (error) {
            showAlert("Verify OTP", error.message)
            setLoading(false)
            return;
        }
        if (session) {
            showAlert('Success', 'Account Verified Successfully')
            router.replace('home')
        }
    }

    return (
        <ScreenWrapper bg='white'>
            {/* The Back button should be self-contained at the top */}
            <View style={{ paddingHorizontal: wp(5), paddingTop: 10, paddingBottom: 10 }}>
                <BackButton router={router} />
            </View>

            {/* KeyboardAvoidingView takes the REST of the screen space */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <View style={styles.container}>
                    {/* Header Section */}
                    <View>
                        <Text style={styles.title}>Verify OTP</Text>
                        <Text style={styles.subTitle}>Sent a 6-digit code to {email}</Text>
                    </View>

                    {/* Form Section */}
                    <View style={styles.form}>
                        <OTPTextView
                            inputCount={6}
                            keyboardType='numeric'
                            handleTextChange={value => otpRef.current = value}
                            containerStyle={styles.otpContainer}
                            textInputStyle={styles.otpInput}
                        />
                        <Button title='Verify' onPress={onVerify} loading={loading} />
                    </View>
                </View>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    )
}

export default VerifyOtp

const styles = StyleSheet.create({
    container: {
        flex: 1,
        gap: 30,
        paddingHorizontal: wp(5),
        marginTop: hp(10)
    },
    title: {
        fontSize: hp(4),
        fontWeight: theme.fonts.bold,
        color: '#000000',

    },
    subTitle: {
        fontSize: hp(2),
        color: '#666666',
        marginTop: 10
    },
    form: {
        gap: 20
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 20
    },
    otpInput: {
        borderWidth: 1.5,
        borderColor: theme.colors.textLight,
        borderRadius: theme.radius.xl,
        width: wp(12),
        height: hp(6.5),
        color: '#000000',
        fontSize: hp(2.5),
        fontWeight: theme.fonts.bold,
        backgroundColor: 'white',
        borderBottomWidth: 1.5 // Override the library's default bottom border
    }
})
