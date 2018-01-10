import React, {Component} from "react";
import {GoogleMap, withGoogleMap} from "react-google-maps";
import InputForm from "./Component";
import "../css/Map.css";

const MapCanvas = withGoogleMap((props) => <GoogleMap
    defaultZoom={4}
    defaultCenter={{lat: -25.5, lng: 133.417}}
/>);

class App extends Component {
    render() {
        return (<div>
            <InputForm canvas={this.props.canvas} />
            <MapCanvas containerElement={<div />}
                       mapElement={<div className="map-canvas" />}
            />
        </div>);
    }
}

export default App;
