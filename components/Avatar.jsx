import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import {Image} from 'expo-image'
import { useTheme } from '../context/ThemeContext'
import { theme as constTheme } from '../constants/theme'
import { getUserImageSrc } from '../services/ImageService'
import { hp } from '../helpers/common'
import RankBorder from './RankBorder'

const Avatar = ({
    uri,
    size=hp(4.5),
    rounded=constTheme.radius.md,
    style={},
    xp=0,
    showRank=false
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const imageComponent = (
    <Image
      source={getUserImageSrc(uri)}
      transition={100}
      style={[styles.avatar,{height:size,width:size,borderRadius:rounded},style]}
    />
  );

  if (showRank) {
      return (
          <RankBorder xp={xp} size={size} rounded={rounded}>
              {imageComponent}
          </RankBorder>
      );
  }

  return imageComponent;
}

export default Avatar

const createStyles = (theme) => StyleSheet.create({
    avatar:{
        borderCurve:'continuous',
        borderColor:theme.colors.darkLight,
        borderWidth:1
    }
})