import * as React from 'react';
import { findDOMNode } from 'react-dom';
import { ComparableDataObject, rgb } from '../lib/Util';
import { CirRegion, lineSweepCRESTCir, lineSweepCRESTRect, RectRegion } from '../lib/CREST';
import Circle = google.maps.Circle;
import LatLng = google.maps.LatLng;
import LatLngBounds = google.maps.LatLngBounds;
import LatLngBoundsLiteral = google.maps.LatLngBoundsLiteral;
import Marker = google.maps.Marker;
import PlaceResult = google.maps.places.PlaceResult;
import Rectangle = google.maps.Rectangle;
import SymbolPath = google.maps.SymbolPath;

const computeOffset = google.maps.geometry.spherical.computeOffset;

function stringifyCoordinate(x: number, y: number): string {
    return `${x} ${y}`;
}

export interface Coordinate {
    readonly x: number;
    readonly y: number;
}

export class Record extends ComparableDataObject<Record> implements Coordinate {
    get x(): number {
        return this.pos.lng();
    }

    get y(): number {
        return this.pos.lat();
    }

    compareTo(o: Record): number {
        if(this === o)
            return 0;

        const re = this.x - o.x;
        if(re)
            return re;
        return this.y - o.y;
    }

    toKey(): string {
        return stringifyCoordinate(this.pos.lng(), this.pos.lat());
    }

    constructor(readonly pos: LatLng, readonly place: PlaceResult) {
        super();
        this.toString = this.toKey;
    }
}

export class Point extends Record {
    readonly cirBound: CirRegion;
    readonly rectBound: RectRegion;

    constructor(pos: google.maps.LatLng, place: google.maps.places.PlaceResult,
                readonly marker: google.maps.Marker, readonly circle: google.maps.Circle,
                readonly rectangle: google.maps.Rectangle) {
        super(pos, place);

        this.cirBound = CirRegion.fromCircle(circle);
        this.rectBound = RectRegion.fromRectangle(rectangle);
    }
}

export interface Query {
    height?: number;
    width?: number;
    radius?: number;
}

export type Display = 'Circle' | 'Rectangle';

export interface MapComponentProps {
    resetSearch: () => void;
    updateCount: (count: number) => void;
    updateHistory: () => void;
    updateSearchBounds: (bound: LatLngBounds) => void;
}

export interface Params extends Coordinate {
    readonly place?: PlaceResult;
}

export class MapComponent extends React.Component<MapComponentProps> {
    private display: Display;
    private mapContainer: HTMLDivElement;
    private map: google.maps.Map;
    private maxOverlapCir: number;
    private maxOverlapRect: number;
    private points: Map<string, Point>;
    private query: Query;
    private updateCir: boolean;
    private updateRect: boolean;

    get size(): number {
        return this.points.size;
    }

    get mapBounds(): LatLngBounds {
        return this.map.getBounds();
    }

    private get grayScaleCir(): string {
        const g = this.maxOverlapCir > 1 ? Math.floor(255 / this.maxOverlapCir) : 127;
        return rgb(g, g, g);
    }

    private get grayScaleRect(): string {
        const g = this.maxOverlapRect > 1 ? Math.floor(255 / this.maxOverlapRect) : 127;
        return rgb(g, g, g);
    }

    componentDidMount() {
        this.createMap();
    }

    addPoint(x: number, y: number, place?: PlaceResult): void {
        const p = this.createPoint(x, y, place);

        if(!p)
            return;

        this.updateCir = this.updateRect = true;
        this.updateFill([p]);
        this.props.updateCount(this.size);
        this.props.updateHistory();
    }

    addPoints(poss: Array<Params>): void {
        const inserted: Array<Point> = [];
        poss.forEach(({ x, y, place }) => {
            let p = this.createPoint(x, y, place);
            if(p)
                inserted.push(p);
        });

        if(inserted.length === 0)
            return;

        this.updateCir = this.updateRect = true;
        this.updateFill(inserted);
        this.props.updateCount(this.size);
        this.props.updateHistory();
    }

    changeQuery(query: Query): void {
        // update circle bound if necessary
        if(query.radius && query.radius > 0) {
            this.query.radius = query.radius * 1000;
            this.points.forEach(v => v.circle.setRadius(this.query.radius));
            this.updateCir = true;
        }

        // update rectangle if necessary
        if(query.height && query.height > 0) {
            this.query.height = query.height * 1000;
            this.updateRect = true;
        }
        if(query.width && query.height > 0) {
            this.query.width = query.width * 1000;
            this.updateRect = true;
        }
        if(this.updateRect)
            this.points.forEach(v => v.rectangle.setBounds(this.calcBound(v.pos)));

        this.updateFill();
    }

    clear(): void {
        this.createMap();

        // reset all points
        this.points = new Map();

        this.maxOverlapCir = this.maxOverlapRect = 1;

        this.props.resetSearch();
        this.props.updateCount(0);
    }

    generateRecords(): Array<Record> {
        return Array.from(this.points.values());
    }

    removePoint(x: number, y: number): void {
        if(this.deletePoint(x, y)) {
            this.updateCir = this.updateRect = true;
            this.updateFill();
            this.props.updateHistory();
            this.props.updateCount(this.size);
        }
    }

    removePoints(points: Array<Coordinate>): void {
        let c = 0;
        points.forEach(p => {
            if(this.deletePoint(p.x, p.y))
                ++c;
        });

        if(c) {
            this.updateCir = this.updateRect = true;
            this.updateFill();
            this.props.updateHistory();
            this.props.updateCount(this.size);
        }
    }

