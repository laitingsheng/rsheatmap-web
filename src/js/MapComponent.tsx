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

export class Coordinate {
    private _x: number;

    public get x(): number {
        return this._x;
    }

    private _y: number;

    public get y(): number {
        return this._y;
    }

    public constructor(x: number, y: number) {
        this._x = x;
        this._y = y;
    }

    public toKey(): string {
        return `${this.x} ${this.y}`;
    }
}

export class Record extends Coordinate {
    private _place: PlaceResult;

    public get place(): PlaceResult {
        return this._place;
    }

    public constructor(x: number, y: number, place: PlaceResult) {
        super(x, y);
        this._place = place;
    }
}

class Point extends Record {
    marker: Marker;
    rectangle: Rectangle;

    constructor(x: number, y: number, marker: Marker, rectangle: Rectangle,
                       place: PlaceResult) {
        super(x, y, place);
        this.marker = marker;
        this.rectangle = rectangle;
    }
}

interface Region {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
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
    pos: Coordinate;
    place: PlaceResult;
}

export class MapComponent extends React.Component<MapComponentProps> {
    private mapContainer: React.ReactInstance;
    private map: google.maps.Map;
    private tree: rbush;
    private points: Map<string, Point>;
    private query: Query;
    private currOpacity: number;

    private _size: number;

    public get size(): number {
        return this._size;
    }

    public get bounds(): LatLngBounds {
        return this.map.getBounds();
    }

    private static boundToRegion(bound: LatLngBounds): Region {
        return {
            minX: bound.getSouthWest().lat(),
            minY: bound.getSouthWest().lng(),
            maxX: bound.getNorthEast().lat(),
            maxY: bound.getNorthEast().lng()
        };
    }

    public constructor(props: MapComponentProps) {
        super(props);

        this.tree = new rbush();
        this.points = new Map<string, Point>();
        this._size = 0;
        this.query = { height: 10, width: 10 };
        this.currOpacity = 0;
    }

    public componentDidMount() {
        // create map when the component mount
        this.map = new google.maps.Map(findDOMNode(this.mapContainer), {
            center: { lat: -27.25, lng: 132.416667 }, zoom: 4, fullscreenControl: false,
            streetViewControl: false
        });
        this.map.addListener('bounds_changed', () => this.props.updateSearchBounds(this.bounds));
        this.map.addListener('click', e =>
            this.addPoint(new Coordinate(e.latLng.lat(), e.latLng.lng())));
    }

    public addPoint(pos: Coordinate, place?: PlaceResult): void {
        let p = this.insertPoint(pos, place);

        if(!p)
            return;

        this.tree.insert(MapComponent.boundToRegion(p));
        ++this._size;
        this.updateOpacity();
    }

    public addPoints(poss: Array<Combo>): void {
        let ps = [];
        for(const { pos, place } of poss) {
            let p = this.insertPoint(pos, place);
            if(p)
                ps.push(MapComponent.boundToRegion(p));
        }

        if(ps.length === 0)
            return;

        this.tree.load(ps);
        this._size += ps.length;
        this.updateOpacity();
    }

    public changeQuery(queryHeight: number, queryWidth: number): void {
        this.query.height = queryHeight;
        this.query.width = queryWidth;

        // change boundaries
        let points = [];
        this.points.forEach(v => {
            v.rectangle.setBounds(this.calcBound(new LatLng(v.x, v.y)));
            points.push(MapComponent.boundToRegion(v.rectangle.getBounds()));
        });

        // reset RTree index, reinsert all points
        this.tree = new rbush();
        this.tree.load(points);
        this.updateOpacity();
    }

    public clear(): void {
        // reset the whole map
        this.map = new google.maps.Map(findDOMNode(this.mapContainer), {
            center: this.map.getCenter(), zoom: this.map.getZoom(), fullscreenControl: false,
            streetViewControl: false
        });
        this.map.addListener('bounds_changed', () => this.props.updateSearchBounds(this.bounds));
        this.map.addListener('click', e =>
            this.addPoint(new Coordinate(e.latLng.lat(), e.latLng.lng())));

        // reset all points
        this.points = new Map<string, Point>();
        this._size = 0;

        // reset RTree index
        this.tree = new rbush();

        this.currOpacity = 0;

        this.props.resetSearch();
    }

    public history(): Array<Record> {
        const re = [];
        this.points.forEach(v => re.push(new Record(v.x, v.y, v.place)));
        return re;
    }

    public remove(x: number, y: number): void {
    }

    // there is no need to update the component
    public shouldComponentUpdate() {
        return false;
    }

    public render() {
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

    private insertPoint(pos: Coordinate, place: PlaceResult): LatLngBounds {
        let p = this.points.get(pos.toKey());
        if(p)
            return null;

        // if the point does not exist, create a new point and place the marker and the
        // rectangle on the map
        let c = new LatLng(pos.x, pos.y);
        p = new Point(
            pos.x, pos.y, new Marker(
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

        return p.rectangle.getBounds();
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
