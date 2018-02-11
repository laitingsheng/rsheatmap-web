import { DataObject } from './Util';

export interface Bound2D {
    readonly area: number;
    readonly margin: number;

    combine(o: Bound2D): Bound2D;

    compareMinX(o: Bound2D): number;

    compareMaxX(o: Bound2D): number;

    compareMinY(o: Bound2D): number;

    compareMaxY(o: Bound2D): number;

    contain(o: Bound2D): boolean;

    enlargedArea(o: Bound2D): number;

    extend(o: Bound2D): void;

    isOverlap(o: Bound2D): boolean;

    newArbitraryBound(): Bound2D;

    overlapArea(o: Bound2D): number;
}

// Predefined rectangular bound
export class RectBound extends DataObject implements Bound2D {
    get area(): number {
        return (this.maxX - this.minX) * (this.maxY - this.minY);
    }

    get margin(): number {
        return (this.maxX - this.minX) + (this.maxY - this.minY);
    }

    combine(o: RectBound): RectBound {
        return null;
    }

    compareMinX(o: RectBound): number {
        return undefined;
    }

    compareMaxX(o: RectBound): number {
        return undefined;
    }

    compareMinY(o: RectBound): number {
        return undefined;
    }

    compareMaxY(o: RectBound): number {
        return undefined;
    }

    contain(o: RectBound): boolean {
        return false;
    }

    enlargedArea(o: RectBound): number {
        return undefined;
    }

    equals(o: RectBound): boolean {
        return undefined;
    }

    extend(o: RectBound): void {
    }

    isOverlap(o: RectBound): boolean {
        return undefined;
    }

    newArbitraryBound(): RectBound {
        return new RectBound(Infinity, Infinity, -Infinity, -Infinity);
    }

    overlapArea(o: RectBound): number {
        return undefined;
    }

    reset(): void {
        this.minX = this.minY = Infinity;
        this.maxX = this.maxY = -Infinity;
    }

    constructor(private minX: number, private minY: number, private maxX: number,
                private maxY: number) {
        super();
    }
}

// Predefined circular bound
export class CirBound extends DataObject implements Bound2D {
    get area() {
        return this.radius * this.radius;
    }

    get margin() {
        return this.radius;
    }

    combine(o: CirBound): CirBound {
        return null;
    }

    compareMinX(o: CirBound): number {
        return undefined;
    }

    compareMaxX(o: CirBound): number {
        return undefined;
    }

    compareMinY(o: CirBound): number {
        return undefined;
    }

    compareMaxY(o: CirBound): number {
        return undefined;
    }

    contain(o: CirBound): boolean {
        return false;
    }

    enlargedArea(o: CirBound): number {
        return undefined;
    }

    equals(o: CirBound): boolean {
        return undefined;
    }

    extend(o: CirBound): void {
    }

    isOverlap(o: CirBound): boolean {
        return undefined;
    }

    newArbitraryBound(): CirBound {
        return new CirBound(Infinity, Infinity, Infinity);
    }

    overlapArea(o: CirBound): number {
        return undefined;
    }

    reset(): void {
        this.centerX = this.centerY = this.radius = Infinity;
    }

    constructor(private centerX: number, private centerY: number, private radius: number) {
        super();
    }
}

export default Bound2D;
