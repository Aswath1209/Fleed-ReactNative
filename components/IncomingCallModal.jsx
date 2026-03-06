import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Image } from 'react-native';
import { hp, wp } from '../helpers/common';
import { theme } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const IncomingCallModal = ({ incomingCall, onAccept, onDecline }) => {
    if (!incomingCall) return null;

    return (
        <Modal transparent animationType="slide">
            <View style={styles.container}>
                <View style={styles.content}>
                    <Text style={styles.title}>Incoming Video Call</Text>

                    <Image
                        source={{ uri: incomingCall.senderImage || 'https://via.placeholder.com/150' }}
                        style={styles.avatar}
                    />

                    <Text style={styles.callerName}>{incomingCall.senderName}</Text>

                    <View style={styles.actionRow}>
                        <TouchableOpacity style={[styles.btn, styles.declineBtn]} onPress={onDecline}>
                            <Ionicons name="close" size={hp(4)} color="white" />
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.btn, styles.acceptBtn]} onPress={() => onAccept(incomingCall)}>
                            <Ionicons name="call" size={hp(4)} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default IncomingCallModal;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999
    },
    content: {
        width: wp(80),
        backgroundColor: '#222',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center'
    },
    title: {
        color: 'white',
        fontSize: hp(2),
        marginBottom: 20,
        opacity: 0.8
    },
    avatar: {
        width: hp(12),
        height: hp(12),
        borderRadius: hp(6),
        marginBottom: 15,
        backgroundColor: 'gray'
    },
    callerName: {
        color: 'white',
        fontSize: hp(3),
        fontWeight: 'bold',
        marginBottom: 30
    },
    actionRow: {
        flexDirection: 'row',
        gap: 40
    },
    btn: {
        width: hp(8),
        height: hp(8),
        borderRadius: hp(4),
        justifyContent: 'center',
        alignItems: 'center'
    },
    declineBtn: {
        backgroundColor: theme.colors.rose
    },
    acceptBtn: {
        backgroundColor: theme.colors.primary
    }
});
