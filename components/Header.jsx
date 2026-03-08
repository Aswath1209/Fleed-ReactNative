import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import BackButton from './BackButton'
import { hp } from '../helpers/common'
import { useTheme } from '../context/ThemeContext'

import Avatar from './Avatar'; // Import Avatar

const Header = ({
  title,
  showBackButton = true,
  mb = 10,
  router,
  userImage, // New prop
  rightActions // Prop for adding buttons on the right
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={[styles.container, { marginBottom: mb }]}>
      {
        showBackButton && (
          <View style={styles.BackButton}>
            <BackButton router={router} />
          </View>
        )
      }
      <View style={styles.titleContainer}>
        {userImage && <Avatar uri={userImage} size={hp(4.5)} />}
        <Text style={styles.title}>
          {title || ""}
        </Text>
      </View>
      <View style={styles.rightActions}>
        {rightActions}
      </View>
    </View>
  )
}

export default Header

const createStyles = (theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
    paddingHorizontal: 20 // Added padding for better alignment if needed
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  title: {
    fontSize: hp(2.3), // Slightly reduced font size to fit with avatar
    fontWeight: theme.fonts.semiBold,
    color: theme.colors.textDark
  },
  BackButton: {
    position: 'absolute',
    left: 20,
    zIndex: 1
  },
  rightActions: {
    position: 'absolute',
    right: 20,
    zIndex: 1
  }

})