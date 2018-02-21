import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './ts/App';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<App/>, document.getElementById('root'));

registerServiceWorker();
