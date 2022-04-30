import { BToast } from "bootstrap-vue";
// import Vue from "vue";

export const showToast = (message, variant = "success") => {
	let bootStrapToaster = new BToast();

	bootStrapToaster.$bvToast.toast(message, {
		title: message,
		toaster: "b-toaster-top-right",
		solid: true,
		appendToast: false,
		bodyClass: "d-none",
		variant
	});
};

import CheckCircleIcon from "@/components/icons/checkCircleOutline";

import CloseCircleIcon from "@/components/icons/closeCircleOutline";

import i18n from "@/plugins/i18n";

let $t = (name) => i18n.messages[i18n.locale].messages[name];

export const showMessage = (options = { error: false }) => {
	let { error, message } = options;

	message = message || (error ? $t("wrong") : $t("saved"));

	let icon = error ? CloseCircleIcon : CheckCircleIcon;

	let bootStrapToaster = new BToast();

	const h = bootStrapToaster.$createElement;

	const vNodesTitle = h("div", { class: ["d-flex", "align-items-center"] }, [h(icon, { class: "mr-2" }), h("strong", message)]);

	bootStrapToaster.$bvToast.toast([], { title: [vNodesTitle], headerClass: "py-3 pl-4", bodyClass: "d-none", toaster: "b-toaster-bottom-right" });
};
