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
            file = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.onload = function () {
                    resolve(xhr.response);
                };
                xhr.onerror = function (e) {
                    console.log(e);
                    reject(new TypeError("Network request failed"));
                };
                xhr.responseType = "blob";
                xhr.open("GET", fileUri, true);
                xhr.send(null);
            });
        }

        const { data, error } = await supabase
            .storage
            .from('uploads')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false,
                contentType: isImage ? 'image/*' : 'video/*'
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
    return `${FileSystem.documentDirectory}${fileName}`

}

export const getFilePath = (folderName, isImage) => {
    return `${folderName}/${(new Date()).getTime()}${isImage ? '.png' : '.mp4'}`;

}

