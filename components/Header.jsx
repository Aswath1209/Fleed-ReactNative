import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import BackButton from './BackButton'
import { hp } from '../helpers/common'
import { theme } from '../constants/theme'

const Header = ({
  title,
  showBackButton = true,
  mb = 10,
  router
}) => {
  return (
    <View style={[styles.container, { marginBottom: mb }]}>
      {
        showBackButton && (
          <View style={styles.BackButton}>
            <BackButton router={router} />
          </View>
        )
      }
      <Text style={styles.title}>
        {title || ""}
      </Text>
    </View>
  )
}

export default Header

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginTop: 5
  },
  title: {
    fontSize: hp(2.7),
    fontWeight: theme.fonts.semiBold,
    color: theme.colors.textDark
  },
  BackButton: {
    position: 'absolute',
    left: 0
  }

})