const dns = require('dns');
const net = require('net');
const coinParams = require('../config/coins.js');
const network = require('./P2P');
const bufferReverse = require('buffer-reverse');

'use strict';

class Coin {
	constructor(network) {
		this.network = network
	}

	init() {
		console.log('test');
		console.log('init: ' + this.network.name + ' api');
		this.createConnectionToPeer()
	}

	// writedata for future use
	createConnectionToPeer() {
		var decoder = network.createDecodeStream(),
			self = this;
		decoder.on('data', function (message) {
			//console.log(message)
			if (message.payload) {
				var buf = Buffer.from(JSON.stringify(message.payload));
				var temp = JSON.parse(buf.toString('utf8'));
				//console.log(temp)

				/*if (message.command == 'xbridge') {
					console.log(temp);
					console.log((Buffer.from(bufferReverse(new Buffer(temp.header.version.data, 'hex')))).toString('hex'));
                    console.log((Buffer.from(bufferReverse(new Buffer(temp.header.commandSize.data, 'hex')))).toString('hex'));
                    console.log((Buffer.from(bufferReverse(new Buffer(temp.header.oldSizeField.data, 'hex')))).toString('hex'));
                    console.log((Buffer.from(bufferReverse(new Buffer(temp.header.sizeField.data, 'hex')))).toString('hex'));
                    console.log((Buffer.from(bufferReverse(new Buffer(temp.header.pubkeyField.data, 'hex')))).toString('hex'));
                    console.log((Buffer.from(bufferReverse(new Buffer(temp.header.signatureField.data, 'hex')))).toString('hex'));

                    console.log((Buffer.from(bufferReverse(new Buffer(temp.hubAddr.data, 'hex')))).toString('hex'));
                    console.log((Buffer.from(bufferReverse(new Buffer(temp.id.data, 'hex')))).toString('hex'));
                    console.log((Buffer.from(bufferReverse(new Buffer(temp.sourceAddr.data, 'hex')))).toString('hex'));
                    console.log((Buffer.from(bufferReverse(new Buffer(temp.sourceCurrency.data, 'hex')))).toString('hex'));
                    console.log((Buffer.from(bufferReverse(new Buffer(temp.sourceAmt.data, 'hex')))).toString('hex'));

                    console.log((Buffer.from(bufferReverse(new Buffer(temp.destAddr.data, 'hex')))).toString('hex'));
                    console.log((Buffer.from(bufferReverse(new Buffer(temp.destCurrency.data, 'hex')))).toString('hex'));
                    console.log((Buffer.from(bufferReverse(new Buffer(temp.destAmt.data, 'hex')))).toString('hex'));
				}*/

				if (typeof temp[0] !== 'undefined') {
					if (temp.length > 0) {
						for (var i = 0; i < temp.length; i++) {
							if (temp[i].type === 2) {
								let bufferOriginal = Buffer.from(bufferReverse(new Buffer(temp[i].hash.data, 'hex')));
								console.log(bufferOriginal.toString('hex'))
							} else if (temp[i].type === 2) {
								let bufferOriginal = Buffer.from(bufferReverse(new Buffer(temp[i].hash.data, 'hex')));
								console.log(bufferOriginal.toString('hex'))
							}
						}

					}
				}
			}
		});

		let encoder = network.createEncodeStream();

		let socket = net.connect(self.network.defaultPort, self.network.dnsSeeds[0], function () {
			socket.pipe(decoder);
			encoder.pipe(socket);

			encoder.write(self.versionPayload());
			encoder.write(self.getBlocksPayload());
			encoder.write(self.getData());
		});
	}

	getBlocksPayload() {
		let arr = [
			'c4b7aeaa959aad9a25b10c0615f4332d5190f842edafd4ead514f184279b22d7',
			'a2be09fa9e8c9e1a47287451a27ed4c899da4bcf1ebd101fc066a2eb467b7460',
			'b81a3d024bfcc1cff00bde22e019e39d81b14b6c1d59ab4e0af5e307868e2ee1'
		];

		let x = [];
		for (let i = 0; i < arr.length; i++) {
			x[i] = Buffer.from(arr[i], 'hex')
		}

		return {
			magic: this.network.magic,
			command: 'getblocks',
			payload: {
				version: this.network.protocolVersion,
				locator: [
					x[2],
					x[1],
					x[0]
				],
				hashStop: new Buffer(32).fill(0)
			}
		}
	}

	getData() {
		return {
			magic: this.network.magic,
			command: 'getdata',
			payload: [{
				type: 2,
				hash: Buffer.from('7065d1f3ad69567fdd7f095e2e6e4f5d5ce7b4b27b0331f29497ec25f67db99f', 'hex')
			}]
		}
	}

	versionPayload() {
		return {
			magic: this.network.magic,
			command: 'version',
			payload: {
				version: this.network.protocolVersion,
				services: Buffer(8).fill(0),
				timestamp: Math.round(Date.now() / 1000),
				receiverAddress: {
					services: Buffer('0100000000000000', 'hex'),
					address: '0.0.0.0',
					port: 8333
				},
				senderAddress: {
					services: Buffer(8).fill(0),
					address: '0.0.0.0',
					port: 8333
				},
				nonce: Buffer(8).fill(123),
				userAgent: 'Node P2P',
				startHeight: 0,
				relay: true
			}
		}
	}
}

coinParams.forEach(function (coinParam) {
	if (coinParam.useCoin) {
		new Coin(coinParam).init();
	}
});

module.exports = Coin;
