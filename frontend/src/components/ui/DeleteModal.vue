<template>
	<b-modal :ref="id" :id="id" hide-footer hide-header no-fade :no-close-on-esc="isBusy" :no-close-on-backdrop="isBusy" size="md" centered>
		<div class="text-center py-4 px-2">
			<div class="text-danger pt-3 pb-4">
				<TrashIcon width="80px" height="80px" style="cursor: auto" />
			</div>

			<h2 class="delete-msg text-primary my-3">{{ $t("actions.deleteMsg", { field }) }}</h2>

			<p class="text-muted mb-4">{{ $t("actions.cannotBeDone") }}</p>

			<div class="d-flex text-center">
				<b-btn ref="cancelBtn" class="w-50 mr-3" variant="outline-primary" :disabled="isBusy" @click="cancel"> {{ $t("actions.noCancel") }} </b-btn>
				<b-btn class="w-50 d-flex align-items-center justify-content-center" variant="danger" @click="ok" :disabled="isBusy">
					<span> {{ $t("actions.yesDelete") }} </span>
					<b-spinner small class="ml-2" v-if="isBusy"></b-spinner>
				</b-btn>
			</div>
		</div>
	</b-modal>
</template>

<script>
import TrashIcon from "@/components/icons/trash";

let sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default {
	components: { TrashIcon },

	props: {
		id: {
			type: String,
			default: "deleteModal"
		},
		field: {
			type: String,
			default: "field"
		}
	},

	data() {
		return {
			isBusy: false,
			bridge: null,
			forceCloseModal: false
		};
	},

	methods: {
		open(data) {
			this.bridge = data;

			this.$nextTick(async () => {
				this.$bvModal.show(this.id);
				await sleep(50);
				this.popUpAnimation();
				this.$refs.cancelBtn.focus();
			});
		},

		close() {
			this.bridge = null;

			this.setBusy(false);

			this.$nextTick(() => {
				this.$bvModal.hide(this.id);
				this.forceCloseModal = false;
			});
		},

		cancel() {
			this.$emit("cancel", this.bridge);

			this.close();
		},

		setBusy(value) {
			this.isBusy = !!value;
		},

		ok() {
			this.$emit("ok", this.bridge);
		},

		async popUpAnimation(evt) {
			if (evt) evt.preventDefault();

			let content = this.$refs[this.id].$refs.content;

			content.style.transition = "transform 0.2s ease";

			content.style.transform = "scale(0.9)";

			await sleep(100);

			content.style.transform = "none";

			await sleep(100);

			content.style.transform = "scale(0.9)";

			await sleep(100);

			content.style.transform = "none";
		}
	}
};
</script>

<style lang="scss">
.delete-msg {
	line-height: 1.5;
}
</style>
