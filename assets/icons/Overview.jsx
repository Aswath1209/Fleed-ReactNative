import * as React from "react"
import Svg, { Path, Circle } from "react-native-svg"

const Overview = (props) => (
    <Svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={24}
        height={24}
        color="#000000"
        fill="none"
        {...props}
    >
        <Circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={props.strokeWidth} />
        <Path d="M12 7V13" stroke="currentColor" strokeWidth={props.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx="12" cy="16" r="1" fill="currentColor" />
    </Svg>
)

export default Overview
