const BufferList = require('bl');
const through = require('through2').obj;
const struct = require('varstruct');
const createHash = require('create-hash');
const bufferEquals = require('buffer-equals');
const defaultMessages = require('./structs').defaultMessages;
const types = require('./types');

//const SUBV = '/EXPERIMENTAL-NODE:1.0.0/';

function getChecksum(data) {
	let tmp = createHash('sha256').update(data).digest();
	return createHash('sha256').update(tmp).digest().slice(0, 4);
}

let msgHeader = struct([
	{name: 'magic', type: struct.UInt32LE},
	{name: 'command', type: types.messageCommand},
	{name: 'length', type: struct.UInt32LE},
	{name: 'checksum', type: struct.Buffer(4)}
]);

let msgLen = msgHeader.encodingLength({
	magic: 0,
	command: '',
	length: 0,
	checksum: new Buffer('01234567', 'hex')
});

exports.createDecodeStream = function (opts) {
	opts = opts || {};
	let messages = opts.messages || defaultMessages;
	let bl = new BufferList();
	let message;
	return through(function (chunk, enc, cb) {
		bl.append(chunk);
		while (bl.length > 0) {

			if (!message) {
				if (msgLen > bl.length) break;
				try {
					message = msgHeader.decode(bl.slice(0, msgLen));
				} catch (err) {
					return cb(err);
				}

				if (opts.magic && message.magic !== opts.magic) {
					return cb(new Error('Magic value in message ' +
						'(' + message.magic.toString(16) + ') did not match expected ' +
						'(' + opts.magic.toString(16) + ')'))
				}

				if (!messages[message.command]) {
					return cb(new Error('Unrecognized command: "' + message.command + '"'))
				}

				bl.consume(msgHeader.decode.bytes);
			}
			if (message.length > bl.length) break;

			let payload = bl.slice(0, message.length);
			let checksum = getChecksum(payload);
			if (!bufferEquals(checksum, message.checksum)) {
				return cb(new Error('Invalid message checksum. ' +
					'In header: "' + message.checksum.toString('hex') + '", ' +
					'calculated: "' + checksum.toString('hex') + '"'));
			}

			let command = messages[message.command];
			if (typeof command === 'function') {
				command = command(message, payload);
			}

			try {
				message.payload = command.decode(payload);
			} catch (err) {
				console.log(payload);
				console.log(payload.length);

				return cb(err);
			}

			if (command.decode.bytes !== message.length) {
				return cb(new Error('Message (command ' + message.command + ') length did not match header. ' +
					'In header: ' + message.length + ', read: ' + command.decode.bytes));
			}

			if (message.command === 'xbridge') {
				console.log(message.payload);
			}

			bl.consume(message.length);
			this.push(message);
			message = null;
		}
		cb(null);
	})
};

exports.createEncodeStream = function (opts) {
	opts = opts || {};
	let messages = opts.messages || defaultMessages;
	return through(function (chunk, enc, cb) {
		let command = messages[chunk.command];
		if (!command) {
			return cb(new Error('Unrecognized command: "' + chunk.command + '"'))
		}

		let payload;
		try {
			payload = command.encode(chunk.payload || {})
		} catch (err) {
			return cb(err);
		}

		payload = payload.slice(0, command.encode.bytes);
		chunk.length = command.encode.bytes;
		chunk.checksum = getChecksum(payload);
		chunk.magic = chunk.magic == null ? opts.magic : chunk.magic;
		if (chunk.magic == null) {
			throw new Error('Must specify network magic value in stream options or in message object')
		}
		let header;
		try {
			header = msgHeader.encode(chunk);
		} catch (err) {
			return cb(err);
		}

		this.push(header);
		this.push(payload);
		cb(null);
	})
};
