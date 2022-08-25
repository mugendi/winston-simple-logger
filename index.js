// Copyright 2022 Anthony Mugendi
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const winston = require('winston'),
	util = require('util'),
	path = require('path'),
	stripAnsi = require('strip-ansi'),
	ValidateOrThrow = require('validate-or-throw');

const { combine, timestamp, printf, colorize, json } = winston.format;
require('winston-daily-rotate-file');

let logger;

function override() {
	let args = Array.from(arguments);
	let level = args.shift();

	if ('function' !== typeof logger[level]) {
		level = 'debug';
	}

	let text = args
		.map((v) => {
			if ('object' == typeof v)
				v = util.inspect(v, { depth: 4, colors: true });
			return v;
		})
		.join(', ');

	logger[level](text);
}

// function to strip ansi for file saving
const strip_ansi = winston.format((info, opts) => {
	//
	for (let k in info) {
		info[k] = stripAnsi(info[k]);
	}
	return info;
});

function format_file_transport(fileTransport, opts) {
	fileTransport.format = combine(strip_ansi(), timestamp(), json());

	if (opts.rotateLogs) {
		let filename = path
			.basename(fileTransport.filename)
			.split('.')
			.map((n, i) => {
				if (i === 0) n += '-%DATE%';
				return n;
			})
			.join('.');

		fileTransport.filename = path.join(opts.logsDir, filename);
		fileTransport.datePattern = opts.datePattern || 'YYYY-MM-DD';
		fileTransport.maxFiles = fileTransport.maxFiles || '14d';

		return new winston.transports.DailyRotateFile(fileTransport);
	} else {
		return new winston.transports.File(fileTransport);
	}

	// console.log(fileTransport);
}

function arrify(v) {
	if (v === undefined) return [];
	return Array.isArray(v) ? v : [v];
}

function validate_opts(opts) {
	let fileSchema = {
		filename: 'string',
		level: {
			type: 'string',
			lowercase: true,
			optional: true,
			enum: [
				'debug',
				'info',
				'warn',
				'http',
				'verbose',
				'silly',
				'error',
			],
		},
	};

	const schema = {
		$$strict: 'remove',
		overwriteConsole: { type: 'boolean', optional: true, default: false },
		rotateLogs: { type: 'boolean', optional: true, default: true },
		logsDir: { type: 'string', optional: true, default: require.main.path },
		fileTransports: [
			{
				type: 'array',
				optional: true,
				items: {
					type: 'object',
					props: fileSchema,
				},
			},
		],
		dateFormat: {
			type: 'string',
			optional: true,
		},
		maxFiles: {
			type: 'string',
			trim: true,
			lowercase: true,
			optional: true,
			pattern: /^[0-9]+[a-z]$/,
		},
	};

	ValidateOrThrow(opts, schema);
}

module.exports = (opts = {}) => {
	validate_opts(opts);
	// console.log(opts);
	// create transports starting with console
	let transports = [new winston.transports.Console()];

	if (opts.fileTransports) {
		for (let fileTransport of arrify(opts.fileTransports)) {
			let transport = format_file_transport(fileTransport, opts);
			// Add the file transport
			transports.push(transport);
		}
	}

	// Okay now create logger
	logger = winston.createLogger({
		level: opts.level || 'info',
		format: combine(
			colorize({ all: true }),
			timestamp({
				format: 'YYYY-MM-DD hh:mm:ss.SSS A',
			}),
			printf(
				(info) => `[${info.timestamp}] ${info.level}: ${info.message}`
			)
		),
		transports,
	});

	// if we asked to override console
	if (opts.overwriteConsole) {
		// console.debug = override.bind(null, 'debug');
		console.log = override.bind(null, 'info');
		console.info = override.bind(null, 'info');
		console.error = override.bind(null, 'error');
		console.warn = override.bind(null, 'warn');
	}

	return logger;
};
