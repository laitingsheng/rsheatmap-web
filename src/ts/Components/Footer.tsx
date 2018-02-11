import * as React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../css/App.css';

export interface FooterState {
    date: Date;
}

export class Footer extends React.PureComponent<{}, FooterState> {
    private timerID: NodeJS.Timer;
    private count: number;

    // simulate clock tick
    componentDidMount() {
        this.timerID = setInterval(
            this.update,
            1000
        );
    }

    componentWillUnmount() {
        clearInterval(this.timerID);
    }

    render() {
        return (
            <footer className="footer">
                <div className="container">
                    <span className="text-muted">
                    Current time is {this.state.date.toLocaleTimeString()}.
                    Currently {this.count} points inserted.
                    </span>
                </div>
            </footer>
        );
    }

    updateCount(count: number) {
        this.count = count;

        // immediate update
        this.forceUpdate();
    }

    constructor(props: {}) {
        super(props);

        this.count = 0;
        this.state = { date: new Date() };

        this.update = this.update.bind(this);
    }

    private update() {
        this.setState({ date: new Date() });
    }
}

export default Footer;
