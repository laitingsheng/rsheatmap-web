import * as React from 'react';
import InputForm from './WebComponent';
import MapComponent from './MapComponent';
import HeatMap from './HeatMap';
import '../css/Map.css';

const index = new HeatMap();

export interface AppState {
    maxOverlap: number;
}

export class App extends React.Component<any, AppState> {
    public constructor(props: any) {
        super(props);

        this.state = { maxOverlap: 0 };

        this.addPoint = this.addPoint.bind(this);
    }

    public render() {
        return (
            <div>
                <InputForm addPoint={this.addPoint} changeRegion={this.changeRegion}/>
                <MapComponent/>
            </div>
        );
    }

    private addPoint(x: number, y: number): void {
        index.addPoint({ x, y });
    }

    private changeRegion(height: number, width: number): void {
        index.changeQuery(height, width);
        this.setState({ maxOverlap: index.divide() });
    }
}

export default App;
