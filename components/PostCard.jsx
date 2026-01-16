import { Alert, StyleSheet, Text, TouchableOpacity, View, Share, Platform } from 'react-native'
import React, { useEffect, useState } from 'react'
import { theme } from '../constants/theme'
import { hp, stripHtmlTags, wp } from '../helpers/common'
import Avatar from './Avatar'
import moment from 'moment'
import Icon from '../assets/icons'
import RenderHtml from 'react-native-render-html'
import { Image } from 'expo-image'
import { downloadFile, getSupabaseFileUrl } from '../services/ImageService'
import { Video } from 'expo-av'
import { createPostLike, removePostLike } from '../services/postService'
import * as Sharing from 'expo-sharing'
import Loading from './Loading'

const PostCard = ({
    item,
    router,
    currentUser,
    hasShadow = true,
    showMoreIcon = true,
    showDelete = false,
    onDelete = () => { },
    onEdit = () => { }
}) => {

    const [likes, setLikes] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        setLikes(item?.postLikes)
    }, [])




    const shadowStyle = {
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 1
    }

    const textStyle = {
        color: theme.colors.dark,
        fontSize: hp(1.75)
    }
    const tagsStyles = {
        div: textStyle,
        p: textStyle,
        ol: textStyle,
        h1: {
            color: theme.colors.dark
        },
        h4: {
            color: theme.colors.dark
        }

    }


    const openPostDetails = () => {
        if (!showMoreIcon) return null;
        router.push({ pathname: 'postDetails', params: { postId: item?.id } })

    }

    const handlePostDelete = () => {
        Alert.alert("Confirm", "Are you sure you want to Delete?", [
            {
                text: 'Cancel',
                onPress: () => console.log("Delete Post Cancelled"),
                style: 'cancel'
            }, {
                text: "Delete",
                onPress: () => onDelete(item),
                style: 'destructive'
            }

        ])

    }


    const createdAt = moment(item?.created_at).format('MMM D')
    const liked = likes.filter(like => like.userId == currentUser?.id)[0] ? true : false;

    const onLike = async () => {
        let updatedLikes = likes.filter(like => like.userId != currentUser.id);
        if (liked) {
            setLikes([...updatedLikes])

            let res = await removePostLike(item?.id, currentUser?.id);
            if (!res.success) {
                Alert.alert("Post", res.msg)
            }

        } else {
            let data = {
                userId: currentUser?.id,
                postId: item?.id
            }
            setLikes([...likes, data])

            let res = await createPostLike(data);
            if (!res.success) {
                Alert.alert("Post", res.msg)
            }
        }

    }


    const onShare = async () => {
        let content = { message: stripHtmlTags(item?.body) };
        setLoading(true)
        try {
            if (item?.file) {
                let url = await downloadFile(getSupabaseFileUrl(item?.file).uri);
                setLoading(false)
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(url);
                } else {
                    content.url = url;
                    Share.share(content);
                }
            } else {
                setLoading(false)
                Share.share(content)
            }
        } catch (error) {
            setLoading(false);
            console.log("Share Error: ", error);
        }
    }

    const fileSource = React.useMemo(() => getSupabaseFileUrl(item?.file), [item?.file]);

    return (
        <View style={[styles.container, hasShadow && shadowStyle]}>
            <View style={styles.header}>
                <View style={styles.userInfo}>
                    <Avatar
                        size={hp(4.5)}
                        uri={item?.user?.image}
                        rounded={theme.radius.md}
                    />
                    <View style={{ gap: 2 }}>
                        <Text style={styles.username}>{item?.user?.name}</Text>
                        <Text style={styles.postItem}>{createdAt}</Text>

                    </View>

                </View>
                {showMoreIcon && (
                    <TouchableOpacity onPress={openPostDetails}>
                        <Icon name="threeDotsHorizontal" size={hp(3.4)} strokeWidth={3} color={theme.colors.text} />
                    </TouchableOpacity>)}
                {showDelete && currentUser.id == item.userId && (
                    <View style={styles.actions}>
                        <TouchableOpacity onPress={() => onEdit(item)}>
                            <Icon name="edit" size={hp(2.5)} color={theme.colors.text} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handlePostDelete}>
                            <Icon name="delete" size={hp(2.5)} strokeWidth={3} color={theme.colors.rose} />
                        </TouchableOpacity>

                    </View>
                )}
            </View>
            <View style={styles.content}>
                <View style={styles.postBody}>
                    {
                        item.body && (
                            <RenderHtml
                                contentWidth={wp(100)}
                                source={{ html: item?.body }}
                                tagsStyles={tagsStyles}
                            />
                        )
                    }
                </View>
                {
                    item?.file && item?.file?.includes('postImages') && (
                        <Image source={fileSource}
                            transition={100}
                            style={styles.postMedia}
                            contentFit='cover'
                        />
                    )
                }
                {
                    item?.file && item?.file?.includes('postVideos') && (
                        <Video
                            style={[styles.postMedia, { height: hp(30) }]}
                            source={fileSource}
                            useNativeControls
                            resizeMode='contain'
                            isLooping={false}
                            shouldPlay={false}
                            isMuted={false}
                        />
                    )
                }
            </View>
            <View style={styles.footer}>
                <View style={styles.footerButton}>
                    <TouchableOpacity onPress={onLike}>
                        <Icon name='heart' fill={liked ? theme.colors.rose : 'transparent'} color={liked ? theme.colors.rose : theme.colors.textLight} size={24} />
                    </TouchableOpacity>
                    <Text style={styles.count}>
                        {
                            likes?.length
                        }
                    </Text>
                </View>
                <View style={styles.footerButton}>
                    <TouchableOpacity onPress={openPostDetails} >
                        <Icon name='comment' color={theme.colors.textLight} size={24} />
                    </TouchableOpacity>
                    <Text style={styles.count}>
                        {
                            item?.comments[0]?.count
                        }
                    </Text>
                </View>

                <View style={styles.footerButton}>
                    {loading ? (<Loading size='small' />) : (
                        <TouchableOpacity onPress={onShare}>
                            <Icon name='share' color={theme.colors.textLight} size={24} />
                        </TouchableOpacity>
                    )}
                </View>

            </View>

        </View>
    )
}

export default PostCard

const styles = StyleSheet.create({
    count: {
        color: theme.colors.text,
        fontSize: hp(1.8),
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 18
    },
    footerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15
    },
    postBody: {
        marginLeft: 5
    },
    postMedia: {
        height: hp(40),
        width: '100%',
        borderRadius: theme.radius.xl,
        borderCurve: 'continuous',
    },
    content: {
        gap: 10
    },
    postItem: {
        fontSize: hp(1.4),
        color: theme.colors.textLight,
        fontWeight: theme.fonts.medium
    },
    username: {
        fontSize: hp(1.7),
        color: theme.colors.textDark,
        fontWeight: theme.fonts.medium
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    container: {
        gap: 10,
        borderRadius: theme.radius.xxl * 1.1,
        marginBottom: 15,
        borderCurve: 'continuous',
        padding: 10,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderWidth: 0.5,
        borderColor: theme.colors.gray,
        shadowColor: '#000'
    }
})