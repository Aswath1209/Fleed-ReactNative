import { useRouter } from 'expo-router'
import moment from 'moment'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Autolink from 'react-native-autolink'
import Icon from '../assets/icons'
import { useTheme } from '../context/ThemeContext'
import { useAlert } from '../context/AlertContext'
import { useAuth } from '../context/AuthContext'
import { hp } from '../helpers/common'
import Avatar from './Avatar'
const CommentItem = ({
    item,
    canDelete = false,
    onDelete = () => { },
    highlight = false
}) => {

    const { showAlert } = useAlert();
    const { user: currentUser } = useAuth();
    const router = useRouter();
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const createdAt = moment(item?.created_at).format('MMM D');
    const handleDelete = async () => {
        showAlert("Confirm", "Are you sure,you want to delete?", [
            {
                text: 'Cancel',
                onPress: () => console.log("delete Cancelled"),
                style: 'cancel'
            }, {
                text: "Delete",
                onPress: () => onDelete(item),
                style: 'destructive'
            }

        ])

    }
    return (
        <View style={[styles.container, highlight && styles.highlight]}>
            <Avatar
                uri={item?.user?.image}
                showRank={true}
                xp={item?.user?.xp || 0}
            />
            <View style={styles.content}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <TouchableOpacity style={styles.nameContainer} onPress={() => {
                        if (item?.user?.id === currentUser?.id) {
                            router.push('/profile');
                        } else {
                            router.push({ pathname: '/userProfile', params: { userId: item?.user?.id } });
                        }
                    }}>
                        <Text style={styles.text}>
                            {
                                item?.user.name
                            }
                        </Text>
                        <Text> </Text>
                        <Text style={[styles.text, { color: theme.colors.textLight }]}>
                            {
                                createdAt
                            }
                        </Text>
                    </TouchableOpacity>
                    {canDelete && (
                        <TouchableOpacity onPress={handleDelete}>
                            <Icon
                                name='delete' size={20} color={theme.colors.rose}
                            />
                        </TouchableOpacity>
                    )}
                </View>

                <Autolink
                    text={item?.text || ''}
                    style={[styles.text, { fontWeight: 'normal' }]}
                    linkStyle={{ color: theme.colors.primary, textDecorationLine: 'underline' }}
                />
            </View>

        </View>
    )
}

export default CommentItem

const createStyles = (theme) => StyleSheet.create({
    text: {
        fontSize: hp(1.6),
        fontWeight: theme.fonts.medium,
        color: theme.colors.textDark
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3
    },
    highlight: {
        borderWidth: 0.2,
        backgroundColor: 'white',
        borderColor: theme.colors.dark,
        shadowColor: theme.colors.dark,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5
    },
    content: {
        backgroundColor: theme.colors.surface,
        flex: 1,
        gap: 5,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: theme.radius.md,
        borderCurve: 'continuous',
        borderWidth: 0.5,
        borderColor: theme.colors.border,
    },
    container: {
        flex: 1,
        flexDirection: 'row',
        gap: 7
    }
})