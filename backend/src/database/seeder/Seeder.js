const consoleColors = require("../../utils/consoleColors");

class Seeder {
	constructor(model, data) {
		this.model = model;
		this.data = data;
	}

	async up() {
		let data = this.data;

		if (typeof data === "function") {
			data = await data();
		}

		try {
			consoleColors("yellow", `** ${this.modelName()} up started **`);
			await this.model.insertMany(data);
			consoleColors("green", `** ${this.modelName()} up ended **`);
		} catch (error) {
			consoleColors("bgRed|bright", `** ${this.modelName()} up has Error **`);
			consoleColors("red", `----------------------------------------------------------------`);
			consoleColors("red", error.message);
			consoleColors("red", `----------------------------------------------------------------`);
			consoleColors("red", error.stack);
		}

		return true;
	}

	async down() {
		try {
			consoleColors("yellow", `** ${this.modelName()} down started **`);
			await this.model.forceDeleteMany({});
			consoleColors("green", `** ${this.modelName()} down ended **`);
		} catch (e) {
			consoleColors("red", `** ${this.modelName()} down has Error **`);
			console.log(e);
		}
	}

	model() {
		return this.model;
	}

	modelName() {
		return this.model.modelName;
	}
}

module.exports = Seeder;
