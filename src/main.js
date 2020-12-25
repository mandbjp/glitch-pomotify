import Vue from "vue";
import App from "./components/App.vue";
import normalize from "normalize.css";

var app = new Vue({
  template: "<app></app>",
  components: {
    App
  },
  el: "#app"
});
