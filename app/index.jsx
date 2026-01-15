import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import ScreenWrapper from '../components/ScreenWrapper'
import Loading from '../components/Loading'

const Index = () => {
  return (
    <View style={{flex:1,alignItems:'center',justifyContent:'center'}}>
      <Loading/>
    </View>
  )
}

export default Index

const styles = StyleSheet.create({})