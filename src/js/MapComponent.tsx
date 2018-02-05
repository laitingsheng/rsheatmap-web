import * as React from 'react';
import { findDOMNode } from 'react-dom';
import { Action, UnaryFunction } from './Functions';
import LatLng = google.maps.LatLng;
import LatLngBounds = google.maps.LatLngBounds;
import LatLngBoundsLiteral = google.maps.LatLngBoundsLiteral;
import Marker = google.maps.Marker;
import PlaceResult = google.maps.places.PlaceResult;
import Rectangle = google.maps.Rectangle;
import SymbolPath = google.maps.SymbolPath;

const compute = google.maps.geometry.spherical.computeOffset;

function stringifyCoordinate(x: number, y: number): string {
    return `${x} ${y}`;
}

export interface Coordinate {
    readonly x: number;
    readonly y: number;
}

export class Record implements Coordinate {
    get x(): number {
        return this.pos.lat();
    }

    get y(): number {
        return this.pos.lng();
    }

    constructor(readonly pos: LatLng, readonly place: PlaceResult) {
        this.toString = this.toKey;
    }

    toKey(): string {
        return stringifyCoordinate(this.pos.lat(), this.pos.lng());
    }
}

export interface Bound {
    readonly minX: number;
    readonly minY: number;
    readonly maxX: number;
    readonly maxY: number;
}

class Region implements Bound {
    static fromBound(bound: LatLngBounds): Region {
        const sw = bound.getSouthWest(), ne = bound.getNorthEast();
        return new Region(sw.lat(), sw.lng(), ne.lat(), ne.lng());
    }

    private constructor(readonly minX: number, readonly minY: number,
                        readonly maxX: number, readonly maxY: number) {
    }
}

class Point extends Record {
    bound: Region;

    constructor(pos: LatLng, readonly marker: Marker, readonly rectangle: Rectangle,
                place: PlaceResult) {
        super(pos, place);
        this.bound = Region.fromBound(rectangle.getBounds());
    }
}

export interface Query {
    height: number;
    width: number;
}

export interface MapComponentProps {
    resetSearch: Action<void>;
    updateHistory: Action<void>;
    updateSearchBounds: UnaryFunction<LatLngBounds, void>;
}

export interface Params extends Coordinate {
    place?: PlaceResult;
}

export class MapComponent extends React.Component<MapComponentProps> {
    private mapContainer: HTMLDivElement;
    private map: google.maps.Map;
    private maxOverlap: number;
    private points: Map<string, Point>;
    private query: Query;

    get size(): number {
        return this.points.size;
    }

    get bounds(): LatLngBounds {
        return this.map.getBounds();
    }

    private get currOpacity(): number {
        return 0.8 / this.maxOverlap;
    }

    constructor(props: MapComponentProps) {
        super(props);

        this.maxOverlap = 0;
        this.map = null;
        this.points = new Map();
        this.query = { height: 10, width: 10 };
    }

    componentDidMount() {
        this.createMap();
    }

    addPoint(x: number, y: number, place?: PlaceResult): void {
        let p = this.createPoint(x, y, place);

        if(!p)
            return;

        this.updateOpacity();
        this.props.updateHistory();
    }

    addPoints(poss: Array<Params>): void {
        let c = 0;
        poss.forEach(({ x, y, place }) => {
            let p = this.createPoint(x, y, place);
            if(p)
                ++c;
        });

        if(c === 0)
            return;

        this.updateOpacity();
        this.props.updateHistory();
    }

    changeQuery(queryHeight: number, queryWidth: number): void {
        this.query.height = queryHeight;
        this.query.width = queryWidth;

        // change boundaries
        let points = [];
        this.points.forEach(v => {
            v.rectangle.setBounds(this.calcBound(v.pos));
            v.bound = Region.fromBound(v.rectangle.getBounds());
            points.push(v.bound);
        });

        this.updateOpacity();
    }

    clear(): void {
        this.createMap();

        // reset all points
        this.points = new Map<string, Point>();

        this.maxOverlap = 0;

        this.props.resetSearch();
    }

    generateRecords(): Array<Record> {
        return Array.from(this.points.values());
    }

    remove(x: number, y: number): void {
        const key = stringifyCoordinate(x, y);
        const p = this.points.get(key);
        if(!p)
            return;

        p.marker.setMap(null);
        p.rectangle.setMap(null);

        this.points.delete(key);

        this.props.updateHistory();
    }

    // there is no need to update the component
    shouldComponentUpdate() {
        return false;
    }

    render() {
        return <div className="map-canvas" ref={ref => this.mapContainer = ref}/>;
    }

    private calcBound(c: LatLng): LatLngBoundsLiteral {
        return {
            north: compute(c, this.query.height * 1000, 0).lat(),
            south: compute(c, this.query.height * 1000, 180).lat(),
            east: compute(c, this.query.width * 1000, 90).lng(),
            west: compute(c, this.query.width * 1000, 270).lng()
        };
    }

    private createMap(): void {
        const node = findDOMNode(this.mapContainer);

        if(this.map)
            this.map = new google.maps.Map(node, {
                center: this.map.getCenter(), zoom: this.map.getZoom(), fullscreenControl: false,
                streetViewControl: false
            });
        else {
            let pos = { lat: -27.25, lng: 132.416667 };
            if(navigator.geolocation)
                navigator.geolocation.getCurrentPosition(
                    position => {
                        pos = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        };
                        this.map.setCenter(pos);
                        this.map.setZoom(8);
                    },
                    () => alert('location service disabled')
                );
            this.map = new google.maps.Map(node, {
                center: pos, zoom: 4, fullscreenControl: false,
                streetViewControl: false
            });
        }
        this.map.addListener('bounds_changed', () => this.props.updateSearchBounds(this.bounds));
        this.map.addListener('click', e => this.addPoint(e.latLng.lat(), e.latLng.lng()));
    }

    private createPoint(x: number, y: number, place: PlaceResult): Point {
        let p = this.points.get(stringifyCoordinate(x, y));
        if(p)
            return null;

        // if the point does not exist, create a new point and place the marker and the
        // rectangle on the map
        let c = new LatLng(x, y);
        p = new Point(
            c, new Marker(
                {
                    map: this.map, position: c,
                    icon: {
                        path: SymbolPath.CIRCLE,
                        scale: 2,
                        fillColor: 'Red',
                        strokeColor: 'Red'
                    }
                }
            ),
            new Rectangle(
                {
                    map: this.map,
                    bounds: this.calcBound(c),
                    fillOpacity: this.currOpacity,
                    fillColor: 'Black',
                    strokeOpacity: 0,
                    clickable: false
                }
            ),
            place
        );

        p.marker.addListener('rightclick', e => this.remove(e.latLng.lat(), e.latLng.lng()));

        this.points.set(p.toKey(), p);

        return p;
    }

    // calculate maximum overlap by CREST algorithm
    private crestMaxOverlap(): number {
        return 1;
    }

    private updateOpacity(): void {
        this.maxOverlap = this.crestMaxOverlap();

        // update opacity of each rectangles
        this.points.forEach(v => {
            // adjust opacity according the weight
            v.rectangle.setOptions({ fillOpacity: this.currOpacity });
        });
    }
}

export default MapComponent;
