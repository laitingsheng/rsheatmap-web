import * as React from 'react';
import { GoogleMap, Marker, withGoogleMap } from 'react-google-maps';

export interface MapProps {
    markers?: Array<google.maps.LatLngLiteral>;
}

const MapTag = withGoogleMap((props: MapProps) => (
    <GoogleMap
        defaultZoom={4}
        defaultCenter={{ lat: -26.25, lng: 133.5 }}
    >
        {props.markers && props.markers.map(pos => <Marker position={pos}/>)}
    </GoogleMap>
));

export class MapComponent extends React.Component<MapProps> {
    render() {
        return (
            <MapTag markers={this.props.markers} containerElement={<div/>}
                    mapElement={<div className="map-canvas"/>}/>
        );
    }
}

export default MapComponent;
