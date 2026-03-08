import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useTheme } from '../context/ThemeContext'

const Loading = ({size="large",color}) => {
  const { theme } = useTheme();
  const indicatorColor = color || theme.colors.primary;
  
  return (
    <View style={{justifyContent:'center',alignItems:'center'}}>
        <ActivityIndicator size={size} color={indicatorColor}/>
    </View>
  )
}

export default Loading

const styles = StyleSheet.create({})