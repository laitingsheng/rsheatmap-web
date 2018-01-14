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
    tree: rbush.RBush<Region>;
    points: Array<Point>;
    queryHeight: number;
    queryWidth: number;
    maxWeight: number;

    constructor() {
        this.tree = rbush<Region>();
        this.points = [];
        this.queryHeight = this.queryWidth = 100;
    }

    point2query(point: Point): Region {
        return {
            minX: point.x - this.queryWidth, minY: point.y - this.queryHeight,
            maxX: point.x + this.queryWidth, maxY: point.y + this.queryHeight, point
        };
    }

    addPoint(point: Point): void {
        this.points.push(point);
        this.tree.insert(this.point2query(point));
    }

    addPoints(points: Array<Point>): void {
        this.points.concat(points);
        this.tree.load(this.points.map(this.point2query));
    }

    divide(): void {
        this.points.sort();
        const w = Math.max(...this.points.map(point => knn(this.tree, point.x, point.y).length));
        if (this.maxWeight)
            this.maxWeight = w;
        else
            this.maxWeight = Math.max(this.maxWeight, w);
    }
}

export { Point, Region, HeatMap };
export default HeatMap;
