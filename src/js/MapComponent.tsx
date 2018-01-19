import * as React from 'react';
import { findDOMNode } from 'react-dom';
import { HeatMap } from './HeatMap';

export class MapComponent extends React.PureComponent<{}> {
    private mapContainer: React.ReactInstance;
    private map: google.maps.Map;
    private index: HeatMap;
    private currOpacity: number;
    private markers: Array<google.maps.Marker>;
    private rectangles: Array<google.maps.Rectangle>;

    public get size(): number {
        return this.index.size;
    }

    public constructor(props: {}) {
        super(props);

        this.index = new HeatMap();
        this.markers = [];
        this.rectangles = [];
        this.currOpacity = 0;
    }

    public componentDidMount() {
        this.map = new google.maps.Map(findDOMNode(this.mapContainer), {
            center: { lat: -27.25, lng: 132.416667 }, zoom: 4
        });

        /*this.markers.forEach(m => m.setMap(this.map));
        this.rectangles.forEach(r => r.setMap(this.map));*/
    }

    public getBounds(): google.maps.LatLngBounds {
        return this.map.getBounds();
    }

    public addPoint(x: number, y: number) {
        this.index.addPoint({ x, y });
        this.currOpacity = this.index.divide();
        let c = new google.maps.LatLng(x, y),
            compute = google.maps.geometry.spherical.computeOffset;
        this.markers.push(new google.maps.Marker({ map: this.map, position: c }));
        this.rectangles.push(new google.maps.Rectangle(
            {
                map: this.map,
                bounds: {
                    north: compute(c, this.index.height * 1000, 0).lat(),
                    south: compute(c, this.index.height * 1000, 180).lat(),
                    east: compute(c, this.index.width * 1000, 90).lng(),
                    west: compute(c, this.index.width * 1000, 270).lng()
                },
                fillOpacity: this.currOpacity,
                strokeOpacity: 0,
                clickable: false
            }));
    }

    public render() {
        return <div className="map-canvas" ref={ref => this.mapContainer = ref}/>;
    }
}

export default MapComponent;
