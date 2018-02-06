import * as React from 'react';
import Header from './Header';
import Main from './Main';
import Footer from './Footer';
import { Params } from './MapComponent';
import LatLngBounds = google.maps.LatLngBounds;

export class App extends React.PureComponent<{}> {
    private header: Header;
    private main: Main;
    private footer: Footer;

    constructor(props: {}) {
        super(props);

        this.state = { count: 0, bounds: null };

        this.addPoints = this.addPoints.bind(this);
        this.history = this.history.bind(this);
        this.input = this.input.bind(this);
        this.resetSearch = this.resetSearch.bind(this);
        this.updateCount = this.updateCount.bind(this);
        this.updateSearchBounds = this.updateSearchBounds.bind(this);
    }

    render() {
        return (
            <>
                <Header addPoints={this.addPoints} history={this.history} input={this.input}
                        ref={ref => this.header = ref}/>
                <Main updateCount={this.updateCount} updateSearchBounds={this.updateSearchBounds}
                      resetSearch={this.resetSearch} ref={ref => this.main = ref}/>
                <Footer ref={ref => this.footer = ref}/>
            </>
        );
    }

    private addPoints(points: Array<Params>): void {
        this.main.addPoints(points);
    }

    private history(): void {
        this.main.hist();
    }

    private input(): void {
        this.main.input();
    }

    private resetSearch(): void {
        this.header.resetSearch();
    }

    private updateCount(count: number): void {
        this.footer.updateCount(count);
    }

    private updateSearchBounds(bounds: LatLngBounds): void {
        this.header.setSearchBounds(bounds);
    }
}

export default App;
