import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import ScreenWrapper from '../../components/ScreenWrapper'
import { hp, wp } from '../../helpers/common'
import { theme } from '../../constants/theme'
import Header from '../../components/Header'
import { Image } from 'expo-image'
import { useAuth } from '../../context/AuthContext'
import { getUserImageSrc, uploadFile } from '../../services/ImageService'
import Icon from '../../assets/icons'
import Input from '../../components/input'
import Button from '../../components/Button'
import { updateUser } from '../../services/userService'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'

const EditProfile = () => {
    const { user: currentUser, setUserData } = useAuth();
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const [user, setUser] = useState({
        name: '',
        phoneNumber: '',
        image: null,
        bio: '',
        address: ''
    })

    useEffect(() => {
        if (currentUser) {
            setUser({
                name: currentUser.name || '',
                phoneNumber: currentUser.phoneNumber || '',
                image: currentUser.image || null,
                bio: currentUser.bio || '',
                address: currentUser.address || ''

            })
        }
    }, [])

    const onPickImage = async () => {

        let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Permission Required", "You need to allow access to your photos to upload an image.");
            return;
        }
        // Alert.alert("Debug", "Permissions Granted"); // Uncomment if needed for extreme debugging

        let Result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });
        if (!Result.canceled) {
            setUser({ ...user, image: Result.assets[0] })
        }

    }

    const onSubmit = async () => {
        let userData = { ...user };
        let { name, phoneNumber, address, bio, image } = userData

        if (!name || !phoneNumber || !address || !bio) {
            Alert.alert("Profile", "Please Fill All The Fields")
            return;
        }
        setLoading(true)
        // DEBUG LOGS
        console.log("Starting Update. Image type:", typeof image);

        if (typeof image == 'object') {
            let imageRes = await uploadFile('profiles', image?.uri, true)
            console.log("Upload Result:", imageRes); // DEBUG

            if (imageRes.success) {
                userData.image = imageRes.data;
            }
            else {
                userData.image = null;
            }
        }

        console.log("Updating User Data:", userData); // DEBUG

        const res = await updateUser(currentUser?.id, userData)
        setLoading(false)
        console.log("Update Result:", res); // DEBUG

        if (res.success) {
            setUserData({ ...currentUser, ...userData })
            router.back()
        }
    }

    let imageSource = user.image && typeof user.image == 'object' ? user.image.uri : getUserImageSrc(user.image)
    return (
        <ScreenWrapper bg="white">
            <View style={styles.container}>
                <ScrollView style={{ flex: 1 }}>
                    <Header title="Edit Profile" router={router}/>

                    <View style={styles.form}>
                        <View style={styles.avatarContainer}>
                            <Image source={imageSource} style={styles.avatar} />
                            <Pressable style={styles.cameraIcon} onPress={onPickImage}>
                                <Icon name="camera" size={20} strokeWidth={2.5} />
                            </Pressable>
                        </View>
                        <Text style={{ fontSize: hp(1.5), color: theme.colors.text }}>
                            Please Fill Your Profile Details
                        </Text>
                        <Input
                            icon={<Icon name="user" />}
                            placeholder="Enter Your Name"
                            value={user.name}
                            onChangeText={value => setUser({ ...user, name: value })}
                        />
                        <Input
                            icon={<Icon name="call" />}
                            placeholder="Enter Your Phone Number"
                            value={user.phoneNumber}
                            onChangeText={value => setUser({ ...user, phoneNumber: value })}
                        />
                        <Input
                            icon={<Icon name="location" />}
                            placeholder="Enter Your Address"
                            value={user.address}
                            onChangeText={value => setUser({ ...user, address: value })}
                        />
                        <Input
                            multiline={true}
                            containerStyle={styles.bio}
                            placeholder="Enter Your Bio"
                            value={user.bio}
                            onChangeText={value => setUser({ ...user, bio: value })}
                        />
                        <Button title="Update" loading={loading} onPress={onSubmit} />

                    </View>
                </ScrollView>
            </View>

        </ScreenWrapper>
    )
}

export default EditProfile

const styles = StyleSheet.create({
    bio: {
        flexDirection: 'row',
        height: hp(15),
        alignItems: 'flex-start',
        paddingVertical: 15
    },
    input: {
        flexDirection: 'row',
        borderWidth: 0.4,
        borderColor: theme.colors.text,
        borderRadius: theme.radius.xxl,
        borderCurve: 'continuous',
        padding: 17,
        paddingHorizontal: 20,
        gap: 15
    },
    form: {
        gap: 18,
        marginTop: 20
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: -10,
        padding: 8,
        borderRadius: 50,
        backgroundColor: 'white',
        shadowColor: theme.colors.textLight,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
        elevation: 7
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: theme.radius.xxl * 1.8,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: theme.colors.darkLight
    },
    avatarContainer: {
        height: hp(14),
        width: hp(14),
        alignSelf: 'center'
    },
    container: {
        flex: 1,
        paddingHorizontal: wp(4)
    }
})