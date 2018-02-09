import * as React from 'react';
import { Action, Function } from './DataStructure/Util';
import { Params } from './MapComponent';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../css/App.css';
import LatLngBounds = google.maps.LatLngBounds;
import SearchBox = google.maps.places.SearchBox;

export interface HeaderProps {
    addPoints: Function<Array<Params>, void>;
    history: Action<void>;
    input: Action<void>;
}

class Header extends React.Component<HeaderProps> {
    private placeSearch: HTMLInputElement;
    private searchBox: SearchBox;
    private h: HTMLLIElement;
    private i: HTMLLIElement;

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

    // attach to bound_changed event and obtain the current bound of the map
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
                        <li className="nav-item active" ref={ref => this.h = ref}>
                            <a className="nav-link" href="" onClick={this.input}>Map</a>
                        </li>
                        <li className="nav-item" ref={ref => this.i = ref}>
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

    constructor(props: HeaderProps) {
        super(props);

        this.history = this.history.bind(this);
        this.input = this.input.bind(this);
    }

    // toggle to <History>
    private history(event: React.FormEvent<any>): void {
        event.preventDefault();
        this.h.classList.remove('active');
        this.i.classList.add('active');
        this.props.history();
    }

    // toggle to <Input>
    private input(event: React.FormEvent<any>): void {
        event.preventDefault();
        this.i.classList.remove('active');
        this.h.classList.add('active');
        this.props.input();
    }
}

export default Header;
