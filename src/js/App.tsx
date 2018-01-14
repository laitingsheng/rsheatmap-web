import * as React from 'react';
import InputForm from './Component';
import MapComponent from './MapComponent';
import HeatMap from './HeatMap';
import '../css/Map.css';

const heatmap = new HeatMap();

export class App extends React.Component {
    constructor(props: any) {
        super(props);
    }

    render() {
        return (
            <div>
                <InputForm heatmap={heatmap}/>
                <MapComponent heatmap={heatmap} markers={[]}/>
            </div>
        );
    }
}

export default App;
