import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import ScreenWrapper from '../../components/ScreenWrapper'
import Header from '../../components/Header'
import { hp, wp } from '../../helpers/common'
import { theme } from '../../constants/theme'
import Avatar from '../../components/Avatar'
import { useAuth } from '../../context/AuthContext'
import RichTextEditor from '../../components/RichTextEditor'
import { useLocalSearchParams, useRouter } from 'expo-router'
import Icon from '../../assets/icons'
import Button from '../../components/Button'
import * as ImagePicker from 'expo-image-picker'
import { getSupabaseFileUrl } from '../../services/ImageService'
import { Video } from 'expo-av';
import { createOrUpdatePost } from '../../services/postService'


const NewPost = () => {
  const post = useLocalSearchParams();

  const bodyRef = useRef("");
  const editorRef = useRef(null)
  const router = useRouter()

  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState(null)

  useEffect(() => {
    if (post && post.id) {
      bodyRef.current = post.body;
      setFile(post.file || null);
    }
  }, [])

  const onPick = async (isImage) => {
    let mediaConfig = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    }
    if (!isImage) {
      mediaConfig = {
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true
      }
    }
    let Result = await ImagePicker.launchImageLibraryAsync(mediaConfig);

    if (!Result.canceled) {
      setFile(Result.assets[0]);
    }

  }

  const isLocalFile = file => {
    if (!file) return null
    if (typeof file == 'object') {
      return true
    } else {
      return false
    }
  }
  const getFileType = file => {
    if (!file) return null;
    if (isLocalFile(file)) {
      return file.type;
    }
    if (file.includes('postImages')) {
      return 'image';
    }
    else {
      return 'video';
    }

  }
  const getFileUri = file => {
    if (!file) return null;
    if (isLocalFile(file)) {
      return file.uri;
    }
    return getSupabaseFileUrl(file)?.uri;
  }

  const onSubmit = async () => {
    console.log("Pressed")
    if (!bodyRef.current && !file) {
      Alert.alert("Post", "Please Choose An Image Or Text")
      return;
    }
    let data = {
      file,
      body: bodyRef.current,
      userId: user?.id
    }
    if (post && post.id) {
      data.id = post.id
    }
    setLoading(true)
    let res = await createOrUpdatePost(data)
    setLoading(false);
    if (res.success) {
      setFile(null)
      bodyRef.current = ''
      editorRef.current?.setContentHTML('')
      router.back();
    }

    if (!res.success) {
      Alert.alert("Post", res.msg)
    }

  }
  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        <Header title={post && post.id ? "Update Post" : "Create Post"} />
        <ScrollView contentContainerStyle={{ gap: 20 }}>
          <View style={styles.header}>
            <Avatar uri={user?.image} size={hp(6.5)} rounded={theme.radius.xl} />
            <View style={{ gap: 2 }}>
              <Text style={styles.userName}>
                {user && user.userName}

              </Text>
              <Text style={styles.publicText}>
                Public</Text>
            </View>

          </View>
          <View style={styles.textEditor}>
            <RichTextEditor
              editorRef={editorRef}
              onChange={body => bodyRef.current = body}
              initialContentHTML={post && post.id ? post.body : ""}
            />

          </View>

          {file && (
            <View style={styles.file}>
              {
                getFileType(file) == "video" ? (
                  <Video style={{ flex: 1 }}
                    source={{
                      uri: getFileUri(file)
                    }}
                    useNativeControls
                    resizeMode='cover'
                    isLooping
                  />
                ) : (
                  <Image source={{ uri: getFileUri(file) }} resizeMethod='cover' style={{ flex: 1 }} />
                )
              }
              <Pressable style={styles.closeIcon} onPress={() => setFile(null)}>
                <Icon name="delete" size={20} color="white" />
              </Pressable>
            </View>
          )}
          <View style={styles.media}>
            <Text style={styles.addImageText}>Add to your post</Text>
            <View style={styles.medianIcons}>
              <TouchableOpacity onPress={() => onPick(true)}>
                <Icon name="image" size={30} color={theme.colors.dark} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onPick(false)}>
                <Icon name="video" size={33} color={theme.colors.dark} />
              </TouchableOpacity>

            </View>
          </View>

        </ScrollView>
        <Button
          buttonStyle={{ height: hp(6.2) }}
          title={post && post.id ? "Update" : "Post"}
          hasShadow={false}
          onPress={onSubmit}
        />

      </View>


    </ScreenWrapper>
  )
}

export default NewPost

const styles = StyleSheet.create({
  closeIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,0,0,0.6)',
    padding: 7,
    borderRadius: 50
  },
  videos: {

  },
  file: {
    height: hp(30),
    width: '100%',
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    borderCurve: 'continuous'
  },
  imageIcon: {
    borderRadius: theme.radius.md
  },
  addImageText: {
    fontSize: hp(1.9),
    fontWeight: theme.fonts.semiBold,
    color: theme.colors.text
  },
  medianIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15
  },
  media: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    padding: 12,
    paddingHorizontal: 18,
    borderRadius: theme.radius.xl,
    borderCurve: 'continuous',
    borderColor: theme.colors.gray
  },
  textEditor: {

  },
  publicText: {
    fontSize: hp(1.7),
    fontWeight: theme.fonts.medium,
    color: theme.colors.textLight
  },
  avatar: {
    height: hp(6.5),
    width: hp(6.5),
    borderRadius: theme.radius.xl,
    borderColor: 'rgba(0,0,0,0.1)',
    borderWidth: 1,
    borderCurve: 'continuous'

  },
  userName: {
    fontSize: hp(2.5),
    fontWeight: theme.fonts.semiBold,
    color: theme.colors.text,
    textAlign: 'center'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 17
  },
  title: {
    fontSize: hp(2.5),
    fontWeight: theme.fonts.semiBold,
    color: theme.colors.text,
    textAlign: 'center'
  },
  container: {
    flex: 1,
    marginBottom: 30,
    paddingHorizontal: wp(4),
    gap: 15
  }

})