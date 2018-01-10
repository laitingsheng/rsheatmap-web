import React, {Component} from "react";
import {findDOMNode} from "react-dom";
import rbush from "rbush";
import "../css/Map.css";

class MapCanvas extends Component {
    constructor(props) {
        super(props);
        this.region = new rbush();
        this.map = new window.google.maps.Map(findDOMNode(this.refs.map), {
            zoom: 4, center: {lat: -25.5, lng: 133.417}
        });
        this.state = {};
    }

    addPoint() {
        return null;
    }

    render() {
        return <div className="container map-canvas" ref="map" />;
    }
}

export default MapCanvas;
