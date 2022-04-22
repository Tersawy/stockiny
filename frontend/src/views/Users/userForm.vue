<template>
	<main-content :breads="breads">
		<template #end-breads>
			<div class="d-flex align-items-center">
				<!-- Stay Here Check Box -->
				<b-form-checkbox v-model="isStayHere" v-if="!isUpdate" switch class="mx-3"> Stay here </b-form-checkbox>

				<!-- Save Button -->
				<b-button variant="outline-primary" size="sm" @click="handleSave"> Save </b-button>

				<!-- Reset Role And Permissions Button -->
				<b-button variant="outline-danger" size="sm" @click="handleCancel" class="ml-2"> Cancel </b-button>
			</div>
		</template>
		<b-form @submit.prevent="handleSave">
			<b-row>
				<b-col cols="12" md="8" lg="9">
					<b-card header="User Information">
						<b-row cols="1" cols-md="2" cols-lg="3">
							<b-col>
								<b-row cols="1">
									<!-- Fullname Input -->
									<b-col>
										<default-input label="Fullname" placeholder="Enter Fullname" field="fullname" :vuelidate="$v.user" namespace="Users" />
									</b-col>
									<!-- Phone Input -->
									<b-col>
										<default-input label="Phone" placeholder="Enter User Phone" field="phone" type="tel" :vuelidate="$v.user" namespace="Users" />
									</b-col>
									<!-- Country Input -->
									<b-col>
										<default-input label="Country" placeholder="Enter User Country" field="country" :vuelidate="$v.user" namespace="Users" />
									</b-col>
								</b-row>
							</b-col>
							<b-col>
								<b-row cols="1">
									<!-- City Input -->
									<b-col>
										<default-input label="City" placeholder="Enter User City" field="city" :vuelidate="$v.user" namespace="Users" />
									</b-col>
									<!-- Address Input -->
									<b-col>
										<default-input label="Address" placeholder="Enter User Address" field="address" :vuelidate="$v.user" namespace="Users" />
									</b-col>
									<!-- Zip Code Input -->
									<b-col>
										<default-input label="Zip Code" placeholder="Enter User Zip Code" field="zipCode" :vuelidate="$v.user" namespace="Users" />
									</b-col>
								</b-row>
							</b-col>
							<b-col md="12" lg="4">
								<b-row cols="1" cols-md="2" cols-lg="1">
									<!-- Username Input -->
									<b-col>
										<default-input ref="inputName" label="Username" placeholder="Enter Username" field="username" :vuelidate="$v.user" namespace="Users" />
									</b-col>
									<!-- Email Input -->
									<b-col>
										<default-input label="Email" placeholder="Enter User Email" field="email" type="email" :vuelidate="$v.user" namespace="Users" />
									</b-col>
									<!-- Password Input -->
									<b-col>
										<default-input label="Password" placeholder="Enter User Password" field="password" type="password" :vuelidate="$v.user" namespace="Users" />
									</b-col>
								</b-row>
							</b-col>
						</b-row>
					</b-card>
				</b-col>
				<b-col cols="12" md="4" lg="3">
					<b-card header="User Image" class="h-100">
						<div class="d-flex align-items-center h-100">
							<drag-and-drop-image class="col-12 col-xl-10 p-0" v-model="user.image" :image="user.image" :before-upload="beforeUploadImage" />
						</div>
						<input-error class="text-center mt-n2" field="image" namespace="Users" :vuelidateField="$v.user.image" />
					</b-card>
				</b-col>
				<b-col cols="12" class="my-4">
					<b-card header="User Permissions" body-class="p-0">
						<b-overlay :show="roleLoading" rounded="sm" spinner-variant="primary">
							<div class="p-4">
								<b-row align-v="center">
									<!-- Role Input -->
									<b-col cols="6">
										<b-row align-v="center">
											<b-col cols="6">
												<default-select label="Role" field="role" :options="roleOptions" :vuelidate="$v.user" namespace="Users" />
											</b-col>
											<b-col>
												<b-form-checkbox v-model="user.isActive" switch class="mt-3" v-if="hasPermission('active:users')"> Active </b-form-checkbox>
											</b-col>
										</b-row>
									</b-col>
									<b-col class="mt-3">
										<div class="d-flex justify-content-end">
											<!-- Bulk Actions DropDown -->
											<b-dropdown text="Bulk Actions" right variant="outline-primary" v-if="!user.role">
												<b-dropdown-form>
													<b-form-checkbox v-for="(_, action) in bulkActions" :key="action" v-model="bulkActions[action]" class="mb-3">
														{{ action | toSentenceCase }} All
													</b-form-checkbox>
												</b-dropdown-form>
											</b-dropdown>

											<!-- Reset Role And Permissions Button -->
											<b-button variant="outline-danger" @click="resetRoleAndPermissions" class="ml-2" v-if="showResetBtn"> Reset </b-button>

											<!-- Reset Original Role And Permissions Button -->
											<b-button variant="outline-danger" @click="resetOriginalRoleAndPermissions" class="ml-2" v-if="showResetOriginalBtn">Reset To Original</b-button>
										</div>
									</b-col>
								</b-row>

								<b-row cols="1" cols-sm="2" cols-md="3" cols-lg="4" cols-xl="5">
									<b-col v-for="(permissions, module) in modulesOptions" :key="module" class="mt-4">
										<strong class="d-block mb-2 text-muted">{{ module | toSentenceCase }}</strong>
										<b-form-checkbox
											v-for="permission in permissions"
											:key="permission"
											v-model="user.permissions"
											:value="permission"
											:disabled="user.role && rolePermissions && rolePermissions.includes(permission)"
										>
											{{ permission.split(":")[0] | toSentenceCase }}
										</b-form-checkbox>
									</b-col>
								</b-row>
							</div>
						</b-overlay>
					</b-card>
				</b-col>
			</b-row>
		</b-form>
	</main-content>
