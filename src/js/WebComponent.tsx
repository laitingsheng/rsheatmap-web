import * as React from 'react';
import { Button, ControlLabel, Form, FormControl, FormGroup } from 'react-bootstrap';
import { Action, BiFunction } from './Functions';
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
            <FormGroup controlId={this.props.id}>
                <ControlLabel>{this.props.name}</ControlLabel>
                <FormControl type="number" min={this.props.min} max={this.props.max}
                             step="0.000001" className="form-control" required id={this.props.id}
                             placeholder={this.props.placeholder} value={this.props.value}
                             onChange={this.props.onChange}/>
            </FormGroup>
        );
    }
}

export interface InputFormProps {
    changeRegion: BiFunction<number, number, void>;
    addPoint: BiFunction<number, number, void>;
    clear: Action<void>;
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
                {false && <form encType="multipart/form-data" className="wrap-full-box"
                                onSubmit={this.addPoints}
                                onReset={this.resetFiles}>
                    <Title text="File Input"/>
                    <div className="file-loading">
                        <input type="file" className="file" id="data_files" accept=".txt" multiple
                               ref={input => this.input = input}/>
                    </div>
                </form>}
                <Form horizontal className="wrap-full-box wrap-inner-box"
                      onSubmit={this.addPoint} onReset={this.resetPoints}>
                    <Title text="Point"/>
                    <InputNumberBox name="Longitude" id="lng" placeholder="Enter longitude"
                                    onChange={e => this.setState({ lng: e.target.value })}
                                    min="-180" max="180"/>
                    <InputNumberBox name="Latitude" id="lat" placeholder="Enter latitude"
                                    onChange={e => this.setState({ lat: e.target.value })}
                                    min="-90" max="90"/>
                    <Button bsStyle="primary" type="submit">
                        Add
                    </Button>
                    <Button bsStyle="secondary" type="reset" className="btn-reset">
                        Clear
                    </Button>
                </Form>
                <Form horizontal className="wrap-full-box wrap-inner-box" onSubmit={this.generate}>
                    <Title text="Query Region"/>
                    <InputNumberBox name="Height (km)" id="height" min="0"
                                    placeholder={this.state.height.toString()}
                                    onChange={e => this.setState({ height: e.target.value })}/>
                    <InputNumberBox name="Width (km)" id="width" min="0"
                                    placeholder={this.state.width.toString()}
                                    onChange={e => this.setState({ width: e.target.value })}/>
                    <Button bsStyle="primary" type="submit">
                        Generate
                    </Button>
                </Form>
            </div>
        );
    }
}

export default InputForm;
