import React, {Component} from "react";
import InputForm from "./Component";
import MapCanvas from "./MapComponent";
import "../css/Map.css";

class App extends Component {
    render() {
        return (<div>
            <InputForm canvas={this.canvas} />
            <MapCanvas isMarkerShown />
        </div>);
    }
}

export {App};
export default App;
