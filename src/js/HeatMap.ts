import * as rbush from 'rbush';
import knn from 'rbush-knn';

interface Point {
    x: number;
    y: number;
}

interface Region extends rbush.BBox {
    point: Point;
}

class HeatMap {
    public points: Array<Point>;
    public queryHeight: number;
    public queryWidth: number;
    public maxWeight: number;
    private tree: rbush.RBush<Region>;

    public constructor() {
        this.tree = rbush<Region>();
        this.points = [];
        this.queryHeight = this.queryWidth = 100;
    }

    public addPoint(point: Point): void {
        this.points.push(point);
        this.tree.insert(this.point2query(point));
    }

    public addPoints(points: Array<Point>): void {
        this.points.concat(points);
    }

    public changeQuery(queryHeight: number, queryWidth: number) {
        this.queryHeight = queryHeight;
        this.queryWidth = queryWidth;

        this.tree = rbush();
        this.tree.load(this.points.map(this.point2query));
    }

    public divide(): void {
        this.points.sort();
        const w = Math.max(...this.points.map(point => knn(this.tree, point.x, point.y).length));
        if (this.maxWeight)
            this.maxWeight = w;
        else
            this.maxWeight = Math.max(this.maxWeight, w);
    }

    private point2query(point: Point): Region {
        return {
            minX: point.x - this.queryWidth, minY: point.y - this.queryHeight,
            maxX: point.x + this.queryWidth, maxY: point.y + this.queryHeight, point
        };
    }
}

export { Point, Region, HeatMap };
export default HeatMap;
