import React, {Component} from "react";
import {findDOMNode} from "react-dom";
import "../css/Map.css";

class MapCanvas extends Component {
    constructor(props) {
        super(props);
        this.state = {};

        window.initialise = this.__initialise.bind(this);
        const mapScript = document.createElement("script");
        mapScript.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyDQtrmtYpJjFFCnpv0-3QN0yg3Xr5bmd7s&callback=initialise";
        mapScript.async = false;
        mapScript.defer = false;
        document.head.appendChild(mapScript);
    }

    __initialise() {
        this.setState({map: new window.google.maps.Map(findDOMNode(this.refs.map), {
            zoom: 4, center: {lat: -25.5, lng: 133.417}
        })});
    }

    addPoint() {
        return null;
    }

    render() {
        return <div className="container map-canvas" ref="map" />;
    }
}

export default MapCanvas;
