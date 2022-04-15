const mongoose = require("mongoose");
const SoftDelete = require("../../plugins/SoftDelete");

const Model = require("../../plugins/Model");

const Schema = mongoose.Schema;

const PersonSchema = new Schema(
	{
		firstName: { type: String, required: true },
		lastName: { type: String, required: true },
		email: { type: String, required: true },
		password: { type: String },
		phone: { type: String, required: true },
		address: { type: String, required: true },
		city: { type: String, required: true },
		state: { type: String, required: true },
		zip: { type: String, required: true },
		deletedAt: { type: Date, default: null },
		deletedBy: { type: Schema.Types.ObjectId, default: null },
	},
	{ timestamps: true }
);

// PersonSchema.plugin(SoftDelete);
// class Person {
// 	// Mongoose method
// 	getFullName() {
// 		return `${this.firstName} ${this.lastName}`;
// 	}

// 	// Mongoose static
// 	static findByName(name) {
// 		return this.findOne({ name });
// 	}

// 	// Mongoose virtual
// 	get fullName() {
// 		return `${this.firstName} ${this.lastName}`;
// 	}

// 	set fullName(value) {
// 		let names = value.split(" ");
// 		this.firstName = names[0];
// 		this.lastName = names[1];
// 	}
// }

PersonSchema.loadClass(Model);

let Person = mongoose.model("Person", PersonSchema);

Person;

module.exports = Person;
