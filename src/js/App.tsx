import * as React from 'react';
import InputForm from './Component';
import MapComponent from './MapComponent';
import HeatMap from './HeatMap';
import '../css/Map.css';

const index = new HeatMap();

export class App extends React.Component {
    constructor(props: any) {
        super(props);

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
        index.points.forEach(p => alert(p.x + ' ' + p.y));
    }

    private changeRegion(height: number, width: number): void {
        index.changeQuery(height, width);
        alert(index.queryHeight + ' ' + index.queryWidth);
    }
}

export default App;
