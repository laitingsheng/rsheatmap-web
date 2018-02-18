import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './ts/App';
import registerServiceWorker from './registerServiceWorker';
import { BTree } from './ts/lib/BTree';

let t = new BTree<number>((l, r) => l - r), a: Array<Number> = [];
for(let i = 0; i < 10; ++i)
    t.insert(Math.floor(Math.random() * 100));
t.forEach(a.push.bind(a));
alert(a);

ReactDOM.render(<App/>, document.getElementById('root'));

registerServiceWorker();
