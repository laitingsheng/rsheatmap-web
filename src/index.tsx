import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './js/App';
import Footer from './js/Footer';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<App/>, document.getElementById('root'));
ReactDOM.render(<Footer/>, document.getElementById('footer'));

registerServiceWorker();
