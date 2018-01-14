import * as React from 'react';
import InputForm from './Component';
import MapComponent from './MapComponent';
import HeatMap from './HeatMap';
import '../css/Map.css';

export interface AppProps {
    index: HeatMap;
}

export class App extends React.Component<AppProps> {
    constructor(props: AppProps) {
        super(props);

        this.addPoint = this.addPoint.bind(this);
    }

    public render() {
        return (
            <div>
                <InputForm index={this.props.index} addPoint={this.addPoint}
                           changeRegion={this.changeRegion}/>
                <MapComponent markers={[]}/>
            </div>
        );
    }

    private addPoint(x: number, y: number): void {
        this.props.index.addPoint({ x, y });
    }

    private changeRegion(height: number, width: number): void {
        this.props.index.changeQuery(height, width);
    }
}

export default App;
