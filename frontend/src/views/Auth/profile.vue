<template>
	<main-content :breads="breads">
		<template #end-breads>
			<!-- Save Button -->
			<b-button variant="outline-primary" size="sm" @click="handleSave" :disabled="!userDataChanged"> Save </b-button>
		</template>
		<b-form @submit.prevent="handleSave">
			<b-row>
				<b-col cols="12" md="8" lg="9">
					<b-card header="Your Information">
						<b-row cols="1" cols-md="2" cols-lg="3">
							<b-col>
								<b-row cols="1">
									<!-- Fullname Input -->
									<b-col>
										<default-input label="Fullname" placeholder="Enter Fullname" field="fullname" :vuelidate="$v.user" namespace="Auth" />
									</b-col>
									<!-- Phone Input -->
									<b-col>
										<default-input label="Phone" placeholder="Enter Your Phone" field="phone" type="tel" :vuelidate="$v.user" namespace="Auth" />
									</b-col>
									<!-- Country Input -->
									<b-col>
										<default-input label="Country" placeholder="Enter Your Country" field="country" :vuelidate="$v.user" namespace="Auth" />
									</b-col>
								</b-row>
							</b-col>
							<b-col>
								<b-row cols="1">
									<!-- City Input -->
									<b-col>
										<default-input label="City" placeholder="Enter Your City" field="city" :vuelidate="$v.user" namespace="Auth" />
									</b-col>
									<!-- Address Input -->
									<b-col>
										<default-input label="Address" placeholder="Enter Your Address" field="address" :vuelidate="$v.user" namespace="Auth" />
									</b-col>
									<!-- Zip Code Input -->
									<b-col>
										<default-input label="Zip Code" placeholder="Enter Your Zip Code" field="zipCode" :vuelidate="$v.user" namespace="Auth" />
									</b-col>
								</b-row>
							</b-col>
							<b-col md="12" lg="4">
								<b-row cols="1" cols-md="2" cols-lg="1">
									<!-- Username Input -->
									<b-col>
										<default-input ref="inputName" label="Username" placeholder="Enter Username" field="username" :vuelidate="$v.user" namespace="Auth" />
									</b-col>
									<!-- Email Input -->
									<b-col>
										<default-input label="Email" placeholder="Enter Your Email" field="email" type="email" :vuelidate="$v.user" namespace="Auth" />
									</b-col>
									<!-- Password Input -->
									<b-col>
										<default-input label="Password" placeholder="Enter Your Password" field="password" type="password" :vuelidate="$v.user" namespace="Auth" />
									</b-col>
									<!-- Password Input -->
									<b-col>
										<default-input label="New Password" placeholder="Enter Your New Password" field="newPassword" type="password" :vuelidate="$v.user" namespace="Auth" />
									</b-col>
								</b-row>
							</b-col>
						</b-row>
					</b-card>
				</b-col>
				<b-col cols="12" md="4" lg="3">
					<b-card header="Your Image" class="h-100">
						<div class="d-flex align-items-center h-100">
							<drag-and-drop-image class="col-12 col-xl-10 p-0" v-model="user.image" :image="user.image" :before-upload="beforeUploadImage" />
						</div>
						<input-error class="text-center mt-n2" field="image" namespace="Auth" :vuelidateField="$v.user.image" />
					</b-card>
				</b-col>
			</b-row>
		</b-form>
	</main-content>
</template>

<script>
import { mapActions, mapMutations } from "vuex";

import { required, minLength, maxLength, email, numeric } from "vuelidate/lib/validators";

import { validationMixin } from "vuelidate";

const DefaultInput = () => import("@/components/inputs/DefaultInput");

const InputError = () => import("@/components/InputError");

const DragAndDropImage = () => import("@/components/inputs/DragAndDropImage");

export default {
	name: "Profile",

	mixins: [validationMixin],

	components: { DefaultInput, DragAndDropImage, InputError },

	data() {
		let me = this.$store.state.Auth.me;

		return {
			breads: [{ title: "Dashboard", link: "/" }, { title: "Profile" }],

			user: {
				username: me.username,
				fullname: me.fullname || "",
				phone: me.phone || "",
				email: me.email || "",
				country: me.country || "",
				city: me.city || "",
				address: me.address || "",
				zipCode: me.zipCode || "",
				password: "",
				newPassword: "",
				image: me.image ? `${process.env.VUE_APP_BASE_URL}/images/users/${me.image}` : ""
			}
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
			password: { required, minLength: minLength(8), maxLength: maxLength(20) },
			newPassword: { minLength: minLength(8), maxLength: maxLength(20) },
			image: {}
		}
	},

	computed: {
		userDataChanged() {
			let dataWatched = ["username", "fullname", "phone", "email", "country", "city", "address", "zipCode"];

			let show = !dataWatched.every((key) => this.user[key] === this.me[key]);

			let userImage = this.me.image ? `${process.env.VUE_APP_BASE_URL}/images/users/${this.me.image}` : "";

			let imagesChanged = this.user.image !== userImage;

			return show || imagesChanged || !!this.user.newPassword;
		}
	},

	methods: {
		...mapActions({ updateProfile: "Auth/updateProfile" }),

		...mapMutations("Auth", ["setError", "resetErrorByField", "resetError"]),

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

			let data = this.user;

			if (this.user.image && this.user.image instanceof File) {
				data = new FormData();

				for (let field in this.user) {
					data.set(field, this.user[field]);
				}

				data = [data, { headers: { "Content-Type": "multipart/formdata" } }];
			}

			try {
				let res = await this.updateProfile(data);

				let message = "actions.created";

				if (res.status == 200) {
					message = "actions.updated";
				}

				message = this.$t(message, { module: "Profile" });

				this.$store.commit("showToast", message);

				this.resetForm();
			} catch (err) {
				this.setError(err);
			} finally {
				this.isBusy = false;
			}
		},

		handleCancel() {
			this.resetForm();
		},

		resetForm() {
			this.resetError();

			this.user.password = "";

			this.user.newPassword = "";

			this.$nextTick(this.$v.$reset);
		}
	}
};
</script>
