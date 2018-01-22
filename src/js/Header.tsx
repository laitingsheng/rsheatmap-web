import * as React from 'react';
import { UnaryFunction } from './Functions';
import { Coordinate } from './MapComponent';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../css/App.css';
import LatLngBounds = google.maps.LatLngBounds;
import SearchBox = google.maps.places.SearchBox;

export interface HeaderProps {
    addPoints: UnaryFunction<Array<Coordinate>, void>;
}

class Header extends React.Component<HeaderProps> {
    private placeSearch: HTMLInputElement;
    private searchBox: SearchBox;

    public componentDidMount() {
        this.searchBox = new SearchBox(this.placeSearch);

        this.searchBox.addListener('places_changed', () => {
            this.props.addPoints(this.searchBox.getPlaces().map(p => {
                let l = p.geometry.location;
                return new Coordinate(l.lat(), l.lng());
            }));
            this.placeSearch.placeholder = this.placeSearch.value;
            this.placeSearch.value = '';
        });
    }

    public setSearchBounds(bounds: LatLngBounds): void {
        this.searchBox.setBounds(bounds);
    }

    public shouldComponentUpdate() {
        return false;
    }

    public render() {
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
                            <a className="nav-link" href="#">Map <span
                                className="sr-only">(current)</span></a>
                        </li>
                        {false && <li className="nav-item">
                            <a className="nav-link" href="">Link</a>
                        </li>}
                        {false && <li className="nav-item">
                            <a className="nav-link disabled" href="">Disabled</a>
                        </li>}
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
}

export default Header;
