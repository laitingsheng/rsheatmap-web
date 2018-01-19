import * as React from 'react';
import { findDOMNode } from 'react-dom';
import { Point, Query } from './HeatMap';
import { Action } from './Functions';

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
    private mapContainer: React.ReactInstance;
    private map: google.maps.Map;

    public constructor(props: MapComponentProps) {
        super(props);

        this.state = { opacity: 0.6 / props.maxOverlap };
    }

    public componentDidMount() {
        this.map = new google.maps.Map(findDOMNode(this.mapContainer), {
            center: { lat: -27.25, lng: 132.416667 }, zoom: 4
        });
    }

    public getBounds(): google.maps.LatLngBounds {
        return this.map.getBounds();
    }

    public componentWillReceiveProps(nextProps: MapComponentProps) {
        if(nextProps.updated)
            this.setState({ opacity: 0.6 / nextProps.maxOverlap });
    }

    public shouldComponentUpdate(nextProps: MapComponentProps, nextState: MapComponentState) {
        return nextProps.updated;
    }

    public render() {
        return <div className="map-canvas" ref={ref => this.mapContainer = ref}/>;
    }

    public componentDidUpdate(prevProps: MapComponentProps, prevState: MapComponentState) {
        this.props.finalise();
    }
}

export default MapComponent;
