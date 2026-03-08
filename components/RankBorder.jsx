import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolateColor
} from 'react-native-reanimated';

// Helper function to calculate Level from XP
const getRankDetails = (xp) => {
    const level = Math.floor(xp / 100) + 1;
    
    // Bronze: Levels 1-4
    if (level < 5) return { tier: 'bronze', colors: ['#cd7f32', '#8B5A2B'], sizeBuffer: 6 };
    // Silver: Levels 5-9
    if (level < 10) return { tier: 'silver', colors: ['#E0E0E0', '#A9A9A9'], sizeBuffer: 8 };
    // Gold: Levels 10-14
    if (level < 15) return { tier: 'gold', colors: ['#FFD700', '#DAA520'], sizeBuffer: 10 };
    // Diamond: Levels 15+
    return { tier: 'diamond', colors: ['#00FFFF', '#8A2BE2'], sizeBuffer: 12 };
};

const RankBorder = ({ xp = 0, size = 40, rounded = 20, children }) => {
    const { tier, colors, sizeBuffer } = getRankDetails(xp);
    const borderSize = size + sizeBuffer;
    
    // Animation Values
    const scale = useSharedValue(1);
    const rotation = useSharedValue(0);
    const colorProgress = useSharedValue(0);

    useEffect(() => {
        if (tier === 'silver') {
            // Gentle pulsing scale
            scale.value = withRepeat(
                withSequence(
                    withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
                ),
                -1, // infinite
                true // reverse
            );
        } else if (tier === 'gold') {
            // Pulsing scale + pulsating colors
            scale.value = withRepeat(
                withSequence(
                    withTiming(1.08, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                true
            );
            colorProgress.value = withRepeat(
                withTiming(1, { duration: 1200 }),
                -1,
                true
            );
        } else if (tier === 'diamond') {
            // Rotating + pulsating colors
            rotation.value = withRepeat(
                withTiming(360, { duration: 3000, easing: Easing.linear }),
                -1,
                false
            );
            colorProgress.value = withRepeat(
                withTiming(1, { duration: 1500 }),
                -1,
                true
            );
        }
    }, [tier]);

    const animatedStyle = useAnimatedStyle(() => {
        let currentBorderColor = colors[0];
        
        if (tier === 'gold' || tier === 'diamond') {
            currentBorderColor = interpolateColor(
                colorProgress.value,
                [0, 1],
                [colors[0], colors[1]]
            );
        }

        return {
            transform: [
                { scale: scale.value },
                { rotate: `${rotation.value}deg` }
            ],
            borderColor: currentBorderColor,
        };
    });

    return (
        <View style={[styles.container, { width: borderSize, height: borderSize, borderRadius: rounded + (sizeBuffer/2) }]}>
            {/* The Animated Ring */}
            <Animated.View
                style={[
                    styles.ring,
                    { 
                        width: borderSize, 
                        height: borderSize, 
                        borderRadius: rounded + (sizeBuffer/2),
                        borderWidth: tier === 'bronze' ? 2 : (tier === 'diamond' ? 4 : 3),
                        borderColor: colors[0], // fallback
                    },
                    animatedStyle
                ]}
            />
            {/* The Avatar inside */}
            <View style={styles.childWrapper}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    ring: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
    childWrapper: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    }
});

export default RankBorder;
