import React, {Component} from "react";
import InputForm from "./Component";
import "../css/App.css";

class App extends Component {
    render() {
        return <InputForm canvas={this.props.canvas} />;
    }
}

export default App;
