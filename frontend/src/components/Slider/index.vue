<!--
  Pulled From https://css-tricks.com/the-javascript-behind-touch-friendly-sliders/
  https://codepen.io/foleyatwork/pen/AMprRB
-->

<template>
	<div class="slider-wrap">
		<div class="slider" ref="slider" @scroll="sliderScroll">
			<div class="holder" ref="holder" :style="{ width: `${images.length * 100}%` }">
				<div class="slide-wrapper" v-for="(image, i) in images" :key="i" :style="{ width: `calc(100% / ${images.length})` }">
					<div class="slide">
						<img class="slide-image" ref="slideImage" :src="image.src" />
					</div>
					<span class="temp"> {{ image.temp }} </span>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
	export default {
		data() {
			return {
				images: [
					{ src: "//farm8.staticflickr.com/7347/8731666710_34d07e709e_z.jpg", temp: 74 },
					{ src: "//farm8.staticflickr.com/7384/8730654121_05bca33388_z.jpg", temp: 64 },
					{ src: "//farm8.staticflickr.com/7382/8732044638_9337082fc6_z.jpg", temp: 82 },
					{ src: "//farm8.staticflickr.com/7347/8731666710_34d07e709e_z.jpg", temp: 74 },
					{ src: "//farm8.staticflickr.com/7384/8730654121_05bca33388_z.jpg", temp: 64 },
					{ src: "//farm8.staticflickr.com/7382/8732044638_9337082fc6_z.jpg", temp: 82 }
				],
				touchstartx: undefined,
				touchmovex: undefined,
				movex: undefined,
				index: 0,
				longTouch: undefined
			};
		},

		mounted() {
			if (navigator.msMaxTouchPoints) {
				this.$refs.slider.classList.add("ms-touch");
			} else {
				this.bindUIEvents();

				this.$refs.slideImage.forEach((image) => {
					image.addEventListener("dragstart", (e) => {
						e.preventDefault();
						return false;
					});
				});
			}
		},

		computed: {
			sliderWidth() {
				return this.$refs.slider.clientWidth;
			},

			isTouchDevice() {
				return "ontouchstart" in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
			}
		},

		methods: {
			sliderScroll() {
				if (navigator.msMaxTouchPoints) {
					this.$refs.slideImage.forEach((image) => {
						image.style.transform = `translate3d(-${100 - this.$refs.slider.scrollLeft / 6}px, 0, 0)`;
					});
				}
			},

			bindUIEvents() {
				if (this.isTouchDevice) {
					this.$refs.slider.addEventListener("touchstart", this.touchstart);
					this.$refs.slider.addEventListener("touchmove", this.touchmove);
					this.$refs.slider.addEventListener("touchend", this.touchend);
				} else {
					this.$refs.slider.addEventListener("mousedown", this.mousedown);
					this.$refs.slider.addEventListener("mouseup", this.mouseup);
					this.$refs.slider.addEventListener("mouseleave", this.mouseleave);
				}
			},

			touchstart(e) {
				// Test for flick.
				this.longTouch = false;

				setTimeout(() => {
					this.longTouch = true;
				}, 250);

				// Get the original touch position.
				if (this.isTouchDevice) {
					this.touchstartx = e.originalEvent?.touches[0].pageX || e.touches[0].pageX;
				} else {
					this.touchstartx = e.clientX;
				}

				// The movement gets all janky if there's a transition on the elements.
				this.removeAnimate();
			},

			touchmove(e) {
				// Continuously return touch position.
				if (this.isTouchDevice) {
					this.touchmovex = e.originalEvent?.touches[0].pageX || e.touches[0].pageX;
				} else {
					this.touchmovex = e.clientX;
				}

				// Calculate distance to translate holder.
				this.movex = this.index * this.sliderWidth + (this.touchstartx - this.touchmovex);

				if (this.movex < (this.images.length - 1) * this.sliderWidth) {
					// Makes the holder stop moving when there is no more content.
					this.$refs.holder.style.transform = "translate3d(-" + this.movex + "px, 0, 0)";
				}
			},

			touchend() {
				// Calculate the distance swiped.
				var absMove = Math.abs(this.index * this.sliderWidth - this.movex);

				// Calculate the index. All other calculations are based on the index.
				if (absMove > this.sliderWidth / (this.images.length - 1) || this.longTouch === false) {
					if (this.movex > this.index * this.sliderWidth && this.index < this.images.length - 1) {
						this.index++;
					} else if (this.movex < this.index * this.sliderWidth && this.index > 0) {
						this.index--;
					}
				}

				// Move and animate the elements.
				this.$refs.holder.classList.add("animate");
				this.$refs.holder.style.transform = "translate3d(-" + this.index * this.sliderWidth + "px, 0, 0)";
			},

			mousedown(e) {
				this.$refs.slider.addEventListener("mousemove", this.mousemove);
				this.$refs.slider.addEventListener("mouseleave", this.mouseleave);
				this.touchstart(e);
			},

			mouseup(e) {
				this.touchend(e);
				this.$refs.slider.removeEventListener("mouseleave", this.mouseleave);
				this.$refs.slider.removeEventListener("mousemove", this.mousemove);
			},

			mousemove(e) {
				this.touchmove(e);
			},

			mouseleave(e) {
				this.touchend(e);
				this.$refs.slider.removeEventListener("mouseleave", this.mouseleave);
				this.$refs.slider.removeEventListener("mousemove", this.mousemove);
			},

			removeAnimate() {
				let animate = document.querySelectorAll(".animate");

				if (animate.length) {
					animate.forEach((el) => {
						el.classList.remove("animate");
					});
				}
			}
		}
	};
</script>

<style lang="scss">
	.animate {
		transition: transform 0.3s ease-out;
	}

	.slider-wrap {
		height: 500px;
		.slider {
			width: 100%;
			height: 100%;
			overflow: hidden;
			&.ms-touch {
				overflow-x: scroll;
				overflow-y: hidden;

				-ms-overflow-style: none;
				/* Hides the scrollbar. */

				-ms-scroll-chaining: none;
				/* Prevents Metro from swiping to the next tab or app. */

				// -ms-scroll-snap-type: mandatory;
				/* Forces a snap scroll behavior on your images. */

				-ms-scroll-snap-points-x: snapInterval(0%, 100%);
				/* Defines the y and x intervals to snap to when scrolling. */
			}
			.holder {
				display: flex;
				max-height: 100%;
				height: 100%;
				overflow-y: hidden;
				.slide-wrapper {
					height: 100%;
					position: relative;
					overflow: hidden;
					.slide {
						height: 100%;
						position: relative;
						&:before {
							content: "";
							position: absolute;
							z-index: 1;
							bottom: 0;
							left: 0;
							width: 100%;
							height: 40%;
							background: linear-gradient(transparent, black);
						}
						img {
							position: absolute;
							width: 100%;
							height: 100%;
							z-index: 0;
						}
					}
					.temp {
						position: absolute;
						z-index: 1;
						color: white;
						font-size: 100px;
						bottom: 15px;
						left: 15px;
						font-family: "Josefin Slab", serif;
						font-weight: 100;
					}
				}
			}
		}
	}
</style>
