import * as React from 'react';
import { Point, Query } from './HeatMap';
import { Action } from './Functions';

interface MapProps {
    points: Array<Point>;
    query: Query;
    opacity: number;
}

const Map = withGoogleMap((props: MapProps) => {
    let coordinates = props.points.map(p => new google.maps.LatLng(p.x, p.y), true),
        compute = google.maps.geometry.spherical.computeOffset;
    return (
        <GoogleMap
            defaultZoom={4}
            defaultCenter={{ lat: -24.25, lng: 133.416667 }}>
            {coordinates.map(p => {
                let bounds = {
                    north: compute(p, props.query.height * 1000, 0).lat(),
                    south: compute(p, props.query.height * 1000, 180).lat(),
                    east: compute(p, props.query.width * 1000, 90).lng(),
                    west: compute(p, props.query.width * 1000, 270).lng()
                };
                return (
                    <>
                        <Marker position={p}/>
                        <Rectangle bounds={bounds} options={{
                            fillOpacity: props.opacity,
                            strokeOpacity: 0
                        }}/>
                    </>
                );
            })}
        </GoogleMap>
    );
});

export interface MapComponentProps {
    points: Array<Point>;
    query: Query;
    updated: boolean;
    maxOverlap: number;
    finalise: Action<void>;
}

export interface MapComponentState {
    opacity: number;
}

export class MapComponent extends React.Component<MapComponentProps, MapComponentState> {
    public constructor(props: MapComponentProps) {
        super(props);

        this.state = { opacity: 0.6 / props.maxOverlap };
    }

    public componentWillReceiveProps(nextProps: MapComponentProps) {
        if (nextProps.updated)
            this.setState({ opacity: 0.6 / nextProps.maxOverlap });
    }

    public shouldComponentUpdate(nextProps: MapComponentProps, nextState: MapComponentState) {
        return nextProps.updated;
    }

    public render() {
        return (
            <Map points={this.props.points} query={this.props.query} opacity={this.state.opacity}
                 containerElement={<div/>} mapElement={<div className="map-canvas"/>}/>
        );
    }

    public componentDidUpdate(prevProps: MapComponentProps, prevState: MapComponentState) {
        this.props.finalise();
    }
}

export default MapComponent;
