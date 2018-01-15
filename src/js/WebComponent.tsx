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

class InputNumberBox extends React.PureComponent<React.InputHTMLAttributes<any>, any> {
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

export interface BiFunction<T, U, R> {
    (l: T, r: U): R;
}

export interface InputFormProps {
    changeRegion: BiFunction<number, number, void>;
    addPoint: BiFunction<number, number, void>;
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
        this.generate = this.generate.bind(this);
    }

    resetFiles(event: React.FormEvent<any>) {
        event.preventDefault();
    }

    addPoint(event: React.FormEvent<any>) {
        event.preventDefault();
        this.props.addPoint(this.state.lat, this.state.lng);
        this.setState({ lat: undefined, lng: undefined });
    }

    addPoints(event: React.FormEvent<any>) {
        event.preventDefault();
        alert(this.input.files[0].name);
    }

    generate(event: any) {
        event.preventDefault();
        this.props.changeRegion(this.state.height, this.state.width);
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
                      onSubmit={this.addPoint}>
                    <Title text="Point"/>
                    <InputNumberBox name="Longitude" id="lng" placeholder="Enter longitude"
                                    onChange={e => this.setState({ lng: e.target.value })}/>
                    <InputNumberBox name="Latitude" id="lat" placeholder="Enter latitude"
                                    onChange={e => this.setState({ lat: e.target.value })}/>
                    <button type="submit" className="btn btn-primary">
                        Add
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
