import { binarySearch, Comparable, ComparableDataObject, compareFunction } from './Util';
import Circle = google.maps.Circle;
import LatLng = google.maps.LatLng;
import Rectangle = google.maps.Rectangle;

const computeDistanceBetween = google.maps.geometry.spherical.computeDistanceBetween;
const computeHeading = google.maps.geometry.spherical.computeHeading;
const computeOffset = google.maps.geometry.spherical.computeOffset;

export abstract class AbstractTick<R extends Comparable<R>>
    extends ComparableDataObject<AbstractTick<R>> {
    // auto convert
    [Symbol.toPrimitive](hint: string) {
        if(hint === 'number')
            return this.tick;

        if(hint === 'string')
            return this.toString();

        return true;
    }

    compareTo(o: AbstractTick<R>): number {
        if(this === o)
            return 0;

        let re = this.tick - o.tick;
        if(re)
            return re;
        if(re = this.region.compareTo(o.region))
            return re;
        return this.status - o.status;
    }

    protected constructor(readonly tick: number, readonly region: R, readonly status: number) {
        super();
    }
}

export class RectTick extends AbstractTick<RectRegion> {
    constructor(tick: number, region: RectRegion, status: number) {
        super(tick, region, status);
    }
}

export class RectRegion extends ComparableDataObject<RectRegion> {
    readonly minXTick: RectTick;
    readonly maxXTick: RectTick;
    readonly minYTick: RectTick;
    readonly maxYTick: RectTick;

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

    static fromRectangle(rectangle: Rectangle): RectRegion {
        const bound = rectangle.getBounds(), sw = bound.getSouthWest(), ne = bound.getNorthEast();
        return new RectRegion(sw.lng(), sw.lat(), ne.lng(), ne.lat());
    }

    compareTo(o: RectRegion): number {
        if(this === o)
            return 0;

        let re = this.minX - o.minX;
        if(re)
            return re;
        if(re = this.minY - o.minY)
            return re;
        if(re = this.maxX - o.maxX)
            return re;
        return this.maxY - o.maxY;
    }

    intersect(o: RectRegion): boolean {
        return this.minX < o.maxX && this.maxX > o.minX && this.minY < o.maxY && this.maxY > o.minY;
    }

    private constructor(minX: number, minY: number, maxX: number, maxY: number) {
        super();

        this.minXTick = new RectTick(minX, this, 1);
        this.maxXTick = new RectTick(maxX, this, 0);
        this.minYTick = new RectTick(minY, this, 1);
        this.maxYTick = new RectTick(maxY, this, 0);
    }
}

export function lineSweepCRESTRect(regions: Array<RectRegion>): number | never {
    let maxOverlap = 1;

    // store critical events in order
    const ticks: Array<RectTick> = [];
    regions.forEach(r => ticks.push(r.minXTick, r.maxXTick));
    ticks.sort(compareFunction);

    // line-sweep
    let sweep: Array<RectTick> = [], prevTick: RectTick;
    ticks.forEach(xTick => {
        let overlap = 0;
        // skip overlapping event
        if(prevTick && prevTick.tick !== xTick.tick)
            sweep.forEach(yTick => {
                if(yTick.status)
                    ++overlap;
                else
                    --overlap;

                if(overlap > maxOverlap)
                    maxOverlap = overlap;
            });

        switch(xTick.status) {
            case 0:
                binarySearch(sweep, 0, sweep.length, xTick.region.minYTick, compareFunction,
                             index => sweep.splice(index, 1));
                binarySearch(sweep, 0, sweep.length, xTick.region.maxYTick, compareFunction,
                             index => sweep.splice(index, 1));
                break;
            case 1:
                sweep.push(xTick.region.minYTick, xTick.region.maxYTick);
                sweep.sort(compareFunction);
                break;
            default:
                throw 'corrupted data';
        }

        prevTick = xTick;
    });

    return maxOverlap;
}

export class CirTick extends AbstractTick<CirRegion> {
    pair: CirTick;

    compareTo(o: CirTick): number {
        if(this === o)
            return 0;

        let re = this.tick - o.tick;
        if(re)
            return re;
        if(re = this.region.compareTo(o.region))
            return re;
        if(re = this.region2.compareTo(o.region2))
            return re;
        if(re = this.status - o.status)
            return re;
        if(re = this.verticalStatus - o.verticalStatus)
            return re;
        if(re = this.pos.lng() - o.pos.lng())
            return re;
        return this.pos.lat() - o.pos.lat();
    }

    toString(): string {
        return `${this.tick} ${this.region} ${this.region2} ${this.status} ${this.verticalStatus}`;
    }

    constructor(tick: number, region: CirRegion, readonly pos: google.maps.LatLng, status: number,
                readonly verticalStatus: number = 1, readonly region2: CirRegion = null) {
        super(tick, region, status);
    }
}

export class CirRegion extends ComparableDataObject<CirRegion> {
    readonly leftTick: CirTick;
    readonly rightTick: CirTick;
    readonly topTick: CirTick;
    readonly bottomTick: CirTick;
    readonly events: Map<string, CirTick>;

    get left(): number {
        return +this.leftTick;
    }

