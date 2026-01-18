import { View, Text } from 'react-native'
import React from 'react'
import Svg, { Path } from "react-native-svg";

const Volume = (props) => (
    <Svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color="#000000" fill="none" {...props}>
        <Path d="M15 8C16.8905 8.9056 18 10.5186 18 12C18 13.4814 16.8905 15.0944 15 16" stroke="currentColor" strokeWidth={props.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M2.5 12C2.5 13.5186 2.5 14.278 2.87113 14.8083C3.01633 15.0157 3.16788 15.1979 3.40798 15.3508C3.8966 15.6622 4.63691 15.823 5.86433 16.0905C7.30397 16.4042 7.756 16.5027 8.44199 16.9622C9.1764 17.4542 9.5436 17.7002 9.7718 17.6531C10 17.6059 10 17.1528 10 16.2467V7.75326C10 6.84714 10 6.39409 9.7718 6.34693C9.5436 6.29976 9.1764 6.54578 8.44199 7.03774C7.756 7.49724 7.30397 7.59575 5.86433 7.90947C4.63691 8.17696 3.8966 8.33783 3.40798 8.64912C3.16788 8.80205 3.01633 8.98425 2.87113 9.19168C2.5 9.72202 2.5 10.4813 2.5 12Z" stroke="currentColor" strokeWidth={props.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export default Volume;
