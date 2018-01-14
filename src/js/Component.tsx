import * as React from 'react';
import HeatMap from './HeatMap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-fileinput/js/fileinput.min';
import 'bootstrap-fileinput/css/fileinput.min.css';
import '../css/Component.css';

interface TitleProps {
    text: string;
}

class Title extends React.Component<TitleProps, any> {
    render() {
        return <p className="form-title">{this.props.text}</p>;
    }
}

class InputNumberBox extends React.Component<React.InputHTMLAttributes<any>, any> {
    render() {
        return (
            <div className="form-group">
                <label htmlFor={this.props.id}>{this.props.name}</label>
                <input type="number" min={this.props.min} step="0.001" className="form-control"
                       required id={this.props.id} placeholder={this.props.placeholder}
                       value={this.props.value} onChange={this.props.onChange}/>
            </div>
        );
    }
}

export interface InputFormProps {
    heatmap: HeatMap;
}

export interface InputFormState {
    height: number;
    width: number;
}

export class InputForm extends React.Component<InputFormProps, InputFormState> {
    private input: HTMLInputElement;

    constructor(props: InputFormProps) {
        super(props);

        this.state = {
            height: 100,
            width: 100
        };

        // bindings
        this.updateHeight = this.updateHeight.bind(this);
        this.updateWidth = this.updateWidth.bind(this);
        this.resetFiles = this.resetFiles.bind(this);
        this.addPoint = this.addPoint.bind(this);
        this.addPoints = this.addPoints.bind(this);
        this.generate = this.generate.bind(this);
    }

    updateHeight(event: React.ChangeEvent<number>) {
        event.preventDefault();
        this.setState({ height: event.target });
    }

    updateWidth(event: React.ChangeEvent<number>) {
        event.preventDefault();
        this.setState({ width: event.target });
    }

    resetFiles(event: React.FormEvent<any>) {
        event.preventDefault();
    }

    addPoint(event: React.FormEvent<any>) {
        event.preventDefault();
    }

    addPoints(event: React.FormEvent<any>) {
        event.preventDefault();
        alert(this.input.files[0].name);
    }

    generate(event: React.FormEvent<any>) {
        event.preventDefault();
    }

    render() {
        return (
            <div className="wrap-box">
                <form encType="multipart/form-data" className="wrap-full-box"
                      onSubmit={this.addPoints}
                      onReset={this.resetFiles}>
                    <Title text="File Input"/>
                    <div className="file-loading">
                        <input type="file" className="file" id="data_files" accept=".txt" multiple
                               ref={input => this.input = input}/>
                    </div>
                </form>
                <form encType="multipart/form-data" className="wrap-full-box wrap-inner-box"
                      onSubmit={this.addPoint}>
                    <Title text="Point"/>
                    <InputNumberBox name="Longitude" id="lng" placeholder="Enter longitude"/>
                    <InputNumberBox name="Latitude" id="lat" placeholder="Enter latitude"/>
                    <button type="submit" className="btn btn-primary">
                        Add
                    </button>
                </form>
                <form encType="multipart/form-data" className="wrap-full-box wrap-inner-box"
                      onSubmit={this.generate}>
                    <Title text="Query Region"/>
                    <InputNumberBox name="Height" id="height" min="0" onChange={this.updateHeight}/>
                    <InputNumberBox name="Width" id="width" min="0" onChange={this.updateWidth}/>
                    <button type="submit" className="btn btn-primary">
                        Generate
                    </button>
                </form>
            </div>
        );
    }
}

export default InputForm;
