# morgan-simple-logger
A simple and convenient wrapper around [Winston](https://www.npmjs.com/package/winston) to simplify the repetitive tasks of setting up logs, formatters and transports.

It also includes a simple API to read back the logs.

## How to use

```javascript

let loggerOpts = {    
	overwriteConsole: true,    
	rotateLogs: true,
	datePattern: 'YYYY-MM-DD',
	maxFiles: '30D',
	fileTransports: [
		{
			filename: 'error.log',
			level: 'error',
		},
		{
			filename:'info.log',
			level: 'info',
		},
	],
};
const logger = require('morgan-simple-logger')(loggerOpts);

```

## Options
- **```overwriteConsole:```** If set to true, all console.logs are converted into morgan logs. In short, console.log is monkey patched.

- **```rotateLogs:```** this enables log rotation with default 'maxFiles' value of '14d'. Note: This option only works when ```fileTransports``` is also set. 

- **```datePattern:```** The date pattern to use during log rotation. Note: This option only works when ```fileTransports``` and ```rotateLogs``` are also set. 

- **```maxFiles:```**  Ensures that log files that are older than 14 days are automatically deleted.

- **```fileTransports:```** an array of the various file transports to use. These need only indicate two fields; ```filename``` and ```level```. The wrapper automagically formats the file names and wraps with the right winston file transports for you.