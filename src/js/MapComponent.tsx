import * as React from 'react';
import { findDOMNode } from 'react-dom';
import rbush from 'rbush';
import { Action, UnaryFunction } from './Functions';
import knn from './rbush-knn';
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
    x: number;
    y: number;
}

export class Record implements Coordinate {
    protected _pos: LatLng;
    protected _place: PlaceResult;

    get place(): PlaceResult {
        return this._place;
    }

    get x(): number {
        return this._pos.lat();
    }

    get y(): number {
        return this._pos.lng();
    }

    constructor(pos: LatLng, place: PlaceResult) {
        this._pos = pos;
        this._place = place;
    }

    toKey(): string {
        return stringifyCoordinate(this._pos.lat(), this._pos.lng());
    }
}

class Region {
    private _minX: number;

    get minX(): number {
        return this._minX;
    }

    private _minY: number;

    get minY(): number {
        return this._minY;
    }

    private _maxX: number;

    get maxX(): number {
        return this._maxX;
    }

    private _maxY: number;

    get maxY(): number {
        return this._maxY;
    }

    static fromBound(bound: LatLngBounds): Region {
        const sw = bound.getSouthWest(), ne = bound.getNorthEast();
        return new Region(sw.lat(), sw.lng(), ne.lat(), ne.lng());
    }

    private constructor(minX: number, minY: number, maxX: number, maxY: number) {
        this._minX = minX;
        this._minY = minY;
        this._maxX = maxX;
        this._maxY = maxY;
    }
}

class Point extends Record {
    private _bound: Region;

    get bound() {
        return this._bound;
    }

    set bound(bound: LatLngBounds | Region) {
        if(bound instanceof Region)
            this._bound = bound;
        else
            this._bound = Region.fromBound(bound);
    }

    private _marker: Marker;

    get marker(): Marker {
        return this._marker;
    }

    private _rectangle: Rectangle;

    get pos(): LatLng {
        return this._pos;
    }

    get rectangle(): Rectangle {
        return this._rectangle;
    }

    constructor(pos: LatLng, marker: Marker, rectangle: Rectangle, place: PlaceResult) {
        super(pos, place);
        this._bound = Region.fromBound(rectangle.getBounds());
        this._marker = marker;
        this._rectangle = rectangle;
    }
}

export interface Query {
    height: number;
    width: number;
}

export interface MapComponentProps {
    updateSearchBounds: UnaryFunction<LatLngBounds, void>;
    resetSearch: Action<void>;
}

export interface Combo {
    x: number;
    y: number;
    place?: PlaceResult;
}

export class MapComponent extends React.Component<MapComponentProps> {
    private mapContainer: React.ReactInstance;
    private map: google.maps.Map;
    private tree: rbush;
    private points: Map<string, Point>;
    private query: Query;
    private currOpacity: number;
    private _size: number;

    get size(): number {
        return this._size;
    }

    get bounds(): LatLngBounds {
        return this.map.getBounds();
    }

    constructor(props: MapComponentProps) {
        super(props);

        this.tree = new rbush();
        this.points = new Map<string, Point>();
        this._size = 0;
        this.query = { height: 10, width: 10 };
        this.currOpacity = 0;
    }

    componentDidMount() {
        // create map when the component mount
        this.map = new google.maps.Map(findDOMNode(this.mapContainer), {
            center: { lat: -27.25, lng: 132.416667 }, zoom: 4, fullscreenControl: false,
            streetViewControl: false
        });
        this.map.addListener('bounds_changed', () => this.props.updateSearchBounds(this.bounds));
        this.map.addListener('click', e => this.addPoint(e.latLng.lat(), e.latLng.lng()));
    }

    addPoint(x: number, y: number, place?: PlaceResult): void {
        let p = this.createPoint(x, y, place);

        if(!p)
            return;

        this.tree.insert(p.bound);
        ++this._size;
        this.updateOpacity();
    }

    addPoints(poss: Array<Combo>): void {
        let pbs = [];
        for(const { x, y, place } of poss) {
            let p = this.createPoint(x, y, place);
            if(p)
                pbs.push(p.bound);
        }

        if(pbs.length === 0)
            return;

        this.tree.load(pbs);
        this._size += pbs.length;
        this.updateOpacity();
    }

    changeQuery(queryHeight: number, queryWidth: number): void {
        this.query.height = queryHeight;
        this.query.width = queryWidth;

        // change boundaries
        let points = [];
        this.points.forEach(v => {
            v.rectangle.setBounds(this.calcBound(v.pos));
            v.bound = v.rectangle.getBounds();
            points.push(v.bound);
        });

        // reset RTree index, reinsert all points
        this.tree = new rbush();
        this.tree.load(points);
        this.updateOpacity();
    }

    clear(): void {
        // reset the whole map
        this.map = new google.maps.Map(findDOMNode(this.mapContainer), {
            center: this.map.getCenter(), zoom: this.map.getZoom(), fullscreenControl: false,
            streetViewControl: false
        });
        this.map.addListener('bounds_changed', () => this.props.updateSearchBounds(this.bounds));
        this.map.addListener('click', e => this.addPoint(e.latLng.lat(), e.latLng.lng()));

        // reset all points
        this.points = new Map<string, Point>();
        this._size = 0;

        // reset RTree index
        this.tree = new rbush();

        this.currOpacity = 0;

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

        this.points.set(key, null);
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
                    fillColor: 'Gray',
                    strokeOpacity: 0,
                    clickable: false
                }
            ),
            place
        );

        this.points.set(p.toKey(), p);

        return p;
    }

    private updateOpacity(): void {
        // calculate the maximum overlapping
        let maxOverlap = 0;
        this.points.forEach(v => {
            let overlap = knn(this.tree, v.x, v.y, 0);
            if(overlap > maxOverlap)
                maxOverlap = overlap;
        });

        // update opacity of each rectangles
        this.currOpacity = 0.8 / maxOverlap;
        this.points.forEach(v => {
            // adjust opacity according the weight
            v.rectangle.setOptions({ fillOpacity: this.currOpacity });
        });
    }
}

export default MapComponent;
