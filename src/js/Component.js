import React, {Component} from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-fileinput/js/fileinput.min";
import "bootstrap-fileinput/css/fileinput.min.css";
import "../css/Component.css";

class Title extends Component {
    render() {
        return <p className="form-title">{this.props.text}</p>;
    }
}

class InputNumberBox extends Component {
    render() {
        return (<div className="form-group">
            <label htmlFor={this.props.id}>{this.props.name}</label>
            <input type="number" min={this.props.min} step="0.001" className="form-control"
                   required id={this.props.id} placeholder={this.props.placeholder}
                   value={this.props.value} onChange={this.props.onChange} />
        </div>);
    }
}

class InputForm extends Component {
    constructor(props) {
        super(props);

        this.state = {
            queryHeight: 100, queryWidth: 100
        };

        // bindings
        this.updateLongitude = this.updateLongitude.bind(this);
        this.updateLatitude = this.updateLatitude.bind(this);
        this.updateQueryHeight = this.updateQueryHeight.bind(this);
        this.updateQueryWidth = this.updateQueryWidth.bind(this);
        this.resetFiles = this.resetFiles.bind(this);
        this.addPoint = this.addPoint.bind(this);
        this.addPoints = this.addPoints.bind(this);
        this.changeRegion = this.changeRegion.bind(this);
    }

    updateLongitude(event) {
        this.setState({longitude: event.target.value});
    }

    updateLatitude(event) {
        this.setState({latitude: event.target.value});
    }

    updateQueryHeight(event) {
        this.setState({queryHeight: event.target.value});
    }

    updateQueryWidth(event) {
        this.setState({queryWidth: event.target.value});
    }

    resetFiles(event) {
        event.preventDefault();
    }

    addPoint(event) {
        event.preventDefault();
    }

    addPoints(event) {
        event.preventDefault();
        alert(this.input.files[0].name);
    }

    changeRegion(event) {
        event.preventDefault();
    }

    render() {
        return (<div className="wrap-box">
            <form encType="multipart/form-data" className="wrap-full-box" onSubmit={this.addPoints}
                  onReset={this.resetFiles}>
                <Title text="File Input" />
                <div className="file-loading">
                    <input type="file" className="file" id="data_files" accept=".txt" multiple
                           ref={input => this.input = input} />
                </div>
            </form>
            <form encType="multipart/form-data" className="wrap-full-box wrap-inner-box"
                  onSubmit={this.addPoint}>
                <Title text="Point" />
                <InputNumberBox name="Longitude" id="lng" placeholder="Enter longitude" />
                <InputNumberBox name="Latitude" id="lat" placeholder="Enter latitude" />
                <button type="submit" className="btn btn-primary">
                    Add
                </button>
            </form>
            <form encType="multipart/form-data" className="wrap-full-box wrap-inner-box"
                  onSubmit={this.changeRegion}>
                <Title text="Query Region" />
                <InputNumberBox name="Height" id="height" value={this.state.queryHeight}
                                min="0" onChange={this.updateQueryHeight} />
                <InputNumberBox name="Width" id="width" value={this.state.queryWidth} min="0"
                                onChange={this.updateQueryWidth} />
                <button type="submit" className="btn btn-primary">
                    Apply
                </button>
            </form>
        </div>);
    }
}

export default InputForm;
