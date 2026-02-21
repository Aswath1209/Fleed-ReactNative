import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import BackButton from './BackButton'
import { hp } from '../helpers/common'
import { theme } from '../constants/theme'

import Avatar from './Avatar'; // Import Avatar

const Header = ({
  title,
  showBackButton = true,
  mb = 10,
  router,
  userImage // New prop
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
      {userImage && <Avatar uri={userImage} size={hp(4.5)} />}
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
    marginTop: 5,
    paddingHorizontal: 20 // Added padding for better alignment if needed
  },
  title: {
    fontSize: hp(2.3), // Slightly reduced font size to fit with avatar
    fontWeight: theme.fonts.semiBold,
    color: theme.colors.textDark
  },
  BackButton: {
    position: 'absolute',
    left: 0
  }

})