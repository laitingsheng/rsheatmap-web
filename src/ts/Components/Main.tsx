import * as React from 'react';
import { Action, BiFunction, Function } from '../Util/Util';
import MapComponent, { Coordinate, Display, Params, Record } from './MapComponent';
import '../../css/Component.css';
import '../../css/Map.css';
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
    private input: HTMLInputElement;

    get value(): string {
        return this.input.value;
    }

    set value(text: string) {
        this.input.value = text;
    }

    render() {
        return (
            <div className="form-group">
                <label htmlFor={this.props.id}>{this.props.name}</label>
                <input type="number" min={this.props.min} max={this.props.max}
                       step={this.props.step} className="form-control" required id={this.props.id}
                       placeholder={this.props.placeholder} value={this.props.value}
                       onChange={this.props.onChange} ref={ref => this.input = ref}
                       disabled={this.props.disabled}/>
            </div>
        );
    }
}

interface InputFormProps {
    addPoint: BiFunction<number, number, void>;
    clear: Action<void>;
    setDisplay: Function<Display, void>;
    updateCircle: Function<number, void>;
    updateRectangle: BiFunction<number, number, void>;
}

interface InputFormState {
    height: number;
    width: number;
    radius: number;
    lat: number | undefined;
    lng: number | undefined;
    queryType: Display;
}

class InputForm extends React.PureComponent<InputFormProps, InputFormState> {
    private inputLng: InputNumberBox;
    private inputLat: InputNumberBox;

    render() {
        return (
            <>
                <form className="wrap-full-box wrap-inner-box" onSubmit={this.addPoint}
                      onReset={this.resetPoints}>
                    <Title text="Point"/>
                    <InputNumberBox name="Longitude" id="lng" placeholder="Enter longitude"
                                    onChange={e => this.setState({ lng: e.target.value })}
                                    min="-180" max="180" step="0.000001"
                                    ref={ref => this.inputLng = ref}/>
                    <InputNumberBox name="Latitude" id="lat" placeholder="Enter latitude"
                                    onChange={e => this.setState({ lat: e.target.value })}
                                    min="-90" max="90" step="0.000001"
                                    ref={ref => this.inputLat = ref}/>
                    <button type="submit" className="btn btn-primary">
                        Add
                    </button>
                    <button type="reset" className="btn btn-secondary btn-reset">
                        Clear
                    </button>
                </form>
                <form className="wrap-full-box wrap-inner-box" onSubmit={this.change}
                      onReset={this.switch}>
                    <Title text={`Query Region (${this.state.queryType})`}/>
                    {
                        this.state.queryType === 'Rectangle' ?
                            <>
                                <InputNumberBox name="Height (km)" id="height" min="0" step="0.1"
                                                value={this.state.height}
                                                onChange={e => this.setState(
                                                    { height: e.target.value })}/>
                                <InputNumberBox name="Width (km)" id="width" min="0" step="0.1"
                                                value={this.state.width}
                                                onChange={e => this.setState(
                                                    { width: e.target.value })}/>
                            </>
                            :
                            <>
                                <InputNumberBox name="Radius (km)" id="radius" min="0" step="0.1"
                                                value={this.state.radius}
                                                onChange={e => this.setState(
                                                    { radius: e.target.value })}/>
                                <InputNumberBox name="(Not in use)" value="" id="disabled"
                                                disabled/>
                            </>
                    }
                    <button type="submit" className="btn btn-primary">
                        Update
                    </button>
                    <button type="reset" className="btn btn-secondary btn-reset">
                        Switch
                    </button>
                </form>
            </>
        );
    }

    constructor(props: InputFormProps) {
        super(props);

        this.state = {
            height: 10,
            width: 10,
            radius: 10,
            lat: undefined,
            lng: undefined,
            queryType: 'Rectangle'
        };

        this.addPoint = this.addPoint.bind(this);
        this.change = this.change.bind(this);
        this.resetPoints = this.resetPoints.bind(this);
        this.switch = this.switch.bind(this);
    }

    private addPoint(event: React.FormEvent<any>) {
        event.preventDefault();
        this.props.addPoint(Number(this.state.lat), Number(this.state.lng));
        this.inputLng.value = this.inputLat.value = '';
    }

    private change(event: React.FormEvent<any>) {
        event.preventDefault();
        if(this.state.queryType === 'Rectangle')
            this.props.updateRectangle(Number(this.state.height), Number(this.state.width));
        else
            this.props.updateCircle(Number(this.state.radius));
    }

    private resetPoints() {
        this.props.clear();
    }

    private switch(): void {
        if(this.state.queryType === 'Rectangle') {
            this.setState({ queryType: 'Circle' });
            this.props.setDisplay('Circle');
        } else {
            this.setState({ queryType: 'Rectangle' });
            this.props.setDisplay('Rectangle');
        }
    }
}

interface HistoryProps {
    generate: Action<Array<Record>>;
    remove: Function<Array<Coordinate>, void>;
}

