import React from "react";
import ReactDOM from "react-dom";
import App from "./js/App";
import Header from "./js/Header";
import Footer from "./js/Footer";
import registerServiceWorker from "./registerServiceWorker";

ReactDOM.render(<Header />, document.getElementById("header"));
ReactDOM.render(<App />, document.getElementById("root"));
ReactDOM.render(<Footer />, document.getElementById("footer"));

registerServiceWorker();
