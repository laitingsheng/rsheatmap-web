import * as React from 'react';
import { GoogleMap, Marker, withGoogleMap } from 'react-google-maps';
import { Point } from './HeatMap';

interface MapProps {
    markers?: Array<google.maps.LatLngLiteral>;
}

const Map = withGoogleMap((props: MapProps) => (
    <GoogleMap
        defaultZoom={4}
        defaultCenter={{ lat: -26.25, lng: 133.5 }}
    >
        {props.markers && props.markers.map(pos => <Marker position={pos}/>)}
    </GoogleMap>
));

export interface ActionFunction<T> {
    (): T;
}

export interface MapComponentProps {
    points: Array<Point>;
    updated: boolean;
    maxOverlap: number;
    finalise: ActionFunction<void>;
}

export interface MapComponentState {
    opacity: number;
    rectangles: Array<google.maps.Rectangle>;
}

function point2rectange(point: Point): google.maps.Rectangle {
    return null;
}

export class MapComponent extends React.Component<MapComponentProps, MapComponentState> {
    constructor(props: MapComponentProps) {
        super(props);

        this.state = {
            opacity: 1 / props.maxOverlap,
            rectangles: props.points.map(point2rectange)
        };
    }

    componentWillReceiveProps(nextProps: MapComponentProps) {
        if (nextProps.updated)
            this.setState({
                opacity: 1 / nextProps.maxOverlap,
                rectangles: nextProps.points.map(point2rectange)
            });
    }

    shouldComponentUpdate(nextProps: MapComponentProps, nextState: MapComponentState) {
        return nextProps.updated;
    }

    render() {
        return (
            <Map containerElement={<div/>}
                 mapElement={<div className="map-canvas"/>}/>
        );
    }

    componentDidUpdate(prevProps: MapComponentProps, prevState: MapComponentState) {
        this.props.finalise();
    }
}

export default MapComponent;
