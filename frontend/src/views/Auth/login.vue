<template>
	<div class="login">
		<b-container fluid>
			<b-row>
				<b-col class="mx-auto" cols="12" sm="8" md="6" lg="5" xl="4">
					<b-card class="card shadow-lg">
						<b-card-body>
							<b-form @submit.prevent="onSubmit" @reset="onReset">
								<b-form-group>
									<b-form-input v-model="login.email" type="email" placeholder="Enter email" required></b-form-input>
								</b-form-group>

								<b-form-group>
									<b-form-input v-model="login.password" type="password" placeholder="Enter password" required></b-form-input>
								</b-form-group>

								<div class="d-flex justify-content-between align-items-center">
									<b-button type="submit" variant="primary">login</b-button>
									<router-link class="text-danger" to="/forget-password">Forget password ?</router-link>
								</div>
							</b-form>
						</b-card-body>
					</b-card>
				</b-col>
			</b-row>
		</b-container>
	</div>
</template>

<script>
	// import { required } from "vuelidate/lib/validators";
	export default {
		name: "Login",
		data: () => ({
			login: { email: null, password: null }
		}),

		validations: {
			login: {
				email: {}
			}
		},

		mounted() {},

		methods: {
			async onSubmit() {
				try {
					await this.$store.dispatch("Auth/login", this.login);
				} catch (error) {
					console.log(error);
				}
			},
			onReset() {
				console.log(this.login);
			}
		}
	};
</script>
<style lang="scss" scoped>
	.login {
		height: 100vh;
		background-image: linear-gradient(to right, rgba(255, 0, 0, 0.301), rgba(255, 0, 0, 0.678));
		.card {
			margin-top: 150px;
		}
	}
</style>
