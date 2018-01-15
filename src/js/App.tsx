import * as React from 'react';
import InputForm from './WebComponent';
import MapComponent from './MapComponent';
import HeatMap from './HeatMap';
import '../css/Map.css';

export interface AppProps {
}

const index = new HeatMap();

export interface AppState {
    maxOverlap: number;
    updated: boolean;
}

export class App extends React.Component<AppProps, AppState> {
    public constructor(props: AppProps) {
        super(props);

        this.state = { maxOverlap: 0, updated: false };

        this.addPoint = this.addPoint.bind(this);
        this.changeRegion = this.changeRegion.bind(this);
        this.finaliseUpdate = this.finaliseUpdate.bind(this);
    }

    shouldComponentUpdate(nextProps: any, nextState: AppState) {
        return nextState.updated;
    }

    public render() {
        return (
            <div>
                <InputForm addPoint={this.addPoint} changeRegion={this.changeRegion}/>
                <MapComponent points={index.points} updated={this.state.updated}
                              maxOverlap={this.state.maxOverlap} finalise={this.finaliseUpdate}/>
            </div>
        );
    }

    private addPoint(x: number, y: number): void {
        index.addPoint({ x, y });
        this.setState({ updated: true });
    }

    private changeRegion(height: number, width: number): void {
        index.changeQuery(height, width);
        this.setState({ maxOverlap: index.divide(), updated: true });
    }

    private finaliseUpdate() {
        this.setState({ updated: false });
    }
}

export default App;
