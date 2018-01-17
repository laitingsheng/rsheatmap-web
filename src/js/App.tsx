import * as React from 'react';
import Header from './Header';
import Main from './Main';
import Footer from './Footer';

export interface AppState {
    count: number;
}

export class App extends React.PureComponent<{}, AppState> {
    public constructor(props: {}) {
        super(props);

        this.state = { count: 0 };

        this.updateCount = this.updateCount.bind(this);
    }

    public render() {
        return (
            <>
                <Header/>
                <Main updateCount={this.updateCount}/>
                <Footer count={this.state.count}/>
            </>
        );
    }

    private updateCount(count: number): void {
        this.setState({ count });
    }
}

export default App;
