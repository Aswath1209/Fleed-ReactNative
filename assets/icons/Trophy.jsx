import * as React from "react"
import Svg, { Path } from "react-native-svg";

const Trophy = (props) => (
  <Svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color="#000000" fill="none" {...props}>
    <Path d="M4 8h16M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2M8 22h8M12 17v5M8 8H4a2 2 0 0 0-2 2v2a5 5 0 0 0 5 5h1M16 8h4a2 2 0 0 1 2 2v2a5 5 0 0 1-5 5h-1M8 8v5a4 4 0 0 0 8 0V8" stroke="currentColor" strokeWidth={props.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export default Trophy;
