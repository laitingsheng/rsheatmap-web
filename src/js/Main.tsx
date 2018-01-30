import * as React from 'react';
import MapComponent, { Combo, Record } from './MapComponent';
import '../css/Map.css';
import { Action, BiFunction, UnaryFunction } from './Functions';
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
    public constructor(props: InputFormProps) {
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

    addPoint(event: React.FormEvent<any>) {
        event.preventDefault();
        this.props.addPoint(Number(this.state.lat), Number(this.state.lng));
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
                <form className="wrap-full-box wrap-inner-box"
                      onSubmit={this.addPoint} onReset={this.resetPoints}>
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
            </div>
        );
    }
}

interface HistoryProps {
    records: Array<Record>;
}

class History extends React.PureComponent<HistoryProps> {
    public render() {
        return null;
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
    private map: MapComponent;

    public constructor(props: MainProps) {
        super(props);

        this.state = { history: false };

        this.addPoint = this.addPoint.bind(this);
        this.changeRegion = this.changeRegion.bind(this);
        this.clear = this.clear.bind(this);
    }

    public shouldComponentUpdate() {
        return false;
    }

    public render() {
        return (
            <div role="main" className="container">
                {
                    this.state.history ? <History records={}/> :
                        <InputForm addPoint={this.addPoint} changeRegion={this.changeRegion}
                                   clear={this.clear}/>
                }
                <MapComponent updateSearchBounds={this.props.updateSearchBounds}
                              resetSearch={this.props.resetSearch} ref={ref => this.map = ref}/>
            </div>
        );
    }

    public addPoints(points: Array<Combo>): void {
        this.map.addPoints(points);
        this.props.updateCount(this.map.size);
    }

    public history(): void {
        this.setState({ history: true });
    }

    public input(): void {
        this.setState({ history: true });
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
}

export default Main;
