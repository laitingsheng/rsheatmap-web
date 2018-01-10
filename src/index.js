import React from "react";
import ReactDOM from "react-dom";
import App from "./js/App";
import MapCanvas from "./js/Canvas";
import Header from "./js/Header";
import Footer from "./js/Footer";
import registerServiceWorker from "./registerServiceWorker";

const canvas = <MapCanvas />;
ReactDOM.render(<Header />, document.getElementById("header"));
ReactDOM.render(<App canvas={canvas} />, document.getElementById("root"));
ReactDOM.render(canvas, document.getElementById("map"));
ReactDOM.render(<Footer />, document.getElementById("footer"));

registerServiceWorker();
