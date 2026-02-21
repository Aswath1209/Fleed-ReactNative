import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../constants/theme';
import { hp, wp } from '../helpers/common';
import { BlurView } from 'expo-blur';

const CustomAlert = ({ visible, title, message, buttons, onRequestClose }) => {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onRequestClose}
        >
            <View style={styles.centeredView}>
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={styles.modalView}>
                    {title && <Text style={styles.modalTitle}>{title}</Text>}
                    {message && <Text style={styles.modalText}>{message}</Text>}

                    <View style={styles.buttonContainer}>
                        {buttons && buttons.length > 0 ? (
                            buttons.map((btn, index) => (
                                <Pressable
                                    key={index}
                                    style={[
                                        styles.button,
                                        btn.style === 'cancel' ? styles.buttonCancel : styles.buttonConfirm,
                                        btn.style === 'destructive' && styles.buttonDestructive
                                    ]}
                                    onPress={() => {
                                        if (btn.onPress) btn.onPress();
                                        onRequestClose();
                                    }}
                                >
                                    <Text style={[
                                        styles.textStyle,
                                        btn.style === 'cancel' ? styles.textCancel : styles.textConfirm,
                                        btn.style === 'destructive' && styles.textDestructive
                                    ]}>
                                        {btn.text}
                                    </Text>
                                </Pressable>
                            ))
                        ) : (
                            <Pressable
                                style={[styles.button, styles.buttonConfirm]}
                                onPress={onRequestClose}
                            >
                                <Text style={[styles.textStyle, styles.textConfirm]}>OK</Text>
                            </Pressable>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: theme.radius.xxl,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: wp(80),
        maxWidth: 400
    },
    modalTitle: {
        marginBottom: 15,
        textAlign: 'center',
        fontSize: hp(2.2),
        fontWeight: theme.fonts.bold,
        color: theme.colors.textDark
    },
    modalText: {
        marginBottom: 25,
        textAlign: 'center',
        fontSize: hp(1.8),
        color: theme.colors.text,
        lineHeight: hp(2.4)
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'center',
        width: '100%',
        flexWrap: 'wrap'
    },
    button: {
        borderRadius: theme.radius.md,
        padding: 10,
        elevation: 2,
        minWidth: 80,
        alignItems: 'center'
    },
    buttonConfirm: {
        backgroundColor: theme.colors.primary,
        flex: 1
    },
    buttonCancel: {
        backgroundColor: theme.colors.gray,
        flex: 1
    },
    buttonDestructive: {
        backgroundColor: theme.colors.rose,
        flex: 1
    },
    textStyle: {
        fontWeight: theme.fonts.bold,
        textAlign: 'center',
        fontSize: hp(1.8)
    },
    textConfirm: {
        color: 'white'
    },
    textCancel: {
        color: theme.colors.textDark
    },
    textDestructive: {
        color: 'white'
    }
});

export default CustomAlert;
