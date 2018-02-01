import * as React from 'react';
import { Action, BiFunction, UnaryFunction } from './Functions';
import MapComponent, { Combo, Record } from './MapComponent';
import '../css/Component.css';
import '../css/Map.css';
import LatLngBounds = google.maps.LatLngBounds;

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

interface InputFormProps {
    changeRegion: BiFunction<number, number, void>;
    addPoint: BiFunction<number, number, void>;
    clear: Action<void>;
}

interface InputFormState {
    height: number;
    width: number;
    lat: number | undefined;
    lng: number | undefined;
}

class InputForm extends React.PureComponent<InputFormProps, InputFormState> {
    constructor(props: InputFormProps) {
        super(props);

        this.state = {
            height: 10,
            width: 10,
            lat: undefined,
            lng: undefined
        };

        // bindings
        this.addPoint = this.addPoint.bind(this);
        this.resetPoints = this.resetPoints.bind(this);
        this.generate = this.generate.bind(this);
    }

    render() {
        return (
            <>
                <form className="wrap-full-box wrap-inner-box" onSubmit={this.addPoint}
                      onReset={this.resetPoints}>
                    <Title text="Point"/>
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
                <form className="wrap-full-box wrap-inner-box" onSubmit={this.generate}>
                    <Title text="Query Region"/>
                    <InputNumberBox name="Height (km)" id="height" min="0"
                                    placeholder={this.state.height.toString()}
                                    onChange={e => this.setState({ height: e.target.value })}/>
                    <InputNumberBox name="Width (km)" id="width" min="0"
                                    placeholder={this.state.width.toString()}
                                    onChange={e => this.setState({ width: e.target.value })}/>
                    <button type="submit" className="btn btn-primary">
                        Update
                    </button>
                </form>
            </>
        );
    }

    private addPoint(event: React.FormEvent<any>) {
        event.preventDefault();
        this.props.addPoint(Number(this.state.lat), Number(this.state.lng));
    }

    private resetPoints() {
        this.props.clear();
    }

    private generate(event: any) {
        event.preventDefault();
        this.props.changeRegion(Number(this.state.height), Number(this.state.width));
    }
}

interface HistoryProps {
    generate: Action<Array<Record>>;
    remove: BiFunction<number, number, void>;
}

class History extends React.Component<HistoryProps> {
    shouldComponentUpdate() {
        return false;
    }

    render() {
        return (
            <form className="wrap-full-box">
                <ul className="list-group"/>
            </form>
        );
    }
}

export interface MainProps {
    resetSearch: Action<void>;
    updateCount: UnaryFunction<number, void>;
    updateSearchBounds: UnaryFunction<LatLngBounds, void>;
}

export interface MainState {
    history: boolean;
}

export class Main extends React.Component<MainProps, MainState> {
    private history: History;
    private map: MapComponent;

    constructor(props: MainProps) {
        super(props);

        this.state = { history: false };

        this.addPoint = this.addPoint.bind(this);
        this.changeRegion = this.changeRegion.bind(this);
        this.clear = this.clear.bind(this);
        this.generate = this.generate.bind(this);
        this.removePoint = this.removePoint.bind(this);
    }

    shouldComponentUpdate() {
        return false;
    }

    render() {
        return (
            <div role="main" className="container">
                <div className="wrap-box">
                    {
                        this.state.history ?
                            <History generate={this.generate} remove={this.removePoint}
                                     ref={ref => this.history = ref}/>
                            :
                            <InputForm addPoint={this.addPoint} changeRegion={this.changeRegion}
                                       clear={this.clear}/>
                    }
                </div>
                <MapComponent resetSearch={this.props.resetSearch}
                              updateSearchBounds={this.props.updateSearchBounds}
                              ref={ref => this.map = ref}/>
            </div>
        );
    }

    addPoints(points: Array<Combo>): void {
        this.map.addPoints(points);
        this.props.updateCount(this.map.size);
    }

    hist(): void {
        this.setState({ history: true });
        this.forceUpdate();
    }

    input(): void {
        this.setState({ history: false });
        this.forceUpdate();
    }

    private addPoint(x: number, y: number): void {
        this.map.addPoint(x, y);
        this.props.updateCount(this.map.size);
    }

    private clear(): void {
        this.map.clear();
        this.props.updateCount(0);
    }

    private changeRegion(height: number, width: number): void {
        this.map.changeQuery(height, width);
    }

    private generate(): Array<Record> {
        return this.map.generateRecords();
    }

    private removePoint(x: number, y: number) {
        this.map.remove(x, y);
    }
}

export default Main;
