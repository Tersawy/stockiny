<template>
	<b-modal :id="id" hide-footer :no-close-on-esc="isBusy" :no-close-on-backdrop="isBusy" @hidden="onHidden" @show="onShow" @ok="onOk" v-bind="mProps">
		<template #modal-header="{ close, ok }">
			<div class="d-flex align-items-center justify-content-between w-100">
				<div class="d-flex align-items-center">
					<span class="mb-0 font-default">
						<slot name="title"> {{ title }} </slot>
					</span>
				</div>
				<b-form-checkbox v-if="showStayOpenBtn" v-model="_stayOpen" switch> Stay open </b-form-checkbox>
				<div class="d-flex align-items-center">
					<slot name="btn-close" v-bind="{ isBusy, close }">
						<b-button size="sm" variant="outline-danger" :disabled="isBusy" @click="close"> Close </b-button>
					</slot>
					<!-- <b-button v-if="!isBusy" type="submit" variant="outline-primary"> Save </b-button> -->
					<b-button v-if="showOkBtn" size="sm" variant="outline-primary" :disabled="isBusy" class="d-flex align-items-center ml-2" @click="ok">
						<slot name="ok">Save</slot>
						<b-spinner v-if="isBusy" small class="mx-1"></b-spinner>
					</b-button>
				</div>
			</div>
		</template>

		<slot></slot>
	</b-modal>
</template>

<script>
export default {
	props: {
		id: { type: String, default: "formModal" },

		title: { type: String, default: "Form" },

		isBusy: { type: Boolean, default: false },

		modalProps: { type: Object, default: () => {} },

		stayOpen: { type: Boolean, default: false },

		showStayOpenBtn: { type: Boolean, default: true },

		showOkBtn: { type: Boolean, default: true }
	},

	computed: {
		mProps() {
			let defaultProps = { size: "lg" };

			return { ...defaultProps, ...this.modalProps };
		},

		_stayOpen: {
			get: function () {
				return this.stayOpen;
			},
			set: function (value) {
				this.$emit("update:stayOpen", value);
			}
		}
	},

	methods: {
		onHidden(e) {
			this.$emit("hidden", e);
		},

		onOk(e) {
			this.$emit("ok", e);
		},

		onShow(e) {
			this.$emit("show", e);
		}
	}
};
</script>
