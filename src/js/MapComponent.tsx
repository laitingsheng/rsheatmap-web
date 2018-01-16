import * as React from 'react';
import { GoogleMap, Marker, Rectangle, withGoogleMap } from 'react-google-maps';
import { Point, Query } from './HeatMap';

interface MapProps {
    points: Array<Point>;
    query: Query;
    opacity: number;
}

const Map = withGoogleMap((props: MapProps) => {
        let coordinates = props.points.map(p => new google.maps.LatLng(p.x, p.y), true);
        return (
            <GoogleMap
                defaultZoom={4}
                defaultCenter={{ lat: -26.25, lng: 133.5 }}>
                {coordinates.map(p => {
                    let bounds = {
                        north: google.maps.geometry.spherical
                                     .computeOffset(p, props.query.height * 1000, 0).lat(),
                        south: google.maps.geometry.spherical
                                     .computeOffset(p, props.query.height * 1000, 180).lat(),
                        east: google.maps.geometry.spherical
                                    .computeOffset(p, props.query.width * 1000, 90).lng(),
                        west: google.maps.geometry.spherical
                                    .computeOffset(p, props.query.width * 1000, 270).lng()
                    };
                    return (
                        <div>
                            <Marker position={p}/>
                            <Rectangle bounds={bounds} options={{ fillOpacity: props.opacity }}/>
                        </div>
                    );
                })}
            </GoogleMap>
        );
    })
;

export interface ActionFunction<T> {
    (): T;
}

export interface MapComponentProps {
    points: Array<Point>;
    query: Query;
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
        return (
            <Map points={this.props.points} query={this.props.query} opacity={this.state.opacity}
                 containerElement={<div/>} mapElement={<div className="map-canvas"/>}/>
        );
    }

    public componentDidUpdate(prevProps: MapComponentProps, prevState: MapComponentState) {
        this.props.finalise();
    }

    private props2state(props: MapComponentProps) {
        return {
            opacity: 0.6 / props.maxOverlap,
            rectangles: props.points.map(point2rectangle)
        };
    }
}

export default MapComponent;
