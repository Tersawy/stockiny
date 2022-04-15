module.exports = {
	// proxy API requests to Valet during development
	devServer: {
		proxy: process.env.VUE_APP_API_URL
	},

	// output built static files to Laravel's public dir.
	// note the "build" script in package.json needs to be modified as well.
	outputDir: "../server/public",

	// modify the location of the generated HTML file.
	// make sure to do this only in production.
	indexPath: process.env.NODE_ENV === "production" ? "../server/resources/views/index.blade.php" : "index.html",

	pluginOptions: {
		i18n: {
			locale: "en",
			fallbackLocale: "en",
			localeDir: "locales",
			enableInSFC: true
		}
	}
};
