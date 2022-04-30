import * as utils from "@/components/utils";

export const showToast = (_state, message) => {
	if (!message) return;

	if (typeof message === "object") {
		return utils.showToast(message.message, message.variant);
	}

	return utils.showToast(message);
};

export const setSuccess = (_state, message) => utils.showToast(message);

export const setErrors = (state, { message, errors }) => {
	state.errors = errors;
	if (message) utils.showToast(message, "danger");
};

export const setError = (_state, message) => utils.showToast(message, "danger");

export const setSidebar = (state, value) => (state.sidebarOpen = value);

export const showMessage = (_, options) => utils.showMessage(options);
