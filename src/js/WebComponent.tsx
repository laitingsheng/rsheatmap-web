import * as React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-fileinput/js/fileinput.min';
import 'bootstrap-fileinput/css/fileinput.min.css';
import '../css/Component.css';

interface TitleProps {
    text: string;
}

class Title extends React.PureComponent<TitleProps> {
    render() {
        return <p className="form-title">{this.props.text}</p>;
    }
}

class InputNumberBox extends React.PureComponent<React.InputHTMLAttributes<any>> {
    render() {
        return (
            <div className="form-group">
                <label htmlFor={this.props.id}>{this.props.name}</label>
                <input type="number" min={this.props.min} max={this.props.max} step="0.000001"
                       className="form-control" required id={this.props.id}
                       placeholder={this.props.placeholder} value={this.props.value}
                       onChange={this.props.onChange}/>
            </div>
        );
    }
}

export interface Action {
    (): void;
}

export interface BiFunction<T, U, R> {
    (l: T, r: U): R;
}

export interface InputFormProps {
    changeRegion: BiFunction<number, number, void>;
    addPoint: BiFunction<number, number, void>;
    clear: Action;
    points: number;
}

export interface InputFormState {
    height: number;
    width: number;
    lat: number | undefined;
    lng: number | undefined;
}

export class InputForm extends React.PureComponent<InputFormProps, InputFormState> {
    private input: HTMLInputElement;

    public constructor(props: InputFormProps) {
        super(props);

        this.state = {
            height: 100,
            width: 100,
            lat: undefined,
            lng: undefined
        };

        // bindings
        this.resetFiles = this.resetFiles.bind(this);
        this.addPoint = this.addPoint.bind(this);
        this.addPoints = this.addPoints.bind(this);
        this.resetPoints = this.resetPoints.bind(this);
        this.generate = this.generate.bind(this);
    }

    resetFiles(event: React.FormEvent<any>) {
        event.preventDefault();
    }

    addPoint(event: React.FormEvent<any>) {
        event.preventDefault();
        this.props.addPoint(Number(this.state.lat), Number(this.state.lng));
    }

    addPoints(event: React.FormEvent<any>) {
        event.preventDefault();
        alert(this.input.files[0].name);
    }

    resetPoints() {
        this.props.clear();
    }

    generate(event: any) {
        event.preventDefault();
        this.props.changeRegion(Number(this.state.height), Number(this.state.width));
    }

    public render() {
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
                      onSubmit={this.addPoint} onReset={this.resetPoints}>
                    <Title text={'Point (Current ' + this.props.points + ')'}/>
                    <InputNumberBox name="Longitude" id="lng" placeholder="Enter longitude"
                                    onChange={e => this.setState({ lng: e.target.value })}
                                    min="-180" max="180"/>
                    <InputNumberBox name="Latitude" id="lat" placeholder="Enter latitude"
                                    onChange={e => this.setState({ lat: e.target.value })}
                                    min="-90" max="90"/>
                    <button type="submit" className="btn btn-primary">
                        Add
                    </button>
                    <button type="reset" className="btn btn-secondary btn-reset">
                        Clear
                    </button>
                </form>
                <form encType="multipart/form-data" className="wrap-full-box wrap-inner-box"
                      onSubmit={this.generate}>
                    <Title text="Query Region"/>
                    <InputNumberBox name="Height (km)" id="height" min="0"
                                    placeholder={this.state.height.toString()}
                                    onChange={e => this.setState({ height: e.target.value })}/>
                    <InputNumberBox name="Width (km)" id="width" min="0"
                                    placeholder={this.state.width.toString()}
                                    onChange={e => this.setState({ width: e.target.value })}/>
                    <button type="submit" className="btn btn-primary">
                        Generate
                    </button>
                </form>
            </div>
        );
    }
}

export default InputForm;
