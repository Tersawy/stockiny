module.exports = {
	root: true,
	env: { node: true },
	extends: ["plugin:vue/essential", "eslint:recommended", "@vue/prettier"],
	parserOptions: { parser: "babel-eslint" },
	rules: {
		"no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
		"no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
		quotes: [2, "double", "avoid-escape"],
		"comma-dangle": ["error", "never"],
		"max-len": ["error", { code: 190 }]
	}
};
