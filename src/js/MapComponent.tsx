import * as React from 'react';
import { findDOMNode } from 'react-dom';
import rbush from 'rbush';
import { UnaryFunction } from './Functions';
import knn from './rbush-knn';
import LatLng = google.maps.LatLng;
import LatLngBounds = google.maps.LatLngBounds;
import LatLngBoundsLiteral = google.maps.LatLngBoundsLiteral;
import Marker = google.maps.Marker;
import Rectangle = google.maps.Rectangle;

const compute = google.maps.geometry.spherical.computeOffset;

export class Coordinate {
    x: number;
    y: number;

    public constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public toKey(): string {
        return `${this.x} ${this.y}`;
    }
}

class Point extends Coordinate {
    weight: number;
    marker: Marker;
    rectangle: Rectangle;

    public constructor(x: number, y: number, marker: Marker, rectangle: Rectangle) {
        super(x, y);
        this.weight = 1;
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
        this.query = { height: 100, width: 100 };
        this.currOpacity = 0;
    }

    public componentDidMount() {
        // create map when the component mount
        this.map = new google.maps.Map(findDOMNode(this.mapContainer), {
            center: { lat: -27.25, lng: 132.416667 }, zoom: 4
        });

        this.map.addListener('bounds_changed', () => this.props.updateSearchBounds(this.bounds));
    }

    public addPoint(pos: Coordinate): void {
        this.tree.insert(MapComponent.boundToRegion(this.insertPoint(pos)));
        ++this._size;
        this.updateOpacity();
    }

    public addPoints(poss: Array<Coordinate>): void {
        this.tree.load(poss.map(pos => MapComponent.boundToRegion(this.insertPoint(pos))));
        this._size += poss.length;
        this.updateOpacity();
    }

    public changeQuery(queryHeight: number, queryWidth: number): void {
        this.query.height = queryHeight;
        this.query.width = queryWidth;

        // change boundaries
        let points = [];
        this.points.forEach(v => {
            v.rectangle.setBounds(this.calcBound(new LatLng(v.x, v.y)));
            points.push(v);
        });

        // reset RTree index, reinsert all points
        this.tree = new rbush();
        this.tree.load(points);
        this.updateOpacity();
    }

    public clear(): void {
        // reset all points
        this.points = new Map<string, Point>();
        this._size = 0;

        // reset RTree index
        this.tree = new rbush();

        // reset the whole map
        this.map = new google.maps.Map(findDOMNode(this.mapContainer), {
            center: { lat: -27.25, lng: 132.416667 }, zoom: 4
        });

        this.currOpacity = 0;
    }

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

    private insertPoint(pos: Coordinate): LatLngBounds {
        let p = this.points.get(pos.toKey());
        if(p)
            ++p.weight;
        else {
            // if the point does not exist, create a new point and place the marker and the
            // rectangle on the map
            let c = new LatLng(pos.x, pos.y);
            p = new Point(
                pos.x, pos.y, new google.maps.Marker({ map: this.map, position: c }),
                new google.maps.Rectangle(
                    {
                        map: this.map,
                        bounds: this.calcBound(c),
                        fillOpacity: this.currOpacity,
                        strokeOpacity: 0,
                        clickable: false
                    }
                )
            );

            this.points.set(p.toKey(), p);
        }

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
        this.currOpacity = 0.7 / maxOverlap;
        this.points.forEach(v => {
            // adjust opacity according the weight
            v.rectangle.setOptions({ fillOpacity: this.currOpacity * v.weight });
        });
    }
}

export default MapComponent;
