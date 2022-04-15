import axios from "axios";

const axiosInstance = axios.create({
	baseURL: process.env.VUE_APP_BASE_URL,
	headers: {
		"Content-Type": "application/json",
		Authorization: "Bearer " + sessionStorage.getItem("token")
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

export default axiosInstance;
