import * as FileSystem from 'expo-file-system/legacy'
import { decode } from 'base64-arraybuffer'
import { supabase } from '../lib/supabase';
import { supabaseUrl } from '../constants';
import { Platform } from 'react-native';

export const getUserImageSrc = imagePath => {
    if (imagePath) {
        return getSupabaseFileUrl(imagePath);
    } else {
        return require('../assets/images/default_user.png');
    }
}

export const getSupabaseFileUrl = filePath => {
    if (filePath) {
        return { uri: `${supabaseUrl}/storage/v1/object/public/uploads/${filePath}` }
    }
    return null;
}

export const uploadFile = async (folderName, fileUri, isImage = true) => {
    try {
        let fileName = getFilePath(folderName, isImage);

        let file;
        if (Platform.OS === 'web') {
            const response = await fetch(fileUri);
            file = await response.blob();
        } else {
            const fileBase64 = await FileSystem.readAsStringAsync(fileUri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            file = decode(fileBase64);
        }

        const { data, error } = await supabase
            .storage
            .from('uploads')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false,
                contentType: isImage ? 'image/png' : 'video/mp4'
            });

        if (error) {
            console.log("file Upload error", error);
            return { success: false, msg: "Couldn't upload the media" }
        }

        return { success: true, data: data.path }


    } catch (error) {
        console.log("file Upload error", error);
        return { success: false, msg: "Couldn't upload the media" }
    }

}


export const downloadFile = async (url) => {
    try {
        const { uri } = await FileSystem.downloadAsync(url, getLocalFilePath(url))
        return uri;
    } catch (error) {
        return null;
    }
}

export const getLocalFilePath = Fileurl => {
    let fileName = Fileurl.split('/').pop();
    // Force extension if missing or malformed to ensure sharing works
    if (!fileName.includes('.')) {
        if (Fileurl.includes('postImages') || Fileurl.includes('profiles')) {
            fileName += '.png';
        } else if (Fileurl.includes('postVideos')) {
            fileName += '.mp4';
        }
    } else {
        // Fix the specific "mp4" without dot case if legacy data exists
        if (fileName.endsWith('mp4') && !fileName.endsWith('.mp4')) {
            fileName = fileName.replace('mp4', '.mp4');
        }
        if (fileName.endsWith('png') && !fileName.endsWith('.png')) {
            fileName = fileName.replace('png', '.png');
        }
    }

    return `${FileSystem.documentDirectory}${fileName}`
}

export const getFilePath = (folderName, isImage) => {
    return `${folderName}/${(new Date()).getTime()}${isImage ? '.png' : '.mp4'}`;

}

