import React, {PureComponent} from "react";
import {compose, withProps} from "recompose";
import {GoogleMap, Marker, withGoogleMap, withScriptjs} from "react-google-maps";

const url = "https://maps.googleapis.com/maps/api/js?key=AIzaSyDQtrmtYpJjFFCnpv0-3QN0yg3Xr5bmd7s";
const MapComponent = compose(withProps({
                                           googleMapURL:     url, loadingElement: <div />,
                                           containerElement: <div />,
                                           mapElement:       <div className="map-canvas" />
                                       }), withScriptjs, withGoogleMap)((props) => <GoogleMap
    defaultZoom={4}
    defaultCenter={{lat: -24.25, lng: 133.417}}
>
    {props.isMarkerShown && <Marker position={{lat: -24.25, lng: 133.417}} />}
</GoogleMap>);

class MapCanvas extends PureComponent {
    render() {
        return <MapComponent isMarkerShown />;
    }
}

export {MapCanvas};
export default MapCanvas;
