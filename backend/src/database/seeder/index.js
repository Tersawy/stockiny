require("dotenv").config();

const connection = require("../connection");

const { join } = require("path");

const consoleColors = require("../../utils/consoleColors");

const args = require("minimist")(process.argv.slice(2));

connection().then(async () => {
	const fs = require("fs");

	const seeders = fs.readdirSync(join(__dirname, "seeders"));

	let { model, refresh, down, up, help } = args;

	if (help || args.h) {
		console.log(`
Usage: npm run seed [options]
Options:
	-m, --model <model> the model to seed (default: all)
		Model name
	-r, --refresh <model> if model is already seeded, refresh it, otherwise refresh all models
		Refresh 
	-d, --down <model> if model is already seeded, down it, otherwise down all models
		Delete documents of model from database
	-u, --up <model> if model is already seeded, up it, otherwise up all models
		Insert documents of model to database
	-h, --help
		Show help
`);

		process.exit(0);
	}

	let models = [];

	if (model || args.m) {
		if (model === true || args.m === true) {
			if (model === true) {
				consoleColors("red", `** Option --model must be followed by a model name **`);
			}

			if (args.m === true) {
				consoleColors("red", `** Option -m must be followed by a model name **`);
			}

			process.exit(1);
		}

		model = model ? (Array.isArray(model) ? model : [model]) : [];

		// remove duplicates && merge flags -m and --model
		models = args.m ? [...new Set([...model, ...(Array.isArray(args.m) ? args.m : [args.m])])] : model;
	}

	let seedHandler = async (actionName) => {
		if (models.length) {
			for (let model of models) {
				if (seeders.includes(model.toLowerCase() + "Seed.js")) {
					let SeederModel = require(join(__dirname, "seeders", model.toLowerCase() + "Seed.js"));

					SeederModel = new SeederModel();

					if ("refresh" === actionName) {
						await SeederModel.down();

						await SeederModel.up();

						continue;
					}

					await SeederModel[actionName]();
				} else {
					consoleColors(
						"red",
						`-----------------------------\n| [ ${model} ] is not a valid model |\n -----------------------------`
					);
				}
			}
		} else {
			for await (let seeder of seeders) {
				let SeederModel = require(join(__dirname, "seeders", seeder));

				SeederModel = new SeederModel();

				if ("refresh" === actionName) {
					await SeederModel.down();

					await SeederModel.up();

					continue;
				}

				await SeederModel[actionName]();
			}
		}
	};

	if (refresh || args.r) {
		await seedHandler("refresh");
	} else if (down || args.d) {
		await seedHandler("down");
	} else if (up || args.u) {
		await seedHandler("up");
	} else {
		await seedHandler("up");
	}

	process.exit(1);
});
