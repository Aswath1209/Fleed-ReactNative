import React from 'react'
import { StyleSheet, TextInput, View } from 'react-native'
import { useTheme } from '../context/ThemeContext'
import { hp } from '../helpers/common'


const Input = (props) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={[styles.container, props.containerStyle && props.containerStyle]}>
      {
        props.icon && props.icon
      }
      <TextInput
        style={{ flex: 1, color: theme.colors.text }}
        placeholderTextColor={theme.colors.textLight}
        ref={props.inputRef && props.inputRef}
        {...props} />
      {
        props.rightIcon && props.rightIcon
      }
    </View>
  )
}

export default Input

const createStyles = (theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: hp(7.2),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.4,
    borderColor: theme.colors.text,
    borderRadius: theme.radius.xxl,
    borderCurve: 'continuous',
    paddingHorizontal: 18,
    gap: 12,
  }
})