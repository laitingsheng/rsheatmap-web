import * as React from 'react';
import InputForm from './WebComponent';
import MapComponent from './MapComponent';
import HeatMap from './HeatMap';
import '../css/Map.css';

export interface MainState {
    maxOverlap: number;
    updated: boolean;
}

export class Main extends React.Component<{}, MainState> {
    private index: HeatMap;

    public constructor(props: {}) {
        super(props);

        this.index = new HeatMap();
        this.state = { maxOverlap: 0, updated: false };

        this.addPoint = this.addPoint.bind(this);
        this.changeRegion = this.changeRegion.bind(this);
        this.clear = this.clear.bind(this);
        this.finaliseUpdate = this.finaliseUpdate.bind(this);
    }

    shouldComponentUpdate(nextProps: any, nextState: MainState) {
        return nextState.updated;
    }

    public render() {
        return (
            <div>
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
        this.setState({ maxOverlap: this.index.divide(), updated: true });
    }

    private clear(): void {
        this.index.clear();
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
