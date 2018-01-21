import * as React from 'react';
import InputForm from './WebComponent';
import MapComponent, { Coordinate } from './MapComponent';
import '../css/Map.css';
import { UnaryFunction } from './Functions';

export interface MainProps {
    updateCount: UnaryFunction<number, void>;
}

export class Main extends React.Component<MainProps> {
    private map: MapComponent;

    public constructor(props: MainProps) {
        super(props);

        this.addPoint = this.addPoint.bind(this);
        this.changeRegion = this.changeRegion.bind(this);
        this.clear = this.clear.bind(this);
    }

    public render() {
        return (
            <div role="main" className="container">
                <InputForm addPoint={this.addPoint} changeRegion={this.changeRegion}
                           clear={this.clear}/>
                <MapComponent ref={ref => this.map = ref}/>
            </div>
        );
    }

    private addPoint(x: number, y: number): void {
        this.map.addPoint(new Coordinate(x, y));
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
