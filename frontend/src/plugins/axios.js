import axios from "axios";

import jsCookie from "js-cookie";

function axiosHandler() {
	const axiosInstance = axios.create({
		baseURL: process.env.VUE_APP_BASE_URL,
		headers: {
			"Content-Type": "application/json",
			Authorization: "Bearer " + jsCookie.get("token")
		}
	});

	axiosInstance.interceptors.response.use(
		function (response) {
			return { ...response.data, status: response.status };
		},
		function (error) {
			return Promise.reject({ ...error.response.data, status: error.response.status });
		}
	);

	return axiosInstance;
}

const AxiosHandler = new Object();

AxiosHandler.get =  (...args) => axiosHandler().get(...args);

AxiosHandler.post =  (...args) => axiosHandler().post(...args);

AxiosHandler.put =  (...args) => axiosHandler().put(...args);

AxiosHandler.delete =  (...args) => axiosHandler().delete(...args);

export default AxiosHandler;
