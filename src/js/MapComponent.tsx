import * as React from 'react';
import { GoogleMap, Marker, Rectangle, withGoogleMap } from 'react-google-maps';
import { Point, Region } from './HeatMap';

interface MapProps {
    markers?: Array<Marker>;
    rectangles?: Array<Rectangle>;
}

const Map = withGoogleMap((props: MapProps) => (
    <GoogleMap
        defaultZoom={4}
        defaultCenter={{ lat: -26.25, lng: 133.5 }}
    >
        {props.markers}
        {props.rectangles}
    </GoogleMap>
));

export interface ActionFunction<T> {
    (): T;
}

export interface MapComponentProps {
    points: Array<Point>;
    regions: Array<Region>;
    updated: boolean;
    maxOverlap: number;
    finalise: ActionFunction<void>;
}

export interface MapComponentState {
    opacity: number;
    rectangles: Array<google.maps.Rectangle>;
}

function point2rectangle(point: Point): google.maps.Rectangle {
    return null;
}

export class MapComponent extends React.Component<MapComponentProps, MapComponentState> {
    public constructor(props: MapComponentProps) {
        super(props);

        this.state = this.props2state(props);
    }

    public componentWillReceiveProps(nextProps: MapComponentProps) {
        if (nextProps.updated)
            this.setState(this.props2state(nextProps));
    }

    public shouldComponentUpdate(nextProps: MapComponentProps, nextState: MapComponentState) {
        return nextProps.updated;
    }

    public render() {
        return <Map containerElement={<div/>} mapElement={<div className="map-canvas"/>}/>;
    }

    public componentDidUpdate(prevProps: MapComponentProps, prevState: MapComponentState) {
        this.props.finalise();
    }

    private props2state(props: MapComponentProps) {
        return {
            opacity: 1 / props.maxOverlap,
            rectangles: props.points.map(point2rectangle)
        };
    }
}

export default MapComponent;