    render() {
        return <div className="map-canvas" ref={ref => this.mapContainer = ref}/>;
    }

    // there is no need to update the component, manipulation controlled by Google Maps JavaScript
    shouldComponentUpdate() {
        return false;
    }

    setDisplay(display: Display): void {
        this.display = display;

        if(display === 'Rectangle')
            this.points.forEach(v => {
                v.circle.setMap(null);
                v.rectangle.setMap(this.map);
            });
        else
            this.points.forEach(v => {
                v.circle.setMap(this.map);
                v.rectangle.setMap(null);
            });
    }

    constructor(props: MapComponentProps) {
        super(props);

        this.display = 'Rectangle';
        this.maxOverlapCir = this.maxOverlapRect = 1;
        this.map = null;
        this.points = new Map();
        this.query = { height: 10000, width: 10000, radius: 10000 };
        this.updateCir = this.updateRect = false;
    }

    private calcBound(c: LatLng): LatLngBoundsLiteral {
        return {
            north: computeOffset(c, this.query.height, 0).lat(),
            south: computeOffset(c, this.query.height, 180).lat(),
            east: computeOffset(c, this.query.width, 90).lng(),
            west: computeOffset(c, this.query.width, 270).lng()
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
        this.map.addListener('bounds_changed', () => this.props.updateSearchBounds(this.mapBounds));
        this.map.addListener('click', e => this.addPoint(e.latLng.lng(), e.latLng.lat()));
    }

    private createPoint(x: number, y: number, place: PlaceResult): Point {
        let p = this.points.get(stringifyCoordinate(x, y));
        if(p)
            return null;

        // if the point does not exist, create a new point and place the marker and the
        // rectangle on the map
        let c = new LatLng(y, x);
        p = new Point(
            c, place, new Marker(
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
            new Circle(
                {
                    map: null,
                    center: c,
                    radius: this.query.radius,
                    fillOpacity: 0.3,
                    fillColor: this.grayScaleCir,
                    strokeOpacity: 0,
                    clickable: false
                }
            ),
            new Rectangle(
                {
                    map: null,
                    bounds: this.calcBound(c),
                    fillOpacity: 0.3,
                    fillColor: this.grayScaleRect,
                    strokeOpacity: 0,
                    clickable: false
                }
            )
        );

        if(this.display === 'Rectangle')
            p.rectangle.setMap(this.map);
        else
            p.circle.setMap(this.map);

        p.marker.addListener('rightclick', e => this.removePoint(e.latLng.lng(), e.latLng.lat()));
        this.points.set(p.toKey(), p);

        return p;
    }

    private deletePoint(x: number, y: number) {
        const key = stringifyCoordinate(x, y);
        const p = this.points.get(key);
        if(!p)
            return null;

        p.marker.setMap(null);
        p.rectangle.setMap(null);
        p.circle.setMap(null);
        this.points.delete(key);

        return p;
    }

    private updateFill(inserted?: Array<Point>): void {
        let circles: any, rectangles: any;

        // search over affected area
        if(!inserted) {
            if(this.updateCir) {
                circles = new Set<CirRegion>();
                this.points.forEach(v => circles.add(v.cirBound));
            }
            if(this.updateRect) {
                rectangles = new Set<RectRegion>();
                this.points.forEach(v => rectangles.add(v.rectBound));
            }
        } else {
            if(this.updateCir) {
                circles = new Map<string, CirRegion>();
                inserted.forEach(p => this.points.forEach(v => {
                    let l = circles.get(p.toKey()), r = circles.get(v.toKey());
                    if(!l) {
                        l = p.cirBound;
                        circles.set(p.toKey(), l);
                    }

                    if(r)
                        return;

                    r = v.cirBound;
                    if(l.intersect(r))
                        circles.set(v.toKey(), r);
                }));
            }
            if(this.updateRect) {
                rectangles = new Map<string, RectRegion>();
                inserted.forEach(p => this.points.forEach(v => {
                    let l = rectangles.get(p.toKey()), r = rectangles.get(v.toKey());
                    if(!l) {
                        l = p.rectBound;
                        rectangles.set(p.toKey(), l);
                    }

                    if(r)
                        return;

                    r = v.rectBound;
                    if(l.intersect(r))
                        rectangles.set(v.toKey(), r);
                }));
            }
        }

        let maxOverlap: number, updated: boolean = false;

        // determine if circles need update
        if(this.updateCir) {
            maxOverlap = lineSweepCRESTCir(Array.from(circles.values()));
            if(maxOverlap > this.maxOverlapCir) {
                this.maxOverlapCir = maxOverlap;
                updated = true;
            } else
                this.updateCir = false;
        }

        // determine if rectangles need update
        if(this.updateRect) {
            maxOverlap = lineSweepCRESTRect(Array.from(rectangles.values()));
            if(maxOverlap > this.maxOverlapRect) {
                this.maxOverlapRect = maxOverlap;
                updated = true;
            } else
                this.updateRect = false;
        }

        // update fill of each points if any changes applied
        if(updated)
            this.points.forEach(v => {
                if(this.updateRect)
                    v.rectangle.setOptions({ fillColor: this.grayScaleRect });
                if(this.updateCir)
                    v.circle.setOptions({ fillColor: this.grayScaleCir });
            });

        this.updateCir = this.updateRect = false;
    }
}

export default MapComponent;
