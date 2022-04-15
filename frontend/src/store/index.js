import Vue from "vue";
import Vuex from "vuex";

import modules from "./modules";
import global from "./global";

Vue.use(Vuex);

export default new Vuex.Store({ ...global, modules: { ...modules } });
