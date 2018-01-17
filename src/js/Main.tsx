import * as React from 'react';
import InputForm from './WebComponent';
import MapComponent from './MapComponent';
import HeatMap from './HeatMap';
import '../css/Map.css';
import { UnaryFunction } from './Functions';

export interface MainProps {
    updateCount: UnaryFunction<number, void>;
}

export interface MainState {
    maxOverlap: number;
    updated: boolean;
}

export class Main extends React.Component<MainProps, MainState> {
    private index: HeatMap;

    public constructor(props: MainProps) {
        super(props);

        this.index = new HeatMap();
        this.state = { maxOverlap: 0, updated: false };

        this.addPoint = this.addPoint.bind(this);
        this.changeRegion = this.changeRegion.bind(this);
        this.clear = this.clear.bind(this);
        this.finaliseUpdate = this.finaliseUpdate.bind(this);
    }

    shouldComponentUpdate(nextProps: {}, nextState: MainState) {
        return nextState.updated;
    }

    public render() {
        return (
            <div role="main" className="container">
                <InputForm addPoint={this.addPoint} changeRegion={this.changeRegion}
                           clear={this.clear} points={this.index.size}/>
                <MapComponent points={this.index.points} query={this.index.query}
                              updated={this.state.updated} maxOverlap={this.state.maxOverlap}
                              finalise={this.finaliseUpdate}/>
            </div>
        );
    }

    private addPoint(x: number, y: number): void {
        this.index.addPoint({ x, y });
        this.props.updateCount(this.index.size);
        this.setState({ maxOverlap: this.index.divide(), updated: true });
    }

    private clear(): void {
        this.index.clear();
        this.props.updateCount(0);
        this.setState({ maxOverlap: 0, updated: true });
    }

    private changeRegion(height: number, width: number): void {
        this.index.changeQuery(height, width);
        this.setState({ maxOverlap: this.index.divide(), updated: true });
    }

    private finaliseUpdate() {
        this.setState({ updated: false });
    }
}

export default Main;
