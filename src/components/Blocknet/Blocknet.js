import React, {Component} from 'react';
import styles from './component.less';
import {resetUID} from '../inputs';
import config from 'electron-json-config';

const settings = require('electron-settings');

const Blocknet_xBridge = () => {
	return (
		<div>
			<h1>XBridge Packet Data</h1>
			<Blocknet/>
		</div>
	);
};

const Blocknet_mapStateToProps = (state) => {
	return {
		...state.Blocknet
	}
};
const Blocknet_mapDispatchToProps = (dispatch) => {
	return {
		saveSettings: (s) => {
			config.set('Blocknet.packets', s.packets);
			config.set('Blocknet.selectBox', s.selectBox);
		}
	}
};

class Blocknet extends Component {
	constructor(props) {
		super(props);
		if (settings.get('packets'))
			this.state = {
				firstTime: false,
				textInput: props.textInput,
				selectBox: props.selectBox,
				packets: settings.get('packets').packets
			};
		else
			this.state = {
				firstTime: true,
				textInput: props.textInput,
				selectBox: props.selectBox,
				packets: []
			};

		//this.originalState = this.state;
		resetUID();
		this.Stream();
	}

	save = () => {
		settings.set('packets', {
			packets: this.state.packets
		});
		this.forceUpdate();
	};

	Stream = () => {
		console.log('testing');

		if (this.state.firstTime) {
			let packet = settings.get('xPacket');
			this.setState({
				packets: JSON.stringify(packet.payload.xbridgePacket),
				firstTime: false
			});
			this.forceUpdate();
			console.log(packet.payload.xbridgePacket);
		}

		settings.watch('xPacket', (newPacket, oldPacket) => {
			this.setState({
				packets: [...this.state.packets, JSON.stringify(newPacket.payload.xbridgePacket)]
			});
			this.forceUpdate();
		})
	};

	fullTd = (e) => {
		return (
			<tbody>
			<td>{JSON.parse(e).timestamp}</td>
			<td>{JSON.parse(e).sourceCurrency}</td>
			<td>{JSON.parse(e).destCurrency}</td>
			<td>{JSON.parse(e).sourceAmt}</td>
			<td>{JSON.parse(e).destAmt}</td>
			<td>{JSON.parse(e).txid}</td>
			</tbody>
		);
	};

	render() {
		console.log('Testing');
		let packetSize = this.state.packets.length;
		console.log(this.state.packets);

		return (
			<div className='padded'>
				<div className={`box padded ${styles.box}`}>
					<table>
						<thead>
						<tr>
							<th>Timestamp</th>
							<th>SRC Currency</th>
							<th>Dest Currency</th>
							<th>Src Amt</th>
							<th>Dest Amt</th>
							<th>TXID</th>
						</tr>
						</thead>
						{packetSize > 0 ? (
							this.state.packets.map(item => (
								this.fullTd(item)
							))) : null
						}
					</table>
				</div>
				<button className="btn btn-primary pull-right" onClick={this.save}>Save</button>
			</div>
		)
	}
}

export default Blocknet_xBridge;