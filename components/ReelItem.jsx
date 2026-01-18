import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import { Video } from 'expo-av'
import { hp, wp, stripHtmlTags } from '../helpers/common'
import { Dimensions } from 'react-native'
import { downloadFile, getSupabaseFileUrl, getUserImageSrc } from '../services/ImageService'
import Icon from '../assets/icons'
import { createPostLike, removePostLike } from '../services/postService'
import { useAuth } from '../context/AuthContext'
import { theme } from '../constants/theme'
import Avatar from './Avatar'
import { Share } from 'react-native'
import * as Sharing from 'expo-sharing'
import { useRouter } from 'expo-router'

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

const ReelItem = ({ item, isActive }) => {

    const router = useRouter();
    const { user: currentUser } = useAuth()

    const [likes, setLikes] = useState(item?.postLikes || [])
    const [isPaused, setIsPaused] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const[loading,setLoading]=useState(false)

    const liked = likes.filter(like => like.userId == currentUser.id)[0] ? true : false;

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

    return (
        <View style={styles.container}>
            <TouchableOpacity
                activeOpacity={1}
                onPress={() => setIsPaused(!isPaused)}
                style={styles.videoContainer}
            >
                <Video
                    style={styles.postMedia}
                    source={getSupabaseFileUrl(item.file)}
                    resizeMode='contain'
                    isLooping={true}
                    shouldPlay={isActive && !isPaused}
                    isMuted={isMuted}
                />

                {/* Play/Pause Overlay Icon (Optional: Show only when paused) */}
                {isPaused && (
                    <View style={styles.playIconWrapper}>
                        <Icon name="play" size={hp(6)} color="rgba(255,255,255,0.6)" />
                    </View>
                )}

            </TouchableOpacity>

            {/* Mute Button */}
            <TouchableOpacity
                onPress={() => setIsMuted(!isMuted)}
                style={styles.muteButton}
            >
                <Icon name={isMuted ? "mute" : "volume"} size={hp(3)} color="white" />
            </TouchableOpacity>

            <View style={styles.overlay}>

                {/* Content Section (Bottom Left) */}
                <View style={styles.content}>
                    <TouchableOpacity onPress={() => router.push({ pathname: 'profile', params: { userId: item?.user?.id } })} style={styles.userRow}>
                        <Avatar
                            uri={item?.user?.image}
                            size={hp(5)}
                            rounded={theme.radius.xl}
                        />
                        <Text style={styles.username}>{item?.user?.name}</Text>
                    </TouchableOpacity>
                    <Text style={styles.caption} numberOfLines={2}>
                        {stripHtmlTags(item?.body)}
                    </Text>
                </View>

                {/* Actions Section (Right Side) */}
                <View style={styles.actions}>
                    <TouchableOpacity onPress={onLike} style={styles.actionButton}>
                        <Icon name="heart" size={hp(3.5)} fill={liked ? theme.colors.rose : 'transparent'} color={liked ? theme.colors.rose : 'white'} />
                        <Text style={styles.actionText}>{likes.length}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton}>
                        <Icon name="comment" onPress={() => {
                            router.push({ pathname: '/feedComment', params: { postId: item?.id } })
                        }} size={hp(3.5)} color={'white'} />
                        <Text style={styles.actionText}>{item?.comments?.length || 0}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={onShare}>
                        <Icon name="share" size={hp(3.5)} color={'white'} />
                    </TouchableOpacity>
                </View>

            </View>
        </View>
    )
}

export default ReelItem

const styles = StyleSheet.create({
    container: {
        width: screenWidth,
        height: screenHeight, // Explicit height for paging
        backgroundColor: 'black'
    },
    videoContainer: {
        width: '100%',
        height: '100%',
    },
    playIconWrapper: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -25 }, { translateY: -25 }], // Center logic manually or use wrapper alignment
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 50,
        padding: 15,
        zIndex: 5
    },
    muteButton: {
        position: 'absolute',
        top: hp(6), // Increased safe area top
        right: wp(4),
        zIndex: 10, // Higher z-index ensures clickable
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 50
    },
    postMedia: {
        width: '100%',
        height: '100%',
        position: 'absolute'
    },
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        padding: hp(2),
        paddingBottom: hp(12), // Adjusted for tab bar clearance
        zIndex: 10
    },
    content: {
        flex: 1,
        gap: 10,
        paddingRight: 20
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    username: {
        color: 'white',
        fontSize: hp(2),
        fontWeight: theme.fonts.bold
    },
    caption: {
        color: 'white',
        fontSize: hp(1.8),
        fontWeight: theme.fonts.medium
    },
    actions: {
        gap: 25,
        alignItems: 'center',
        paddingBottom: 10
    },
    actionButton: {
        alignItems: 'center',
        gap: 5
    },
    actionText: {
        color: 'white',
        fontSize: hp(1.5),
        fontWeight: theme.fonts.bold
    }
})