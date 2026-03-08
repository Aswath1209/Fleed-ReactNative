import { Pressable, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Icon from '../assets/icons'
import { useTheme } from '../context/ThemeContext'

const BackButton = ({size=26,router}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <Pressable onPress={()=>router.back()} style={styles.buttonStyle}>
        <Icon name="arrowLeft" strokeWidth={2.5} size={size} color={theme.colors.text}/>
    </Pressable>
  )
}

export default BackButton

const createStyles = (theme) => StyleSheet.create({
    buttonStyle:{
        alignSelf:'flex-start',
        padding:5,
        borderRadius:theme.radius.sm,
        backgroundColor: theme.colors.surface === '#ffffff' ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)'
    }
})