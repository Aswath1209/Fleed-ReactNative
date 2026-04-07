import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, PermissionsAndroid, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChannelProfileType, ClientRoleType, createAgoraRtcEngine, RtcSurfaceView } from 'react-native-agora';
import { theme } from '../constants/theme';
import { hp, wp } from '../helpers/common';
import { supabase } from '../lib/supabase';

const AGORA_APP_ID = '744e49d7007248fc85a436dc1a5af14a';

const VideoCall = ({ channelName, onClose, currentUserId, otherUserName, otherUserId, useAvatarMode = false }) => {
    const agoraEngineRef = useRef(null); // Agora engine instance
    const [isJoined, setIsJoined] = useState(false); // Indicates if the local user has joined the channel
    const [remoteUid, setRemoteUid] = useState(0); // Uid of the remote user
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isEngineInitialized, setIsEngineInitialized] = useState(false);

    useEffect(() => {
        // Automatically request permissions and join as soon as it opens
        const init = async () => {
            if (Platform.OS === 'android') {
                const result = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                ]);

                const audioGranted = result[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
                const cameraGranted = result[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
                if (!audioGranted || !cameraGranted) {
                    Alert.alert('Permission required', 'Camera and microphone permissions are required for video calls.');
                    onClose?.();
                    return;
                }
            }
            await setupVideoSDKEngine();
            join();
        };

        init();

        // Use a unique channel name suffix so teardown here never removes
        // the _layout.jsx global incoming-call listener (both would otherwise
        // share the same `profile:${userId}_call_signal` topic).
        const declineListenerName = `profile:${currentUserId}_call_signal_videocall_${channelName}`;
        const channel = supabase.channel(declineListenerName)
            .on('broadcast', { event: 'call_declined' }, (payload) => {
                if (payload.payload?.roomId === channelName) {
                    Alert.alert("Call Declined", `${otherUserName || 'User'} declined your call.`);
                    leave(true);
                }
            })
            .subscribe();

        return () => {
            leave(true); // Don't send cancel on unmount if they declined, or maybe just call leave()
            agoraEngineRef.current?.unregisterEventHandler();
            agoraEngineRef.current?.release();
            supabase.removeChannel(channel);
        }
    }, []);

    const setupVideoSDKEngine = async () => {
        try {
            // use the helper function to get permissions
            agoraEngineRef.current = createAgoraRtcEngine();
            const agoraEngine = agoraEngineRef.current;
            agoraEngine.registerEventHandler({
                onJoinChannelSuccess: () => {
                    console.log('Successfully joined the channel ' + channelName);
                    setIsJoined(true);
                },
                onUserJoined: (_connection, Uid) => {
                    console.log('Remote user joined with uid ' + Uid);
                    setRemoteUid(Uid);
                },
                onUserOffline: (_connection, Uid) => {
                    console.log('Remote user left the channel. uid: ' + Uid);
                    setRemoteUid(0);
                },
            });
            agoraEngine.initialize({
                appId: AGORA_APP_ID,
                channelProfile: ChannelProfileType.ChannelProfileCommunication,
            });
            agoraEngine.enableVideo();
            if (useAvatarMode) {
                // Privacy mode: keep call connected but hide camera stream.
                agoraEngine.muteLocalVideoStream(true);
            }
            setIsEngineInitialized(true);
        } catch (e) {
            console.log(e);
        }
    };

    const join = async () => {
        if (isJoined) {
            return;
        }
        try {
            agoraEngineRef.current?.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);
            agoraEngineRef.current?.startPreview();
            // Critical Fix: uid MUST be an integer. Passing currentUserId (a string) silently fails.
            agoraEngineRef.current?.joinChannel('', channelName, 0, {
                clientRoleType: ClientRoleType.ClientRoleBroadcaster,
            });
        } catch (e) {
            console.log(e);
        }
    };

    const leave = (skipCancel = false) => {
        try {
            if (!remoteUid && !skipCancel && otherUserId) {
                // We are leaving before they joined, let's tell them to stop ringing
                const cancelChannel = supabase.channel(`profile:${otherUserId}_call_signal`);
                cancelChannel.subscribe(async (status) => {
                    if (status === 'SUBSCRIBED') {
                        try {
                            await cancelChannel.send({
                                type: 'broadcast',
                                event: 'call_cancelled',
                                payload: { roomId: channelName }
                            });
                        } catch (error) {
                            console.log('Failed to send call_cancelled signal', error);
                        }
                        supabase.removeChannel(cancelChannel);
                    }
                });
            }

            agoraEngineRef.current?.leaveChannel();
            setRemoteUid(0);
            setIsJoined(false);
            if (onClose) onClose();
        } catch (e) {
            console.log(e);
        }
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
        agoraEngineRef.current?.muteLocalAudioStream(!isMuted);
    }

    const toggleVideo = () => {
        setIsVideoOff(!isVideoOff);
        agoraEngineRef.current?.muteLocalVideoStream(!isVideoOff);
    }

    const switchCamera = () => {
        agoraEngineRef.current?.switchCamera();
    }

    return (
        <View style={styles.container}>
            {isEngineInitialized && (
                <React.Fragment>
                    {/* Remote View */}
                    {useAvatarMode ? (
                        <View style={[styles.remoteVideo, styles.avatarRemoteContainer]}>
                            <View style={styles.avatarCircleLarge}>
                                <Ionicons name="man" size={hp(12)} color="white" />
                            </View>
                            <Text style={styles.avatarName}>{otherUserName || "Guest User"}</Text>
                            <Text style={styles.avatarStatus}>Speaking...</Text>
                        </View>
                    ) : remoteUid !== 0 ? (
                        <RtcSurfaceView
                            canvas={{ uid: remoteUid }}
                            style={styles.remoteVideo}
                        />
                    ) : (
                        <View style={[styles.remoteVideo, styles.waitingContainer]}>
                            <Text style={styles.waitingText}>Waiting for {otherUserName || "Other User"} to join...</Text>
                        </View>
                    )}

                    {/* Local View */}
                    <View style={styles.localVideoWrapper}>
                        {useAvatarMode ? (
                            <View style={styles.localAvatarContainer}>
                                <View style={styles.avatarCircleSmall}>
                                    <Ionicons name="man" size={hp(4.3)} color="white" />
                                </View>
                                <Text style={styles.localAvatarLabel}>You</Text>
                            </View>
                        ) : (
                            <RtcSurfaceView
                                canvas={{ uid: 0 }}
                                style={styles.localVideoInner}
                                zOrderMediaOverlay={true}
                            />
                        )}
                    </View>

                    {/* Controls */}
                    <View style={styles.controlBar}>
                        <TouchableOpacity onPress={toggleVideo} style={[styles.controlBtn, isVideoOff && styles.mutedBtn]}>
                            <Ionicons name={isVideoOff ? "videocam-off" : "videocam"} size={hp(3)} color={isVideoOff ? "white" : theme.colors.textDark} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={toggleMute} style={[styles.controlBtn, isMuted && styles.mutedBtn]}>
                            <Ionicons name={isMuted ? "mic-off" : "mic"} size={hp(3)} color={isMuted ? "white" : theme.colors.textDark} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={leave} style={[styles.controlBtn, styles.endCallBtn]}>
                            <Ionicons name="call" size={hp(3)} color="white" />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={switchCamera} style={styles.controlBtn}>
                            <Ionicons name="camera-reverse" size={hp(3)} color={theme.colors.textDark} />
                        </TouchableOpacity>
                    </View>
                </React.Fragment>
            )}
        </View>
    );
};

