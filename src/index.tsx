import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './ts/App';
import registerServiceWorker from './registerServiceWorker';
import TreeMap from './ts/lib/TreeMap';

let t = new TreeMap<number, number>((l, r) => l - r), a: Array<string> = [];
for(let i = 0; i < 10; ++i)
    t.put(i, Math.floor(Math.random() * 100));
t.forEach((v, k) => a.push(`[${k} ${v}]`));
alert(a);
let pos = Math.floor(Math.random() * 10);
alert(`${pos} ${t.get(pos)}`);
t.merge(pos, 30, (o, c) => o + c);
alert(`${pos} ${t.get(pos)}`);
for(let i = 0; i < 10; ++i) {
    t.remove(i);
    a = [];
    t.forEach((v, k) => a.push(`[${k} ${v}]`));
    alert(a);
}

ReactDOM.render(<App/>, document.getElementById('root'));

registerServiceWorker();
