import rbush from "rbush";
import knn from "rbush-knn";

class HeatMap {
    constructor(opt) {
        this.tree = new rbush();
        this.points = [];

        if(opt) {
            this.queryHeight = opt.queryHeight;
            this.queryWidth = opt.queryWidth;
        } else this.queryHeight = this.queryWidth = 100;
    }

    point2query(point) {
        return {
            minX: point.x - this.queryWidth, minY: point.y - this.queryHeight,
            maxX: point.x + this.queryWidth, maxY: point.y + this.queryHeight, point
        };
    }

    addPoint(point) {
        this.points.push(point);
        this.tree.insert(this.point2query(point));
    }

    addPoints(points) {
        this.points.concat(points);
        this.tree.load(this.points.map(this.point2query));
    }

    retrieveDivision() {
        this.points.sort();
        const weight = this.points.map(point => [point, knn(this.tree, point.x, point.y).length]);
    }
}

export {HeatMap};
export default HeatMap;