export default VideoCall;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    remoteVideo: {
        flex: 1,
    },
    waitingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#222',
    },
    waitingText: {
        color: 'white',
        fontSize: hp(2),
    },
    avatarRemoteContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1f2430',
        gap: 12
    },
    avatarCircleLarge: {
        width: hp(20),
        height: hp(20),
        borderRadius: hp(10),
        backgroundColor: '#2f6fed',
        alignItems: 'center',
        justifyContent: 'center'
    },
    avatarName: {
        color: 'white',
        fontSize: hp(2.6),
        fontWeight: '700'
    },
    avatarStatus: {
        color: '#c8d2ff',
        fontSize: hp(1.9)
    },
    localVideoWrapper: {
        position: 'absolute',
        bottom: hp(15),
        right: wp(5),
        width: wp(30),
        height: hp(20),
        borderRadius: 15,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
        overflow: 'hidden',
        zIndex: 10,
        backgroundColor: 'black'
    },
    localVideoInner: {
        flex: 1,
    },
    localAvatarContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#121620'
    },
    avatarCircleSmall: {
        width: hp(7.2),
        height: hp(7.2),
        borderRadius: hp(3.6),
        backgroundColor: '#2f6fed',
        alignItems: 'center',
        justifyContent: 'center'
    },
    localAvatarLabel: {
        color: 'white',
        fontSize: hp(1.4),
        marginTop: 6,
        fontWeight: '600'
    },
    controlBar: {
        position: 'absolute',
        bottom: hp(4),
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: wp(8),
        zIndex: 10,
    },
    controlBtn: {
        width: hp(6),
        height: hp(6),
        borderRadius: hp(3),
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mutedBtn: {
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    endCallBtn: {
        width: hp(8),
        height: hp(8),
        borderRadius: hp(4),
        backgroundColor: theme.colors.rose,
    },
    startContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.dark,
        gap: 20
    },
    startTitle: {
        color: 'white',
        fontSize: hp(3),
        fontWeight: theme.fonts.bold,
        marginBottom: 20
    },
    joinBtn: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: theme.radius.xl
    },
    joinText: {
        color: 'white',
        fontSize: hp(2),
        fontWeight: theme.fonts.bold
    },
    cancelBtn: {
        paddingHorizontal: 40,
        paddingVertical: 15,
    },
    cancelText: {
        color: 'white',
        fontSize: hp(2),
    }
});
