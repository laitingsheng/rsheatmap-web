"use strict";
Object.defineProperty(exports, "__esModule", {value: true});
var rbush_1 = require("rbush");
var rbush_knn_1 = require("rbush-knn");
var HeatMap = /** @class */ (function () {
    function HeatMap() {
        this.tree = new rbush_1.default();
        this.points = [];
        this.queryHeight = this.queryWidth = 100;
    }

    HeatMap.prototype.point2query = function (point) {
        return {
            minX: point.x - this.queryWidth, minY: point.y - this.queryHeight,
            maxX: point.x + this.queryWidth, maxY: point.y + this.queryHeight, point: point
        };
    };
    HeatMap.prototype.addPoint = function (point) {
        this.points.push(point);
        this.tree.insert(this.point2query(point));
    };
    HeatMap.prototype.addPoints = function (points) {
        this.points.concat(points);
        this.tree.load(this.points.map(this.point2query));
    };
    HeatMap.prototype.divide = function () {
        var _this = this;
        this.points.sort();
        var w = Math.max.apply(Math, this.points.map(function (point) {
            return rbush_knn_1.default(_this.tree, point.x, point.y).length;
        }));
        if (this.maxWeight)
            this.maxWeight = w;
        else
            this.maxWeight = Math.max(this.maxWeight, w);
    };
    return HeatMap;
}());
exports.HeatMap = HeatMap;
exports.default = HeatMap;
