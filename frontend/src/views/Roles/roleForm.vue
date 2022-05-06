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
				<b-col cols="12" class="mb-4">
					<b-card body-class="p-0">
						<template #header>
							<h6 class="mb-0">
								<template v-if="isUpdate">
									<span>Role</span>&nbsp;
									<b-badge variant="outline-success">{{ oldRole.name | toSentenceCase }}</b-badge>
								</template>
								<template v-else>
									<span>New Role</span>
								</template>
							</h6>
						</template>
						<b-overlay :show="roleLoading" rounded="sm" spinner-variant="primary">
							<div class="p-4">
								<b-row align-v="center" cols="1" cols-md="2">
									<!-- Role name Input -->
									<b-col>
										<DefaultInput ref="inputName" label="Name" placeholder="Enter Role name" field="name" :vuelidate="$v.role" namespace="Roles" />
									</b-col>
									<b-col class="mt-3">
										<div class="d-flex justify-content-end">
											<!-- Bulk Actions DropDown -->
											<b-dropdown text="Bulk Actions" right variant="outline-primary">
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
										<b-form-checkbox v-for="permission in permissions" :key="permission" v-model="role.permissions" :value="permission">
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

import { required, minLength, maxLength } from "vuelidate/lib/validators";

import { validationMixin } from "vuelidate";

const DefaultInput = () => import("@/components/inputs/DefaultInput");

export default {
	name: "Roles",

	mixins: [validationMixin],

	components: { DefaultInput },

	data() {
		let isEdit = this.$route.params.roleId;

		return {
			breads: [{ title: "Dashboard", link: "/" }, { title: "Roles", link: "/roles" }, { title: isEdit ? "Edit" : "Create" }],

			role: { name: "", permissions: [] },

			bulkActions: {
				read: false,
				show: false,
				create: false,
				edit: false,
				delete: false,
				print: false
			},

			roleLoading: false,

			isStayHere: false
		};
	},

	validations: {
		role: {
			name: { required, minLength: minLength(3), maxLength: maxLength(54) },
			permissions: { required, minLength: minLength(1) }
		}
	},

	async mounted() {
		this.setOne({});

		this.getPermissions();

		if (this.roleId) {
			await this.getRole(this.roleId);

			if (this.oldRole._id) {
				for (const key in this.role) {
					this.role[key] = typeof this.oldRole[key] === "undefined" ? "" : this.oldRole[key];
				}
			}
		}
	},

	computed: {
		...mapState({
			oldRole: (state) => state.Roles.one,
			permissions: (state) => state.Permissions.all.docs
		}),

		roleId() {
			return this.$route.params.roleId;
		},

		isUpdate() {
			return !!this.oldRole._id;
		},

		showResetBtn() {
			return !!this.role.name || !!this.role.permissions.length;
		},

		showResetOriginalBtn() {
			if (!this.isUpdate) return false;

			let rolesAreEqual = this.oldRole.name == this.role.name;

			let permissionsAreEqual = this.oldRole.permissions.length == this.role.permissions.length;

			if (permissionsAreEqual) {
				permissionsAreEqual = this.oldRole.permissions.every((permission) => this.role.permissions.includes(permission));
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
		"role.permissions": {
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
					let newPermissions = new Set([...permissionsAction, ...this.role.permissions]); // merge permissions by Set to avoid duplicates

					this.role.permissions = [...newPermissions];
				} else {
					this.role.permissions = this.role.permissions.filter((permission) => !permissionsAction.includes(permission));
				}
			},
			deep: true
		}
	},

	methods: {
		...mapActions({
			getRole: "Roles/getOne",
			create: "Roles/create",
			update: "Roles/update",
			getOptions: "Roles/getOptions",
			getPermissions: "Permissions/getAll"
		}),

		...mapMutations("Roles", ["setOne", "setError", "resetErrorByField", "resetError"]),

		async handleSave() {
			this.$v.$touch();

			if (this.$v.$invalid) {
				if (this.$v.role.permissions.$invalid) {
					let message = this.$t("validation.minValue", { field: "Permissions", min: 1 });
					this.$store.commit("showToast", { variant: "danger", message });
				}
				return;
			}

			this.isBusy = true;

			let action = this.isUpdate ? this.update : this.create;

			try {
				let res = await action(this.role);

				let message = "actions.created";

				if (res.status == 200) {
					message = "actions.updated";
				}

				message = this.$t(message, { module: this.role.name });

				this.$store.commit("showToast", message);

				this.getOptions();

				this.resetForm();

				if (!this.isUpdate && this.isStayHere) return;

				this.$router.push({ name: "Roles" });
			} catch (err) {
				this.setError(err);
			} finally {
				this.isBusy = false;
			}
		},

		handleCancel() {
			this.resetForm();

			this.$router.push({ name: "Roles" });
		},

		/*
		 * check if app permissions are equals to this user permissions by action
		 * @param {String} action - action name e.g. "read", "create", "edit", "delete" etc.
		 * @returns {Boolean}
		 */
		ArePermissionsEqualByAction(action) {
			let onlyMainAction = action + ":";

			let permissionsCount = this.permissions.reduce((total, permission) => (permission.indexOf(onlyMainAction) > -1 ? total + 1 : total), 0);

			let rolePermissionsCount = this.role.permissions.reduce((total, permission) => (permission.indexOf(onlyMainAction) > -1 ? total + 1 : total), 0);

			return permissionsCount === rolePermissionsCount;
		},

		resetBulkActions() {
			for (let action in this.bulkActions) {
				this.bulkActions[action] = false;
			}
		},

		resetRoleAndPermissions() {
			this.role = { name: "", permissions: [] };
			this.resetBulkActions();
		},

		resetOriginalRoleAndPermissions() {
			this.role = { ...this.oldRole };
		},

		resetForm() {
			this.resetBulkActions();

			this.role = { name: "", permissions: [] };

			this.resetError();

			this.setOne({});

			this.$store.commit("Roles/setOne", {});

			this.$nextTick(this.$v.$reset);
		}
	}
};
</script>