class Row {
    cellRefs: Array<HTMLTableCellElement>;
    selected: boolean;

    onClick(): void {
        this.selected = !this.selected;
        this.cellRefs.forEach(c => c.bgColor = this.selected ? 'lightgrey' : 'white');
    }

    constructor(public candidate: Record) {
        this.cellRefs = null;
        this.selected = false;

        this.onClick = this.onClick.bind(this);
    }
}

class History extends React.Component<HistoryProps> {
    private rows: Map<string, Row>;

    render() {
        return (
            <form className="wrap-full-box" onSubmit={this.removePoints}>
                <table className="table table-history">
                    <thead>
                    <tr>
                        <th className="col-md-3">x</th>
                        <th className="col-md-3">y</th>
                        <th className="col-md-6">Place Name</th>
                    </tr>
                    </thead>
                    <tbody>
                    {
                        this.props.generate().map(r => {
                            let row = this.rows.get(r.toKey());
                            if(!row) {
                                row = new Row(r);
                                row.cellRefs = new Array(3);
                                this.rows.set(r.toKey(), row);
                            }
                            return (
                                <tr onClick={row.onClick} key={r.toKey()}>
                                    <td className="col-md-3"
                                        ref={ref => row.cellRefs[0] = ref}>
                                        {r.x.toFixed(6)}
                                    </td>
                                    <td className="col-md-3"
                                        ref={ref => row.cellRefs[1] = ref}>
                                        {r.y.toFixed(6)}
                                    </td>
                                    <td className="col-md-6"
                                        ref={ref => row.cellRefs[2] = ref}>
                                        {r.place && r.place.name}
                                    </td>
                                </tr>
                            );
                        })
                    }
                    </tbody>
                </table>
                <button type="submit" className="btn btn-primary">Remove</button>
            </form>
        );
    }

    // update controlled manually
    shouldComponentUpdate() {
        return false;
    }

    constructor(props: HistoryProps) {
        super(props);

        this.rows = new Map();

        this.removePoints = this.removePoints.bind(this);
    }

    private removePoints(event: React.FormEvent<any>) {
        event.preventDefault();

        const candidates = [];
        this.rows.forEach(v => v.selected && candidates.push(v.candidate));
        this.props.remove(candidates);

        this.rows = new Map();
    }
}

export interface MainProps {
    resetSearch: Action<void>;
    updateCount: Function<number, void>;
    updateSearchBounds: Function<LatLngBounds, void>;
}

export interface MainState {
    history: boolean;
}

export class Main extends React.Component<MainProps, MainState> {
    private history: History;
    private map: MapComponent;

    addPoints(points: Array<Params>): void {
        this.map.addPoints(points);
    }

    // toggle to <History>
    hist(): void {
        this.setState({ history: true });
        this.forceUpdate();
    }

    // toggle to <Input>
    input(): void {
        this.setState({ history: false });
        this.forceUpdate();
    }

    render() {
        return (
            <div role="main" className="container">
                <div className="wrap-box">
                    {
                        this.state.history ?
                            <History generate={this.generate} remove={this.removePoints}
                                     ref={ref => this.history = ref}/>
                            :
                            <InputForm addPoint={this.addPoint} clear={this.clear}
                                       setDisplay={this.setDisplay}
                                       updateRectangle={this.updateRectangle}
                                       updateCircle={this.updateCircle}/>
                    }
                </div>
                <MapComponent resetSearch={this.props.resetSearch}
                              updateCount={this.props.updateCount}
                              updateHistory={this.updateHistory}
                              updateSearchBounds={this.props.updateSearchBounds}
                              ref={ref => this.map = ref}/>
            </div>
        );
    }

    // update controlled manually
    shouldComponentUpdate() {
        return false;
    }

    constructor(props: MainProps) {
        super(props);

        this.state = { history: false };

        this.addPoint = this.addPoint.bind(this);
        this.clear = this.clear.bind(this);
        this.generate = this.generate.bind(this);
        this.removePoints = this.removePoints.bind(this);
        this.setDisplay = this.setDisplay.bind(this);
        this.updateCircle = this.updateCircle.bind(this);
        this.updateHistory = this.updateHistory.bind(this);
        this.updateRectangle = this.updateRectangle.bind(this);
    }

    private addPoint(x: number, y: number): void {
        this.map.addPoint(x, y);
    }

    private clear(): void {
        this.map.clear();
    }

    private updateCircle(radius: number): void {
        this.map.changeQuery({ radius });
    }

    private updateRectangle(height: number, width: number): void {
        this.map.changeQuery({ height, width });
    }

    private generate(): Array<Record> {
        return this.map.generateRecords();
    }

    private removePoints(points: Array<Coordinate>) {
        this.map.removePoints(points);
    }

    private setDisplay(display: Display): void {
        this.map.setDisplay(display);
    }

    // handler to <MapComponent> when add/remove a point
    private updateHistory(): void {
        if(this.history)
            this.history.forceUpdate();
    }
}

export default Main;
