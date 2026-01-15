import { StyleSheet, Text, View, TextInput } from 'react-native'
import React from 'react'
import { theme } from '../constants/theme'

const RichTextEditor = ({
    editorRef, onChange
}) => {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>Description (Web Fallback)</Text>
            <TextInput
                multiline
                style={styles.input}
                placeholder="Add a description"
                placeholderTextColor={'gray'}
                onChangeText={onChange}
            />
        </View>
    )
}

export default RichTextEditor

const styles = StyleSheet.create({
    container: {
        minHeight: 285,
        borderWidth: 1.5,
        borderColor: theme.colors.gray,
        borderRadius: theme.radius.xl,
        padding: 10
    },
    label: {
        color: theme.colors.textLight,
        marginBottom: 10
    },
    input: {
        flex: 1,
        color: theme.colors.textDark,
        textAlignVertical: 'top'
    }
})
