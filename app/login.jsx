import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import React, { useRef, useState } from 'react'
import ScreenWrapper from '../components/ScreenWrapper'
import Home from '../assets/icons/Home'
import Icon from '../assets/icons'
import { StatusBar } from 'expo-status-bar'
import BackButton from '../components/BackButton'
import { useRouter } from 'expo-router'
import { theme } from '../constants/theme'
import { hp, wp } from '../helpers/common'
import Input from '../components/input'
import Button from '../components/Button'
import { supabase } from '../lib/supabase'

const Login = () => {
    const router=useRouter();
    const emailRef=useRef("")
    const passwordRef=useRef("")
    const[loading,setLoading]=useState(false)
    const onSubmit=async ()=> {
        if(!emailRef.current || !passwordRef.current){
            Alert.alert("Login","Please fill all the field!")
            return;
        }
        let email=emailRef.current.trim()
        let password=passwordRef.current.trim()
        setLoading(true)
        const{error}=await supabase.auth.signInWithPassword({
            email,
            password
        });
        setLoading(false)
        if(error){
            Alert.alert('Login',error.message)
        }

    }
  return (
    <ScreenWrapper bg="white">
      <StatusBar style="dark"/>
      <View style={styles.container}>
        <BackButton router={router}/>
      </View>
      <View>
        <Text style={styles.welcomeText}>Hey,</Text>
        <Text style={styles.welcomeText}>Welcome Back</Text>
        
      </View>
      <View style={styles.form}>
        <Text style={{fontSize:hp(1.5),color:theme.colors.text}}>
            Please login to continue
        </Text>
        <Input
        icon={<Icon name="mail" size={26} strokeWidth={1.6}/>}
        placeholder='Enter your Email'
        onChangeText={value=>emailRef.current=value}
        />
        <Input
        icon={<Icon name="lock" size={26} strokeWidth={1.6}/>}
        placeholder='Enter your Password'
        securedTextEntry
        onChangeText={value=>passwordRef.current=value}
        />
        <Text style={styles.forgotPassword}>
            Forgot Password?
        </Text>
        <Button title={"Log In"} loading={loading} onPress={onSubmit}/>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>
            Don't have an account?
        </Text>
        <Pressable onPress={()=>router.push('login')}>
            <Text style={[styles.footerText,{color:theme.colors.primaryDark,fontWeight:theme.fonts.semiBold}]}>
                Sign Up
            </Text>
        </Pressable>
      </View>
    </ScreenWrapper>
  )
}

export default Login

const styles = StyleSheet.create({
    footerText:{
        textAlign:'center',
        color:theme.colors.text,
        fontSize:hp(1.6)
    },
    container:{
        flex:1,
        gap:45,
        paddingHorizontal:wp(5)
    },
    welcomeText:{
        fontSize:hp(4),
        fontWeight:theme.fonts.bold,
        color:theme.colors.text,
    },
    form:{
        gap:25,
    },
    forgotPassword:{
        textAlign:'right',
        fontWeight:theme.fonts.semiBold,
        color:theme.colors.text,
    },
    footer:{
        flexDirection:'row',
        justifyContent:'center',
        alignItems:'center',
        gap:5,
    }
})

