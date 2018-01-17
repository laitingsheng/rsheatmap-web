import rbush from 'rbush';
import knn from './rbush-knn';
import { UnaryFunction } from './Functions';

export interface Point {
    x: number;
    y: number;
}

export interface Region {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

export interface Query {
    height: number;
    width: number;
}

export class HeatMap {
    public points: Array<Point>;
    public regions: Array<Region>;
    public query: Query;
    private point2region: UnaryFunction<Point, Region>;
    private tree: rbush;

    public get size(): number {
        return this.points.length;
    }

    private static __point2region(query: Query, point: Point): Region {
        return {
            minX: point.x - query.width, minY: point.y - query.height,
            maxX: point.x + query.width, maxY: point.y + query.height
        };
    }

    public constructor() {
        this.tree = new rbush();
        this.points = [];
        this.regions = [];
        this.query = { height: 100, width: 100 };

        this.point2region = HeatMap.__point2region.bind(this, this.query);
    }

    public addPoint(point: Point): void {
        this.points.push(point);
        let region = this.point2region(point);
        this.regions.push(region);
        this.tree.insert(region);
    }

    public addPoints(points: Array<Point>): void {
        this.points.concat(points);
        let regions = points.map(this.point2region);
        this.regions.concat(regions);
        this.tree.load(regions);
    }

    public changeQuery(queryHeight: number, queryWidth: number): void {
        this.query.height = queryHeight;
        this.query.width = queryWidth;

        this.tree = new rbush();
        this.regions = this.points.map(this.point2region);
        this.tree.load(this.regions);
    }

    public divide(): number {
        this.points.sort();
        return Math.max(...this.points.map(point => knn(this.tree, point.x, point.y, 0)));
    }

    public clear(): void {
        this.points = [];
        this.regions = [];
        this.tree.clear();
    }
}

export default HeatMap;
