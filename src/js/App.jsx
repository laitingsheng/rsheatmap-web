"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({__proto__: []} instanceof Array && function (d, b) {
            d.__proto__ = b;
        }) ||
        function (d, b) {
            for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        };
    return function (d, b) {
        extendStatics(d, b);

        function __() {
            this.constructor = d;
        }

        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", {value: true});
var React = require("react");
var Component_1 = require("./Component");
var MapComponent_1 = require("./MapComponent");
var HeatMap_1 = require("./HeatMap");
require("../css/Map.css");
var App = /** @class */ (function (_super) {
    __extends(App, _super);

    function App(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {heatmap: new HeatMap_1.default()};
        return _this;
    }

    App.prototype.render = function () {
        return (<div>
            <Component_1.default/>
            <MapComponent_1.default isMarkerShown/>
        </div>);
    };
    return App;
}(React.Component));
exports.App = App;
exports.default = App;
