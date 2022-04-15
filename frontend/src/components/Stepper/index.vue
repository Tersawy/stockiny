<template>
	<div class="stepper" v-if="steps.length">
		<div :class="`stepper-header ${headerClass}`">
			<template v-for="(step, index) in steps">
				<div
					class="step-item"
					:key="index"
					:class="{ 'is-active': index === currentStep, 'is-completed': step.completed, 'no-title': hideTitle, 'is-clickable': clickableTitle && !step.disabled }"
					@click="!step.disabled && toStep(index)"
				>
					<div class="step-item-icon">
						<CheckIcon v-if="step.completed" />
						<template v-else>
							<component v-if="step.icon" :is="step.icon" />
							<span v-else class="step-item-icon-inner">{{ index + 1 }}</span>
						</template>
					</div>
					<p class="step-item-title" v-if="!hideTitle">{{ step.title }}</p>
				</div>
				<hr :key="`hr-${index}`" v-if="index !== steps.length - 1" />
			</template>
		</div>
		<div :class="`stepper-body ${bodyClass}`">
			<div class="steps-wrapper" ref="stepsWrapper">
				<div class="step" v-for="(step, index) in steps" :key="index" :class="{ active: step.active, completed: step.completed }" :ref="`step`">
					<div class="step-body">
						<slot :name="`step(${step.name})`" :step="step" :next="nextStep" :prev="prevStep" :to="toStep" :complete="completeStep" :reset="resetStep">
							<div class="step-content">Welcome to Step {{ step.name }}</div>
						</slot>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
<style lang="scss" scoped></style>

<script>
	import CheckIcon from "./icons/CheckIcon";

	export default {
		components: { CheckIcon },

		props: {
			steps: {
				type: Array,
				default: () => []
			},
			clickableTitle: {
				type: Boolean,
				default: () => false
			},
			visibleTitleOn: {
				type: [Number, String],
				default: () => 768
			},
			headerClass: {
				type: String,
				default: () => ""
			},
			bodyClass: {
				type: String,
				default: () => ""
			}
		},

		data() {
			return {
				hideTitle: false
			};
		},

		mounted() {
			if (!this.steps.length) {
				return console.warn("[Vue-Stepper] You must provide at least one step.");
			}

			if (this.currentStep === -1) {
				this.steps[0].active = true;
			}

			this.$refs.stepsWrapper.scrollLeft = this.$refs.step[this.currentStep].offsetLeft;
		},

		computed: {
			currentStep() {
				return this.steps.findIndex((step) => step.active);
			}
		},

		methods: {
			nextStep() {
				let getNextIndex = (stepIndex) => {
					let nextIndex = stepIndex + 1;

					if (!this.steps[nextIndex]) return -1;

					if (this.steps[nextIndex].disabled) {
						return getNextIndex(nextIndex);
					}

					return nextIndex;
				};

				let nextIndex = getNextIndex(this.currentStep);

				if (nextIndex === -1) return;

				this.toStep(nextIndex);
			},

			prevStep() {
				let getPrevIndex = (stepIndex) => {
					let prevIndex = stepIndex - 1;

					if (!this.steps[prevIndex]) return -1;

					if (this.steps[prevIndex].disabled) {
						return getPrevIndex(prevIndex);
					}

					return prevIndex;
				};

				let prevIndex = getPrevIndex(this.currentStep);

				if (prevIndex === -1) return;

				this.toStep(prevIndex);
			},

			completeStep() {
				const currentStep = this.steps[this.currentStep];
				currentStep.completed = true;
			},

			resetStep() {
				const currentStep = this.steps[this.currentStep];
				currentStep.completed = false;
			},

			toStep(index) {
				const currentStep = this.steps[this.currentStep];
				currentStep.active = false;

				const nextStep = this.steps[index];
				nextStep.active = true;

				this.$refs.stepsWrapper.scrollLeft = this.$refs.step[index].offsetLeft;
			}
		},

		created() {
			let handler = (tab) => (this.hideTitle = tab.matches);

			// pulled from https://stackoverflow.com/a/56678176
			var tab = window.matchMedia(`(max-width: ${this.visibleTitleOn}px)`);

			handler(tab);

			tab.onchange = handler;
		}
	};
</script>

<style lang="scss" scoped>
	.stepper {
		margin-bottom: 1.5rem;
		.stepper-header {
			display: flex;
			width: 100%;
			align-items: stretch;
			flex-wrap: wrap;
			justify-content: space-between;
			background-color: #fff;
			color: #000;
			border-radius: 0.25rem 0.25rem 0 0;
			.step-item {
				align-items: center;
				display: flex;
				flex-direction: row;
				padding: 1rem;
				position: relative;
				.step-item-icon {
					display: flex;
					align-items: center;
					justify-content: center;
					width: 24px;
					min-width: 24px;
					height: 24px;
					min-height: 24px;
					border-radius: 50%;
					font-size: 0.75rem;
					background-color: rgba(0, 0, 0, 0.38);
					color: #fff;
					margin-right: 8px;
				}
				.step-item-title {
					font-size: 1.1em;
					margin: 0;
				}
				&.is-active {
					.step-item-icon {
						background-color: #03a9f4;
					}
				}
				&.is-completed {
					.step-item-icon {
						background-color: #28a745;
						font-size: 1.3rem;
					}
				}
				&.no-title {
					justify-content: center;
					.step-item-icon {
						margin: 0;
					}
				}
				&.is-clickable:not(.is-active) {
					cursor: pointer;
					position: relative;
					z-index: 1;
					overflow: hidden;
					&:not(.is-active)::before {
						content: "";
						position: absolute;
						top: 50%;
						left: 50%;
						width: 0%;
						height: 0%;
						background-color: rgb(224, 224, 224);
						z-index: -1;
						border-radius: 50%;
					}
					&:not(.is-active):hover::before {
						top: calc(((100vw - 100%) / 2) * -1);
						left: calc(((100vw - 100%) / 2) * -1);
						width: 100vw;
						height: 100vw;
						transition: all 0.5s ease-in-out;
					}
				}
			}
			hr {
				align-self: center;
				margin: 0 -16px;
				display: block;
				flex: 1 1 0px;
				max-width: 100%;
				height: 0;
				max-height: 0;
				border: solid;
				border-width: thin 0 0 0;
				overflow: visible;
				border-color: rgba(0, 0, 0, 0.12);
			}
		}
		.stepper-body {
			overflow: hidden;
			background-color: #fff;
			border-radius: 0 0 0.25rem 0.25rem;
			.steps-wrapper {
				display: flex;
				flex-direction: row;
				justify-content: flex-start;
				color: #000;
				overflow: hidden;
				position: relative;
				scroll-behavior: smooth;
				.step {
					min-width: 100%;
					padding: 1.25rem;
				}
			}
		}
	}
</style>
