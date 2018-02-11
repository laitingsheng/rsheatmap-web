import * as React from 'react';
import { findDOMNode } from 'react-dom';
import {
    Action,
    binarySearch,
    Comparable,
    compareFunction,
    DataObject,
    Function,
    rgb
} from '../Util';
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

export class Record extends DataObject implements Coordinate, Comparable<Record> {
    get x(): number {
        return this.pos.lat();
    }

    get y(): number {
        return this.pos.lng();
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
        return stringifyCoordinate(this.pos.lat(), this.pos.lng());
    }

    constructor(readonly pos: LatLng, readonly place: PlaceResult) {
        super();
        this.toString = this.toKey;
    }
}

export interface Bound {
    readonly minX: number;
    readonly minY: number;
    readonly maxX: number;
    readonly maxY: number;
}

class Tick extends DataObject implements Comparable<Tick> {
    readonly open: number;

    [Symbol.toPrimitive](hint: string) {
        if(hint === 'number')
            return this.tick;

        if(hint === 'string')
            return this.toString();

        return true;
    }

    compareTo(o: Tick): number {
        if(this === o)
            return 0;

        let re = this.tick - o.tick;
        if(re)
            return re;
        if(re = this.open - o.open)
            return re;
        return this.region.compareTo(o.region);
    }

    toString(): string {
        return `${this.tick} ${this.region} ${this.open ? 'open' : 'close'}`;
    }

    constructor(readonly tick: number, readonly region: Region, open: boolean) {
        super();
        this.open = Number(open);
    }
}

class Region extends DataObject implements Bound, Comparable<Region> {
    readonly minXTick: Tick;
    readonly maxXTick: Tick;
    readonly minYTick: Tick;
    readonly maxYTick: Tick;

    get minX(): number {
        return +this.minXTick;
    }

    get minY(): number {
        return +this.maxXTick;
    }

    get maxX(): number {
        return +this.minYTick;
    }

    get maxY(): number {
        return +this.maxYTick;
    }

    static fromLatLngBound(bound: LatLngBounds): Region {
        const sw = bound.getSouthWest(), ne = bound.getNorthEast();
        return new Region(sw.lat(), sw.lng(), ne.lat(), ne.lng());
    }

    compareTo(o: Region): number {
        if(this === o)
            return 0;

        let re = this.minX - o.minX;
        if(re)
            return re;
        if(re = this.maxX - o.maxX)
            return re;
        if(re = this.minY - o.minY)
            return re;
        return this.maxY - o.maxY;
    }

    toKey(): string {
        return `[${this.minX} ${this.minY} ${this.maxX} ${this.maxY}]`;
    }

    private constructor(minX: number, minY: number, maxX: number, maxY: number) {
        super();

        this.toString = this.toKey;

        this.minXTick = new Tick(minX, this, true);
        this.maxXTick = new Tick(maxX, this, false);
        this.minYTick = new Tick(minY, this, true);
        this.maxYTick = new Tick(maxY, this, false);
    }
}

class Point extends Record {
    bound: Region;

    constructor(pos: LatLng, readonly marker: Marker, readonly rectangle: Rectangle,
                place: PlaceResult) {
        super(pos, place);
        this.bound = Region.fromLatLngBound(rectangle.getBounds());
    }
}

export interface Query {
    height: number;
    width: number;
}

export interface MapComponentProps {
    resetSearch: Action<void>;
    updateHistory: Action<void>;
    updateSearchBounds: Function<LatLngBounds, void>;
}

export interface Params extends Coordinate {
    readonly place?: PlaceResult;
}

