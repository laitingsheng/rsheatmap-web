import * as React from 'react';
import { Action, UnaryFunction } from './Functions';
import { Combo } from './MapComponent';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../css/App.css';
import LatLngBounds = google.maps.LatLngBounds;
import SearchBox = google.maps.places.SearchBox;

export interface HeaderProps {
    addPoints: UnaryFunction<Array<Combo>, void>;
    history: Action<void>;
    input: Action<void>;
}

class Header extends React.Component<HeaderProps> {
    private placeSearch: HTMLInputElement;
    private searchBox: SearchBox;

    constructor(props: HeaderProps) {
        super(props);

        this.history = this.history.bind(this);
        this.input = this.input.bind(this);
    }

    componentDidMount() {
        this.searchBox = new SearchBox(this.placeSearch);

        this.searchBox.addListener('places_changed', () => {
            this.props.addPoints(this.searchBox.getPlaces().map(p => {
                let l = p.geometry.location;
                return { x: l.lat(), y: l.lng(), place: p };
            }));
            this.placeSearch.placeholder = this.placeSearch.value;
            this.placeSearch.value = '';
        });
    }

    setSearchBounds(bounds: LatLngBounds): void {
        this.searchBox.setBounds(bounds);
    }

    shouldComponentUpdate() {
        return false;
    }

    render() {
        return (
            <nav className="navbar navbar-expand-md navbar-dark fixed-top bg-dark">
                <a className="navbar-brand" href="">Range Sum Heat Map</a>
                <button className="navbar-toggler" type="button" data-toggle="collapse"
                        data-target="#navbarCollapse" aria-controls="navbarCollapse"
                        aria-expanded="false"
                        aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"/>
                </button>
                <div className="collapse navbar-collapse" id="navbarCollapse">
                    <ul className="navbar-nav mr-auto">
                        <li className="nav-item active">
                            <a className="nav-link" href="" onClick={this.input}>Map</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link" href="" onClick={this.history}>History</a>
                        </li>
                    </ul>
                    <form className="form-inline mt-2 mt-md-0" onSubmit={e => e.preventDefault()}>
                        <input className="form-control mr-sm-2" type="text"
                               placeholder="Search Place" aria-label="Search Place"
                               ref={ref => this.placeSearch = ref}/>
                    </form>
                </div>
            </nav>
        );
    }

    resetSearch(): void {
        this.placeSearch.placeholder = 'Search Place';
    }

    private history(event: React.FormEvent<any>): void {
        event.preventDefault();
        this.props.history();
    }

    private input(event: React.FormEvent<any>): void {
        event.preventDefault();
        this.props.input();
    }
}

export default Header;
