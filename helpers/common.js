import { Dimensions } from "react-native";


const { width: deviceWidth, height: deviceHeight } = Dimensions.get('window')

export const hp = percentage => {
    return (percentage * deviceHeight) / 100
}

export const wp = percentage => {
    return (percentage * deviceWidth) / 100
}

export const stripHtmlTags = (html) => {
    return html.replace(/<[^>]*>?/gm, '');
}

export const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    const isYesterday = date.getDate() === now.getDate() - 1 && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();

    if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (isYesterday) {
        return "Yesterday";
    } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
}