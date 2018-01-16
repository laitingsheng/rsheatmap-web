import * as React from 'react';
import Header from './Header';
import Main from './Main';

export class App extends React.PureComponent {
    public render() {
        return <div><Header/><Main/></div>;
    }
}

export default App;
