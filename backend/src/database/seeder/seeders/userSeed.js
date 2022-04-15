const Seeder = require("../Seeder");

const mongoose = require("mongoose");

const bcrypt = require("bcrypt");

const User = require("../../../modules/user/User");

const Role = require("../../../modules/role/Role");

let users = async () => {
	let role = await Role.findOne({ name: "admin" });

	return [
		{
			username: "owner",
			fullname: "Owner",
			phone: "0987654321",
			email: "owner@mail.com",
			password: bcrypt.hashSync("123123123", 10),
			isOwner: true,
			country: "Vietnam",
			city: "Hanoi",
			address: "123 Street",
			zipCode: "265815",
			createdBy: mongoose.Types.ObjectId.generate().toString("hex"),
		},
		{
			username: "admin",
			fullname: "Admin",
			phone: "0987654321",
			email: "admin@mail.com",
			password: bcrypt.hashSync("123123123", 10),
			role: (role && role._id) || null,
			country: "England",
			city: "London",
			address: "123 Street",
			zipCode: "495768",
			createdBy: mongoose.Types.ObjectId.generate().toString("hex"),
		},
		{
			username: "storekeeper",
			fullname: "Storekeeper",
			phone: "0987654321",
			email: "storekeeper@mail.com",
			password: bcrypt.hashSync("123123123", 10),
			country: "Germany",
			city: "Berlin",
			address: "123 Street",
			zipCode: "12345",
			// role: "storekeeper",
			createdBy: mongoose.Types.ObjectId.generate().toString("hex"),
		},
	];
};

class UserSeed extends Seeder {
	constructor() {
		super(User, users);
	}
}

module.exports = UserSeed;
