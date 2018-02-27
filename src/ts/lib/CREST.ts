import { ComparableDataObject } from './Util';
import Circle = google.maps.Circle;
import LatLng = google.maps.LatLng;
import Rectangle = google.maps.Rectangle;

const computeDistanceBetween = google.maps.geometry.spherical.computeDistanceBetween;
const computeHeading = google.maps.geometry.spherical.computeHeading;
const computeOffset = google.maps.geometry.spherical.computeOffset;

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
    const xAxis = Array.from(canvas.entries());
    xAxis.sort((l, r) => l[0] - r[0]);

    // line-sweep
    let sweep = new Map<number, number>(), prevA: [number, Axes] = null;
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
    readonly minX: number;
    readonly midX: number;
    readonly maxX: number;
    readonly minY: number;
    readonly maxY: number;

    get centre(): LatLng {
        return this.circle.getCenter();
    }

    get radius(): number {
        return this.circle.getRadius();
    }

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
        const bound = circle.getBounds(), sw = bound.getSouthWest(), ne = bound.getNorthEast();
        this.minX = sw.lng();
        this.midX = this.centre.lng();
        this.maxX = ne.lng();
        this.minY = sw.lat();
        this.maxY = ne.lat();
    }
}

export function lineSweepCRESTCir(regions: Array<CirRegion>): number | never {
    let maxOverlap = 1;

    // pre-process and identify x ticks of critical events
    const canvas = new Map<number, Map<number, number>>();
    regions.forEach((v, i) => {
        if(!canvas.get(v.minX))
            canvas.set(v.minX, new Map());
        if(!canvas.get(v.midX))
            canvas.set(v.midX, new Map());
        if(!canvas.get(v.maxX))
            canvas.set(v.maxX, new Map());

        for(let j = i + 1; j < regions.length; ++j) {
            const child = regions[j];
            if(v.intersect(child)) {
                const [i1, i2] = v.intersectWith(child);
                if(!canvas.get(i1.lng()))
                    canvas.set(i1.lng(), new Map());
                if(!canvas.get(i2.lng()))
                    canvas.set(i2.lng(), new Map());
            }
        }
    });
    const xAxis = Array.from(canvas.entries());
    xAxis.sort((l, r) => l[0] - r[0]);

    // process the critical events
    regions.forEach(r => {
        for(const t of xAxis) {
            const bound = r.circle.getBounds();

            if(bound.getNorthEast().lng() <= t[0])
                break;

            if(bound.getSouthWest().lng() >= t[0])
                continue;

            const tmp = new LatLng(r.centre.lat(), t[0]),
                tmpDist = computeDistanceBetween(tmp, r.centre),
                height = Math.sqrt(r.radius * r.radius - tmpDist * tmpDist),
                u = computeOffset(tmp, height, 0), l = computeOffset(tmp, height, -180);

            let yt = t[1].get(l.lat());
            if(yt)
                t[1].set(l.lat(), yt + 1);
            else
                t[1].set(l.lat(), 1);

            yt = t[1].get(u.lat());
            if(yt)
                t[1].set(u.lat(), yt - 1);
            else
                t[1].set(u.lat(), -1);
        }
    });

    // line-sweep
    xAxis.forEach(a => {
        const sweep = Array.from(a[1].entries());
        sweep.sort((l, r) => l[0] - r[0]);
        let overlap = 0;
        sweep.forEach(v => {
            overlap += v[1];
            if(overlap > maxOverlap)
                maxOverlap = overlap;
        });
    });

    alert(maxOverlap);
    return maxOverlap;
}
