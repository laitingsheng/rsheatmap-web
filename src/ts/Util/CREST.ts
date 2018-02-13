import { binarySearch, Comparable, compareFunction, DataObject } from './Util';
import Circle = google.maps.Circle;
import LatLng = google.maps.LatLng;
import Rectangle = google.maps.Rectangle;

const computeDistanceBetween = google.maps.geometry.spherical.computeDistanceBetween;

export class Tick extends DataObject implements Comparable<Tick> {
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

    constructor(readonly tick: number, readonly region: RectRegion, open: boolean) {
        super();
        this.open = Number(open);
    }
}

export class RectRegion extends DataObject implements Comparable<RectRegion> {
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

    static fromRectangle(rectangle: Rectangle): RectRegion {
        const bound = rectangle.getBounds(), sw = bound.getSouthWest(), ne = bound.getNorthEast();
        return new RectRegion(sw.lat(), sw.lng(), ne.lat(), ne.lng());
    }

    compareTo(o: RectRegion): number {
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

    equals(o: RectRegion): boolean {
        return this.compareTo(o) === 0;
    }

    intersect(o: RectRegion): boolean {
        return this.minX < o.maxX && this.maxX > o.minX && this.minY < o.maxY && this.maxY > o.minY;
    }

    private constructor(minX: number, minY: number, maxX: number, maxY: number) {
        super();

        this.minXTick = new Tick(minX, this, true);
        this.maxXTick = new Tick(maxX, this, false);
        this.minYTick = new Tick(minY, this, true);
        this.maxYTick = new Tick(maxY, this, false);
    }
}

export function lineSweepCRESTRect(regions: Array<RectRegion>): number {
    let maxOverlap = 1;

    // store critical events in order
    const ticks: Array<Tick> = [];
    regions.forEach(r => ticks.push(r.minXTick, r.maxXTick));
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

export class CirRegion extends DataObject implements Comparable<CirRegion> {
    static fromCircle(circle: Circle): CirRegion {
        return new CirRegion(circle.getCenter(), circle.getRadius());
    }

    compareTo(o: CirRegion): number {
        let re = this.centre.lat() - o.centre.lat();
        if(re)
            return re;
        if(re = this.centre.lng() - o.centre.lng())
            return re;
        return this.radius - o.radius;
    }

    equals(o: CirRegion): boolean {
        return this.compareTo(o) === 0;
    }

    intersect(o: CirRegion): boolean {
        return computeDistanceBetween(this.centre, o.centre) < this.radius + o.radius;
    }

    private constructor(public centre: LatLng, public radius: number) {
        super();
    }
}

export function lineSweepCRESTCir(regions: Array<CirRegion>): number {
    return 1;
}
