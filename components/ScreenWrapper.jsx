import { StyleSheet, Text, View } from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import React from 'react'
import { useTheme } from '../context/ThemeContext'
const ScreenWrapper = ({children,bg}) => {
    const {top}=useSafeAreaInsets();
    const { theme } = useTheme();
    const paddingTop=top>0?top+5:30;
    
    // If the old code passes bg="white", we intelligently swap it to the dynamic theme background
    const backgroundColor = bg === 'white' ? theme.colors.background : (bg || theme.colors.background);

  return (
    <View style={{flex:1,paddingTop,backgroundColor}}>
      {
        children
      }
    </View>
  )
}

export default ScreenWrapper

const styles = StyleSheet.create({})