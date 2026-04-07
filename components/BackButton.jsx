import { Pressable, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Icon from '../assets/icons'
import { useTheme } from '../context/ThemeContext'
import { useRouter } from 'expo-router'

const BackButton = ({size=26, router, onBack}) => {
  const { theme } = useTheme();
  const internalRouter = useRouter();
  const currentRouter = router || internalRouter;
  const styles = createStyles(theme);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      currentRouter.back();
    }
  };

  return (
    <Pressable onPress={handleBack} style={styles.buttonStyle}>
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