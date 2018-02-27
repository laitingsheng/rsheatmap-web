import { Comparable, ComparableDataObject } from './Util';
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

export class RectRegion extends ComparableDataObject<RectRegion> {
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

    private constructor(readonly minX: number, readonly minY: number,
                        readonly maxX: number, readonly maxY: number) {
        super();
    }
}

type Axes = [Set<number>, Map<number, number>];

export function lineSweepCRESTRect(regions: Array<RectRegion>): number | never {
    let maxOverlap = 1;

    // store critical events in order
    const canvas = new Map<number, Axes>();
    regions.forEach(v => {
        let t = canvas.get(v.minX);
        if(t) {
            let yt = t[1].get(v.minY);
            if(yt)
                t[1].set(v.maxY, yt + 1);
            else
                t[1].set(v.minY, 1);

            yt = t[1].get(v.maxY);
            if(yt)
                t[1].set(v.maxY, yt - 1);
            else
                t[1].set(v.maxY, -1);
        } else
            canvas.set(v.minX, [new Set(), new Map([[v.minY, 1], [v.maxY, -1]])]);

        t = canvas.get(v.maxX);
        if(t) {
            t[0].add(v.minY);
            t[0].add(v.maxY);
        } else
            canvas.set(v.maxX, [new Set([v.minY, v.maxY]), new Map()]);
    });

    // line-sweep
    let sweep = new Map<number, number>(), prevA: [number, Axes] = null;
    const xAxis = Array.from(canvas.entries());
    xAxis.sort((l, r) => l[0] - r[0]);
    xAxis.forEach(a => {
        const ySweep = Array.from(sweep.entries());
        ySweep.sort((l, r) => l[0] - r[0]);
        if(prevA) {
            let overlap = 0, prevY: [number, number];
            ySweep.forEach(v => {
                if(prevY)
                    overlap += v[1];

                if(overlap > maxOverlap)
                    maxOverlap = overlap;

                prevY = v;
            });
        }

        a[1][0].forEach(v => sweep.delete(v));
        a[1][1].forEach((v, k) => {
            let tmp = sweep.get(k);
            if(!tmp) {
                sweep.set(k, v);
                return;
            }

            tmp += v;
            if(tmp)
                sweep.set(k, tmp);
            else
                sweep.delete(k);
        });

        prevA = a;
    });

    return maxOverlap;
}

export class CirRegion extends ComparableDataObject<CirRegion> {
    readonly centre: LatLng;
    readonly radius: number;

    static fromCircle(circle: Circle): CirRegion {
        return new CirRegion(circle);
    }

    compareTo(o: CirRegion): number {
        if(this.centre.equals(o.centre))
            return this.radius - o.radius;

        const re = computeHeading(this.centre, o.centre);
        if(re < 0)
            return -1;
        return 1;
    }

    intersect(o: CirRegion): boolean {
        return computeDistanceBetween(this.centre, o.centre) < this.radius + o.radius;
    }

    intersectWith(o: CirRegion): [LatLng, LatLng] {
        const tc = this.centre, oc = o.centre, d = computeDistanceBetween(tc, oc),
            h = computeHeading(tc, oc), a = o.radius, b = this.radius,
            A = Math.acos((b * b + d * d - a * a) / (2 * b * d)) / Math.PI * 180;
        return [computeOffset(tc, b, h - A), computeOffset(tc, b, h + A)];
    }

    toString(): string {
        return `${this.centre} ${this.radius}}`;
    }

    private constructor(readonly circle: Circle) {
        super();
    }
}

export function lineSweepCRESTCir(regions: Array<CirRegion>): number | never {
    let maxOverlap = 1;

    // add all critical events
    const canvas = new Map<number, Axes>();
    regions.forEach((v, i) => {
        const bound = v.circle.getBounds(), sw = bound.getSouthWest(),
            ne = bound.getNorthEast(), xMin = sw.lng(), xMid = v.centre.lng(), xMax = ne.lng(),
            yMin = sw.lat(), yMax = ne.lat();

        if(!canvas.get(xMin))
            canvas.set(xMin, [new Set(), new Map()]);

        let t = canvas.get(xMid);
        if(t) {
            let yt = t[1].get(yMin);
            if(yt)
                t[1].set(yMin, yt + 1);
            else
                t[1].set(yMin, 1);

            yt = t[1].get(yMax);
            if(yt)
                t[1].set(yMax, yt - 1);
            else
                t[1].set(yMax, -1);
        } else
            canvas.set(xMid, [new Set(), new Map([[yMin, 1], [yMax, -1]])]);

        if(!canvas.get(xMax))
            canvas.set(xMax, [new Set(), new Map()]);

        for(let j = i + 1; j < regions.length; ++j) {
            const child = regions[j];
            if(v.intersect(child)) {
                const ins = v.intersectWith(child);
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