</template>

<script>
import { mapActions, mapMutations, mapState } from "vuex";

import { required, minLength, maxLength, email, numeric, requiredIf } from "vuelidate/lib/validators";

import { validationMixin } from "vuelidate";

const DefaultInput = () => import("@/components/ui/DefaultInput");

const DefaultSelect = () => import("@/components/ui/DefaultSelect");

const InputError = () => import("@/components/ui/InputError");

const DragAndDropImage = () => import("@/components/ui/DragAndDropImage");

export default {
	name: "Users",

	mixins: [validationMixin],

	components: { DefaultInput, DefaultSelect, DragAndDropImage, InputError },

	data() {
		let isEdit = this.$route.params.userId;

		return {
			breads: [{ title: "Dashboard", link: "/" }, { title: "Users", link: "/users" }, { title: isEdit ? "Edit" : "Create" }],

			user: {
				username: "",
				fullname: "",
				phone: "",
				email: "",
				country: "",
				city: "",
				address: "",
				zipCode: "",
				permissions: [],
				password: "",
				image: null,
				role: null,
				isActive: false
			},

			bulkActions: {
				read: false,
				show: false,
				create: false,
				edit: false,
				delete: false,
				print: false
			},

			roleLoading: false,

			isStayHere: false,

			roleLoaded: false
		};
	},

	validations: {
		user: {
			username: { required, minLength: minLength(3), maxLength: maxLength(54) },
			fullname: { required, minLength: minLength(3), maxLength: maxLength(54) },
			phone: { required, numeric, minLength: minLength(6), maxLength: maxLength(18) },
			email: { required, email, minLength: minLength(6), maxLength: maxLength(254) },
			country: { required, minLength: minLength(3), maxLength: maxLength(54) },
			city: { required, minLength: minLength(3), maxLength: maxLength(54) },
			address: { required, minLength: minLength(3), maxLength: maxLength(54) },
			zipCode: { required, minLength: minLength(3), maxLength: maxLength(20) },
			password: {
				requiredIf: requiredIf(function () {
					return !this.isUpdate;
				}),
				minLength: minLength(8),
				maxLength: maxLength(20)
			},
			image: {},
			role: {}
		}
	},

	async mounted() {
		this.getRoleOptions();

		this.getPermissions();

		if (this.userId) {
			await this.getUser(this.userId);

			if (this.oldUser._id) {
				for (const key in this.user) {
					this.user[key] = typeof this.oldUser[key] === "undefined" ? "" : this.oldUser[key];
					if (key == "image" && this.oldUser[key]) {
						this.user[key] = `${this.BASE_URL}/images/users/${this.oldUser[key]}`;
					}
				}
			}
		}
	},

	computed: {
		...mapState({
			oldUser: (state) => state.Users.one,
			roleOptions: (state) => state.Roles.options,
			rolePermissions: (state) => state.Roles.one.permissions,
			permissions: (state) => state.Permissions.all.docs
		}),

		userId() {
			return this.$route.params.userId;
		},

		isUpdate() {
			return !!this.oldUser._id;
		},

		showResetBtn() {
			return !!this.user.role || !!this.user.permissions.length;
		},

		showResetOriginalBtn() {
			if (!this.isUpdate) return false;

			let rolesAreEqual = this.user.role == this.oldUser.role;

			let permissionsAreEqual = this.user.permissions.length == this.oldUser.permissions.length;

			if (permissionsAreEqual) {
				permissionsAreEqual = this.oldUser.permissions.every((permission) => this.user.permissions.includes(permission));
			}

			return !rolesAreEqual || !permissionsAreEqual;
		},

		// this fix the same value in watch issue https://github.com/vuejs/vue/issues/2164 #2164
		computedBulkedActions() {
			return Object.assign({}, this.bulkActions);
		},

		sortedPermissionsByModule() {
			let permissions = [...this.permissions];

			let actions = [
				"read",
				"show",
				"create",
				"active",
				"edit",
				"delete",
				"changestatus",
				"showpayment",
				"createpayment",
				"editpayment",
				"deletepayment",
				"readstatus",
				"createstatus",
				"editstatus",
				"changeeffectedstatus",
				"deletestatus",
				"print"
			];

			permissions.sort((a, b) => {
				a = a.toLowerCase();

				b = b.toLowerCase();

				let [aAction, aModule] = a.split(":");

				let [bAction, bModule] = b.split(":");

				if (aModule == bModule) {
					if (actions.indexOf(aAction) > actions.indexOf(bAction)) {
						return 1;
					}

					if (actions.indexOf(aAction) < actions.indexOf(bAction)) {
						return -1;
					}

					return 0;
				}

				return aModule > bModule ? 1 : -1;
			});

			return permissions;
		},

		modulesOptions() {
			let permissions = this.sortedPermissionsByModule;

			// group permissions by module
			permissions = permissions.reduce((lastPermissions, permission) => {
				let module = permission.split(":")[1];

				if (!lastPermissions[module]) {
					return { ...lastPermissions, [module]: [permission] };
				}

				return { ...lastPermissions, [module]: [...lastPermissions[module], permission] };
			}, {});

			// sort modules by permissions length
			let sortedModulesByPermissionLength = Object.keys(permissions).sort((a, b) => {
				return permissions[b].length - permissions[a].length;
			});

			// make modules object with permissions
			return sortedModulesByPermissionLength.reduce((lastPermissions, module) => {
				return { ...lastPermissions, [module]: permissions[module] };
			}, {});
		}
	},

	watch: {
		"user.role": {
			async handler(roleId) {
				if (roleId) {
					this.resetBulkActions();

					this.roleLoading = true;

					await this.getRole(roleId);

					setTimeout(() => {
						// remove this line to avoid old permissions stay in the form
						// let permissions = new Set([...this.rolePermissions, ...((this.isUpdate && this.oldUser.permissions) || [])]); // merge permissions by Set to avoid duplicates

						if (this.roleLoaded) {
							this.user.permissions = [...this.rolePermissions];
						} else {
							this.roleLoaded = true;
						}

						this.roleLoading = false;
					}, 1000);
				}
			},
			deep: true
		},

		"user.permissions": {
			handler() {
				for (let action in this.bulkActions) {
					this.bulkActions[action] = this.ArePermissionsEqualByAction(action);
				}
			},
			deep: true
		},

		// watch computedBulkedActions instead of bulkedActions to fix the same value in watch issue
		computedBulkedActions: {
			handler(value, oldValue) {
				let thisAction = "";

				for (let action in value) {
					if (value[action] != oldValue[action]) {
						// if action is false and permissions are not equals that means all permissions with this action maybe checked except one
						if (!value[action] && !this.ArePermissionsEqualByAction(action)) return;

						thisAction = action;

						break;
					}
				}

				let permissionsAction = this.permissions.filter((permission) => {
					let [action] = permission.split(":");

					return action == thisAction;
				});

				if (value[thisAction]) {
					let newPermissions = new Set([...permissionsAction, ...this.user.permissions]); // merge permissions by Set to avoid duplicates

					this.user.permissions = [...newPermissions];
				} else {
					this.user.permissions = this.user.permissions.filter((permission) => !permissionsAction.includes(permission));
				}
			},
			deep: true
		}
	},

	methods: {
		...mapActions({
			getUser: "Users/getOne",
			create: "Users/create",
			update: "Users/update",
			getRoleOptions: "Roles/getOptions",
			getRole: "Roles/getOne",
			getPermissions: "Permissions/getAll"
		}),

		...mapMutations("Users", ["setOne", "setError", "resetErrorByField", "resetError"]),

		beforeUploadImage(err) {
			if (err) {
				this.setError({ field: "image", message: err });
			} else {
				this.resetErrorByField("image");
			}
		},

		async handleSave() {
			this.$v.$touch();

			if (this.$v.$invalid) return;

			this.isBusy = true;

			let permissions = this.user.permissions;

			if (this.user.role) {
				permissions = permissions.filter((permission) => !this.rolePermissions.includes(permission));
			}

			let data = { ...this.user };

			if (this.user.image) {
				data = new FormData();

				for (let field in this.user) {
					if (field == "permissions") {
						permissions.forEach((permission) => data.append(field, permission));
					} else {
						data.set(field, this.user[field]);
					}
				}

				data = [data, { headers: { "Content-Type": "multipart/formdata" } }];
			}

			let action = this.isUpdate ? this.update : this.create;

			try {
				let res = await action(data);

				let message = "actions.created";

				if (res.status == 200) {
					message = "actions.updated";
				}

				message = this.$t(message, { module: this.user.username });

				this.$store.commit("showToast", message);

				this.resetForm();

				if (!this.isUpdate && this.isStayHere) return;

				this.$router.push({ name: "Users" });
			} catch (err) {
				this.setError(err);
			} finally {
				this.isBusy = false;
			}
		},

		handleCancel() {
			this.resetForm();

			this.$router.push({ name: "Users" });
		},

		/*
		 * check if app permissions are equals to this user permissions by action
		 * @param {String} action - action name e.g. "read", "create", "edit", "delete" etc.
		 * @returns {Boolean}
		 */
		ArePermissionsEqualByAction(action) {
			let permissionsCount = this.permissions.reduce((total, permission) => (permission.indexOf(action) > -1 ? total + 1 : total), 0);

			let userPermissionsCount = this.user.permissions.reduce((total, permission) => (permission.indexOf(action) > -1 ? total + 1 : total), 0);

			return permissionsCount === userPermissionsCount;
		},

		resetBulkActions() {
			for (let action in this.bulkActions) {
				this.bulkActions[action] = false;
			}
		},

		resetRoleAndPermissions() {
			this.user.role = null;
			this.user.permissions = [];
			this.resetBulkActions();
		},

		resetOriginalRoleAndPermissions() {
			this.roleLoaded = false;
			this.user.role = this.oldUser.role;
			this.user.permissions = [...this.oldUser.permissions];
		},

		resetForm() {
			this.resetBulkActions();

			this.user = {
				username: "",
				fullname: "",
				phone: "",
				email: "",
				country: "",
				city: "",
				address: "",
				zipCode: "",
				permissions: [],
				password: "",
				image: null,
				role: null,
				isActive: false
			};

			this.resetError();

			this.setOne({});

			this.$store.commit("Roles/setOne", {});

			this.$nextTick(this.$v.$reset);
		}
	}
};
</script>
