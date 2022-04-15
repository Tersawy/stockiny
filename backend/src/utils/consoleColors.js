let colors = {
	red: "\x1b[31;1m",
	green: "\x1b[32;1m",
	yellow: "\x1b[33;1m",
	blue: "\x1b[34;1m",
	magenta: "\x1b[35;1m",
	cyan: "\x1b[36;1m",
	white: "\x1b[37;1m",
	reset: "\x1b[0m",
	bgRed: "\x1b[41;1m",
	bgGreen: "\x1b[42;1m",
	bgYellow: "\x1b[43;1m",
	bgBlue: "\x1b[44;1m",
	bgMagenta: "\x1b[45;1m",
	bgCyan: "\x1b[46;1m",
	bgWhite: "\x1b[47;1m",
	lightRed: "\x1b[91;1m",
	lightGreen: "\x1b[92;1m",
	lightYellow: "\x1b[93;1m",
	lightBlue: "\x1b[94;1m",
	lightMagenta: "\x1b[95;1m",
	lightCyan: "\x1b[96;1m",
	lightWhite: "\x1b[97;1m",
	bright: "\x1b[1m",
	dim: "\x1b[2m",
	italic: "\x1b[3m",
	underline: "\x1b[4m",
	blink: "\x1b[5m",
	inverse: "\x1b[7m",
	hidden: "\x1b[8m",
	strikethrough: "\x1b[9m",
};

module.exports = (...args) => {
	if (args.length === 1) return console.log(color);

	let _colors = args.slice(0, args.length - 1);

	if (args.length === 2) {
		_colors = args[0].replace(/(\||\:)/g, ",").split(",");
	}

	let msg = args[args.length - 1];

	_colors = _colors.reduce((acc, curr) => `${acc}${colors[curr] || curr}`, "");

	console.log(_colors, msg, "\x1b[0m");
};
