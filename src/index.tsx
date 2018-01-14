import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './js/App';
import Header from './js/Header';
import Footer from './js/Footer';
import registerServiceWorker from './registerServiceWorker';
import HeatMap from './js/HeatMap';

const index = new HeatMap();
ReactDOM.render(<Header/>, document.getElementById('header'));
ReactDOM.render(<App index={index}/>, document.getElementById('root'));
ReactDOM.render(<Footer/>, document.getElementById('footer'));

registerServiceWorker();
