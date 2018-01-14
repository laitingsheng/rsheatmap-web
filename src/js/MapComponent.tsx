import * as React from 'react';
import { GoogleMap, Marker, withGoogleMap, withScriptjs } from 'react-google-maps';
import HeatMap from './HeatMap';

interface MapTagProps {
    markers: Array<google.maps.LatLngLiteral>;
}

const MapTag = withScriptjs(withGoogleMap((props: MapTagProps) => (
    <GoogleMap
        defaultZoom={4}
        defaultCenter={{ lat: -24.25, lng: 133.417 }}
    >
        {props.markers && props.markers.map(pos => <Marker position={pos}/>)}
    </GoogleMap>
)));

export interface MapComponentProps {
    heatmap: HeatMap;
    markers: Array<google.maps.LatLngLiteral>;
}

const url = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDQtrmtYpJjFFCnpv0-3QN0yg3Xr5bmd7s';

export class MapComponent extends React.Component<MapComponentProps> {
    render() {
        return (
            <MapTag markers={this.props.markers} googleMapURL={url} loadingElement={<div/>}
                    containerElement={<div/>}
                    mapElement={<div className="map-canvas"/>}/>
        );
    }
}

export default MapComponent;
