import rbush from 'rbush';
import knn from './rbush-knn';

export class Point {
    x: number;
    y: number;

    public constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public toString() {
        return `${this.x} ${this.y}`;
    }
}

interface Region {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

export interface Query {
}

export class HeatMap {
    public points: Array<Point>;
    public height: number;
    public width: number;
    private tree: rbush;

    public get size(): number {
        return this.points.length;
    }

    public constructor() {
        this.tree = new rbush();
        this.points = [];
        this.height = this.width = 100;
        this.point2region = this.point2region.bind(this);
    }

    public addPoint(point: Point): void {
        this.points.push(point);
        this.tree.insert(this.point2region(point));
    }

    public addPoints(points: Array<Point>): void {
        this.points.concat(points);
        this.tree.load(points.map(this.point2region));
    }

    public changeQuery(queryHeight: number, queryWidth: number): void {
        this.height = queryHeight;
        this.width = queryWidth;

        this.tree = new rbush();
        this.tree.load(this.points.map(this.point2region));
    }

    public divide(): number {
        this.points.sort();
        return Math.max(...this.points.map(point => knn(this.tree, point.x, point.y, 0)));
    }

    public clear(): void {
        this.points = [];
        this.tree.clear();
    }

    private point2region(point: Point): Region {
        return {
            minX: point.x - this.width, minY: point.y - this.height,
            maxX: point.x + this.width, maxY: point.y + this.height
        };
    }
}

export default HeatMap;