    get right(): number {
        return +this.rightTick;
    }

    get top(): number {
        return +this.topTick;
    }

    get bottom(): number {
        return +this.bottomTick;
    }

    get centre() {
        return this.circle.getCenter();
    }

    get radius() {
        return this.circle.getRadius();
    }

    static fromCircle(circle: Circle): CirRegion {
        return new CirRegion(circle);
    }

    compareTo(o: CirRegion): number {
        let re = this.left - o.left;
        if(re)
            return re;
        if(re = this.bottom - o.bottom)
            return re;
        if(re = this.right - o.right)
            return re;
        return this.top - o.top;
    }

    intersect(o: CirRegion): boolean {
        return computeDistanceBetween(this.centre, o.centre) < this.radius + o.radius;
    }

    intersectWith(o: CirRegion): [CirTick, CirTick] {
        const tc = this.centre, oc = o.centre, d = computeDistanceBetween(tc, oc),
            h = computeHeading(tc, oc), a = o.radius, b = this.radius,
            A = Math.acos((b * b + d * d - a * a) / (2 * b * d)) / Math.PI * 180;
        let lt: CirTick, rt: CirTick;

        if(h === 0) { // positive y-axis
            const l = computeOffset(tc, b, -A), r = computeOffset(tc, b, A);
            lt = new CirTick(l.lng(), this, l, 1, 1, o);
            rt = new CirTick(r.lng(), this, r, 1, 1, o);
        } else if(h === -180) { // negative y-axis
            const l = computeOffset(tc, b, -180 + A), r = computeOffset(tc, b, 180 - A);
            lt = new CirTick(l.lng(), this, l, 1, 1, o);
            rt = new CirTick(r.lng(), this, r, 1, 1, o);
        } else if(h < 0 && h >= -90) { // second quarter (with negative x-axis)
            const l = computeOffset(tc, b, h - A), r = computeOffset(tc, b, h + A);
            lt = new CirTick(l.lng(), this, l, 1, 0, o);
            rt = new CirTick(r.lng(), this, r, 1, 2, o);
        } else if(h < -90 && h > -180) { // third quarter
            const l = computeOffset(tc, b, h + A), r = computeOffset(tc, b, h - A);
            lt = new CirTick(l.lng(), this, l, 1, 2, o);
            rt = new CirTick(r.lng(), this, r, 1, 0, o);
        } else if(h > 0 && h < 90) { // first quarter
            const l = computeOffset(tc, b, h - A), r = computeOffset(tc, b, h + A);
            lt = new CirTick(l.lng(), this, l, 1, 2, o);
            rt = new CirTick(r.lng(), this, r, 1, 0, o);
        } else { // forth quarter (including positive x-axis)
            const l = computeOffset(tc, b, h + A), r = computeOffset(tc, b, h - A);
            lt = new CirTick(l.lng(), this, l, 1, 0, o);
            rt = new CirTick(r.lng(), this, r, 1, 2, o);
        }

        lt.pair = rt;
        rt.pair = lt;
        return [lt, rt];
    }

    toString(): string {
        return `${this.centre} ${this.radius}}`;
    }

    private constructor(readonly circle: Circle) {
        super();

        const bound = circle.getBounds(), sw = bound.getSouthWest(), ne = bound.getNorthEast();

        let tmp = new LatLng(this.centre.lat(), sw.lng());
        this.leftTick = new CirTick(tmp.lng(), this, tmp, 0);
        tmp = new LatLng(this.centre.lat(), ne.lng());
        this.leftTick.pair = this.rightTick = new CirTick(tmp.lng(), this, tmp, 2);
        this.rightTick.pair = this.leftTick;

        tmp = new LatLng(sw.lat(), this.centre.lng());
        this.topTick = new CirTick(tmp.lng(), this, tmp, 1, 2);
        tmp = new LatLng(ne.lat(), this.centre.lng());
        this.topTick.pair = this.bottomTick = new CirTick(tmp.lng(), this, tmp, 1, 0);
        this.bottomTick.pair = this.topTick;

        this.events = new Map();
    }
}

export function lineSweepCRESTCir(regions: Array<CirRegion>): number | never {
    let maxOverlap = 1;

    // add all critical events
    const ticks: Array<CirTick> = [];
    regions.forEach((v, i) => {
        ticks.push(v.leftTick, v.rightTick, v.bottomTick, v.topTick);
        for(let j = i + 1; j < regions.length; ++j) {
            const child = regions[j];
            if(v.intersect(child)) {
                const events = v.intersectWith(child);
                ticks.push(...events);
                v.events.set(events[0].toString(), events[0]);
                v.events.set(events[1].toString(), events[1]);
                child.events.set(events[0].toString(), events[0]);
                child.events.set(events[1].toString(), events[1]);
            }
        }
    });
    ticks.sort(compareFunction);

    // line sweep
    let sweep: Array<number> = [], prevTick: CirTick;
    ticks.forEach(xTick => {

        switch(xTick.status) {
            case 0:
                 break;
            case 1:
                break;
            case 2:
                break;
            default:
                throw `corrupted data`;
        }
        prevTick = xTick;
    });

    return maxOverlap;
}
