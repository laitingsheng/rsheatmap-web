"use strict";
Object.defineProperty(exports, "__esModule", {value: true});
var React = require("react");
var ReactDOM = require("react-dom");
var App_1 = require("./js/App");
it('renders without crashing', function () {
    var div = document.createElement('div');
    ReactDOM.render(<App_1.default/>, div);
});
