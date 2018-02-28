import * as React from 'react';
import MapComponent, { Display, Params, Record, } from './MapComponent';
import '../../css/Component.css';
import '../../css/Map.css';
import LatLngBounds = google.maps.LatLngBounds;

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
    addPoint: (x: number, y: number) => void;
    clear: () => void;
    setDisplay: (display: Display) => void;
    updateCircle: (radius: number) => void;
    updateRectangle: (x: number, y: number) => void;
}

interface InputFormState {
    height: number;
    width: number;
    radius: number;
    lat: number;
    lng: number;
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
                    <p className="form-title">Point</p>
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
                    <p className="form-title">Query Region (${this.state.queryType})</p>
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
        this.props.addPoint(Number(this.state.lng), Number(this.state.lat));
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

export interface RowProps {
    prevSelected: boolean;
    record: Record;
    rowClick: () => void;
}

export interface RowState {
    colour: string;
}

export class Row extends React.Component<RowProps, RowState> {
    render() {
        const r = this.props.record;
        return (
            <tr onClick={this.props.rowClick}>
                <td className={`col-md-3 ${this.state.colour}`}>
                    {r.x.toFixed(6)}
                </td>
                <td className={`col-md-3 ${this.state.colour}`}>
                    {r.y.toFixed(6)}
                </td>
                <td className={`col-md-6 ${this.state.colour}`}>
                    {r.place && r.place.name}
                </td>
            </tr>
        );
    }

    select(selected: boolean): void {
        this.setState({ colour: selected ? 'lightgrey' : 'white' });
    }

    constructor(props: RowProps) {
        super(props);

        this.state = { colour: this.props.prevSelected ? 'lightgrey' : 'white' };
    }
}

interface HistoryProps {
    rows: Map<string, [Row, boolean, Record]>;
    remove: () => void;
}

class History extends React.Component<HistoryProps> {
    componentWillUnmount() {
        this.props.rows.forEach(v => v[0] = null);
    }

    render() {
        return (
            <form className="wrap-full-box" onSubmit={this.remove}>
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
                        Array.from(this.props.rows.entries()).map(([k, v]) => {
                            return <Row prevSelected={v[1]} record={v[2]} rowClick={() => {
                                v[1] = !v[1];
                                v[0].select(v[1]);
                                v[2].applyHighlight(v[1]);
                            }} ref={ref => v[0] = ref} key={k}/>;
                        })
                    }
                    </tbody>
                </table>
                <button type="submit" className="btn btn-primary">Remove</button>
            </form>
        );
    }

    remove(event: React.FormEvent<any>) {
        event.preventDefault();
        this.props.remove();
    }

    constructor(props: HistoryProps) {
        super(props);

        this.remove = this.remove.bind(this);
    }
}

export interface MainProps {
    resetSearch: () => void;
    updateCount: (count: number) => void;
    updateSearchBounds: (bound: LatLngBounds) => void;
}

export interface MainState {
    history: boolean;
}

export class Main extends React.Component<MainProps, MainState> {
    private history: History;
    private map: MapComponent;
    private rows: Map<string, [Row, boolean, Record]>;

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
                            <History rows={this.rows} remove={this.remove}
                                     ref={ref => this.history = ref}/>
                            :
                            <InputForm addPoint={this.addPoint} clear={this.clear}
                                       setDisplay={this.setDisplay}
                                       updateRectangle={this.updateRectangle}
                                       updateCircle={this.updateCircle}/>
                    }
                </div>
                <MapComponent resetSearch={this.props.resetSearch}
                              rows={this.rows} updateCount={this.props.updateCount}
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
        this.rows = new Map();

        this.addPoint = this.addPoint.bind(this);
        this.clear = this.clear.bind(this);
        this.remove = this.remove.bind(this);
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

    private remove(): void {
        this.map.removeSelected();
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
