import React, {Component} from "react";
import InputForm from "./Component";
import MapComponent from "./MapComponent";
import HeatMap from "./HeatMap";
import "../css/Map.css";

class App extends Component {
    constructor(props) {
        super(props);

        this.state = {heatmap: new HeatMap()};
    }

    render() {
        return (<div>
            <InputForm />
            <MapComponent isMarkerShown />
        </div>);
    }
}

export {App};
export default App;
