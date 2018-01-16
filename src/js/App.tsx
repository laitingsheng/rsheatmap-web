import * as React from 'react';
import InputForm from './WebComponent';
import MapComponent from './MapComponent';
import HeatMap from './HeatMap';
import '../css/Map.css';

export interface AppProps {
}

export interface AppState {
    index: HeatMap;
    maxOverlap: number;
    updated: boolean;
}

export class App extends React.Component<AppProps, AppState> {
    public constructor(props: AppProps) {
        super(props);

        this.state = { index: new HeatMap(), maxOverlap: 0, updated: false };

        this.addPoint = this.addPoint.bind(this);
        this.changeRegion = this.changeRegion.bind(this);
        this.clear = this.clear.bind(this);
        this.finaliseUpdate = this.finaliseUpdate.bind(this);
    }

    shouldComponentUpdate(nextProps: any, nextState: AppState) {
        return nextState.updated;
    }

    public render() {
        return (
            <div>
                <InputForm addPoint={this.addPoint} changeRegion={this.changeRegion}
                           clear={this.clear} points={this.state.index.size}/>
                <MapComponent points={this.state.index.points} query={this.state.index.query}
                              updated={this.state.updated} maxOverlap={this.state.maxOverlap}
                              finalise={this.finaliseUpdate}/>
            </div>
        );
    }

    private addPoint(x: number, y: number): void {
        this.state.index.addPoint({ x, y });
        this.setState({ maxOverlap: this.state.index.divide(), updated: true });
    }

    private clear(): void {
        this.state.index.clear();
        this.setState({ maxOverlap: 0, updated: true });
    }

    private changeRegion(height: number, width: number): void {
        this.state.index.changeQuery(height, width);
        this.setState({ maxOverlap: this.state.index.divide(), updated: true });
    }

    private finaliseUpdate() {
        this.setState({ updated: false });
    }
}

export default App;
