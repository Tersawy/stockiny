const context = require.context(".", true, /index\.(js)$/i);

let modules = {};

context.keys().map((module) => {
	if (module == "./index.js") return;

	modules[module.split("/")[1]] = context(module).default;
});

export default modules;