function lineSweepCREST(candidates: Array<Region>): number {
    let maxOverlap = 1;

    // store critical events in order
    const ticks: Array<Tick> = [];
    candidates.forEach(r => ticks.push(r.minXTick, r.maxXTick));
    ticks.sort(compareFunction);

    // line-sweep
    let sweep: Array<Tick> = [], prevTick: Tick;
    ticks.forEach(xTick => {
        let overlap = 0;
        if(prevTick)
            sweep.forEach(yTick => {
                if(yTick.open)
                    ++overlap;
                else
                    --overlap;

                if(overlap > maxOverlap)
                    maxOverlap = overlap;
            });

        if(xTick.open) {
            sweep.push(xTick.region.minYTick, xTick.region.maxYTick);
            sweep.sort(compareFunction);
        } else {
            binarySearch(sweep, 0, sweep.length, xTick.region.minYTick, compareFunction,
                         index => sweep.splice(index, 1));
            binarySearch(sweep, 0, sweep.length, xTick.region.maxYTick, compareFunction,
                         index => sweep.splice(index, 1));
        }

        prevTick = xTick;
    });

    return maxOverlap;
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

    private get grayScale(): string {
        const g = Math.floor(255 / this.maxOverlap);
        return rgb(g, g, g);
    }

    componentDidMount() {
        this.createMap();
    }

    addPoint(x: number, y: number, place?: PlaceResult): void {
        const p = this.createPoint(x, y, place);

        if(!p)
            return;

        this.updateOpacity([p.bound]);
        this.props.updateHistory();
    }

    addPoints(poss: Array<Params>): void {
        const bounds: Array<Region> = [];
        poss.forEach(({ x, y, place }) => {
            let p = this.createPoint(x, y, place);
            if(p)
                bounds.push(p.bound);
        });

        if(bounds.length === 0)
            return;

        this.updateOpacity(bounds);
        this.props.updateHistory();
    }

    changeQuery(queryHeight: number, queryWidth: number): void {
        this.query.height = queryHeight;
        this.query.width = queryWidth;

        // change boundaries
        const bounds: Array<Bound> = [];
        this.points.forEach(v => {
            v.rectangle.setBounds(this.calcBound(v.pos));
            v.bound = Region.fromLatLngBound(v.rectangle.getBounds());
            bounds.push(v.bound);
        });

        this.updateOpacity();
    }

    clear(): void {
        this.createMap();

        // reset all points
        this.points = new Map();

        this.maxOverlap = 0;

        this.props.resetSearch();
    }

    generateRecords(): Array<Record> {
        return Array.from(this.points.values());
    }

    removePoint(x: number, y: number): void {
        if(this.deletePoint(x, y)) {
            this.updateOpacity();
            this.props.updateHistory();
        }
    }

    removePoints(points: Array<Coordinate>): void {
        let c = 0;
        points.forEach(p => {
            if(this.deletePoint(p.x, p.y))
                ++c;
        });

        if(c) {
            this.updateOpacity();
            this.props.updateHistory();
        }
    }

    // there is no need to update the component
    shouldComponentUpdate() {
        return false;
    }

    render() {
        return <div className="map-canvas" ref={ref => this.mapContainer = ref}/>;
    }

    constructor(props: MapComponentProps) {
        super(props);

        this.maxOverlap = 0;
        this.map = null;
        this.points = new Map();
        this.query = { height: 10, width: 10 };
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
                    fillOpacity: 0.4,
                    fillColor: this.grayScale,
                    strokeOpacity: 0,
                    clickable: false
                }
            ),
            place
        );

        p.marker.addListener('rightclick', e => this.removePoint(e.latLng.lat(), e.latLng.lng()));

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
        this.points.delete(key);

        return p;
    }

    private updateOpacity(inserted?: Array<Region>): void {
        // determined affected regions
        if(inserted) {
            const cs = new Set<Region>();
            inserted.forEach(r => {
                cs.add(r);
                const ins = this.index.search(r);
                ins.forEach(cs.add.bind(cs));
            });
            inserted = Array.from(cs.values());
        } else {
            inserted = [];
            this.points.forEach(v => inserted.push(v.bound));
        }

        // line sweep affected regions
        const maxOverlap = lineSweepCREST(inserted);
        if(maxOverlap <= this.maxOverlap)
            return;
        this.maxOverlap = maxOverlap;

        // update opacity of each rectangles
        this.points.forEach(v => v.rectangle.setOptions({ fillColor: this.grayScale }));
    }
}

export default MapComponent;
