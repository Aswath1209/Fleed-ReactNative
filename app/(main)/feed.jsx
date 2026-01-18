import { Dimensions, FlatList, StyleSheet, Text, View } from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'

const { height: screenHeight } = Dimensions.get('window');


import { fetchReels } from '../../services/feedService'
import ReelItem from '../../components/ReelItem'
import { useFocusEffect } from 'expo-router'
import ScreenWrapper from '../../components/ScreenWrapper'
import { hp } from '../../helpers/common'

const Feed = () => {

    const [isFetching, setIsFetching] = useState(false)
    const [post, setPost] = useState([])
    const [hasMore, setHasMore] = useState(true)
    const [isFocused, setIsFocused] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0)

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index || 0)
        }
    })

    useEffect(() => {
        getPosts()
    }, [])
    useFocusEffect(
        useCallback(() => {
            setIsFocused(true); // Screen gained focus
            return () => {
                setIsFocused(false); // Screen lost focus
            }
        }, [])
    );

    const getPosts = async () => {
        if (!hasMore || isFetching) return null;
        setIsFetching(true);
        try {
            let res = await fetchReels(post.length + 5);
            if (res.success) {
                if (post.length == res.data.length) {
                    setHasMore(false)
                }
                setPost(res.data)
            }
        } finally {
            setIsFetching(false);
        }
    }
    return (
        <FlatList
            data={post}
            renderItem={({ item, index }) => {
                return (
                    <ReelItem
                        item={item}
                        isActive={currentIndex === index && isFocused}
                    />
                );
            }}
            showsVerticalScrollIndicator={false}
            pagingEnabled={false} // Disable standard paging to use custom interval
            snapToInterval={screenHeight} // Snap exactly to screen height
            snapToAlignment={'start'}
            decelerationRate={'fast'}
            disableIntervalMomentum
            onEndReached={getPosts}
            onEndReachedThreshold={0.5}
            onViewableItemsChanged={onViewableItemsChanged.current}
            getItemLayout={(data, index) => ({
                length: screenHeight,
                offset: screenHeight * index,
                index,
            })}
            initialNumToRender={1}
            maxToRenderPerBatch={1}
            windowSize={5}
            removeClippedSubviews={false}
        />
    )
}

export default Feed



const styles = StyleSheet.create({})