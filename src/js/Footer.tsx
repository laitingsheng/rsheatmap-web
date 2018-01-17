import * as React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../css/App.css';

export interface FooterProps {
    count: number;
}

export interface FooterState {
    date: Date;
}

export class Footer extends React.PureComponent<FooterProps, FooterState> {
    private timerID: NodeJS.Timer;

    public constructor(props: FooterProps) {
        super(props);
        this.state = { date: new Date() };

        this.update = this.update.bind(this);
    }

    public componentDidMount() {
        this.timerID = setInterval(
            this.update,
            1000
        );
    }

    public componentWillUnmount() {
        clearInterval(this.timerID);
    }

    public render() {
        return (
            <footer className="footer">
                <div className="container">
                    <span className="text-muted">
                    App created by Tinson.
                    Current time is {this.state.date.toLocaleTimeString()}.
                    Currently {this.props.count} points entered.
                    </span>
                </div>
            </footer>
        );
    }

    private update() {
        this.setState({ date: new Date() });
    }
}

export default Footer;
