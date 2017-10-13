import Vue from "vue";
import Events from "./events";

const productPageController = {
    init(productPage) {
        this.cacheDOM(productPage);

        if (this.testAccess()) {
            this.productDetails.classList.add("price-visible");
        } else {
            this.productDetails.classList.add("price-hidden");
        }

        this.buildTargetElements();
        this.buildComponents();
    },
    cacheDOM(parent) {
        this.productDetails = parent.querySelector(".ProductItem-summary");
    },
    testAccess() {
        let search = location.search;

        let params = {};

        let access = false;

        search = search.substring(1, search.length).split("&");
        search = search.forEach((item) => {
            item = item.split("=");
            params[item[0]] = item[1];
        });

        if (params.access === "true" || sessionStorage.getItem("access") === "true") {
            access = true;
        }

        return access;
    },
    buildTargetElements() {
        //button inject point
        this.button = document.createElement("div");
        this.button.setAttribute("class", "button-enquiry-trigger-form");
        this.button.innerHTML = '<enquiry-button></enquiry-button>';

        const targets = document.querySelectorAll(".ProductItem-details");

        targets.forEach((item) => {
            item.appendChild(this.button);
            this.button.classList.add("ready");
        });

        //modal inect point
        this.modal = document.createElement("div");
        this.modal.setAttribute("id", "modal-enquiry-form");
        this.modal.innerHTML = '<modal></modal>';

        const targetRender = document.querySelector(".Site");

        targetRender.appendChild(this.modal);
    },
    buildComponents() {
        Vue.component('modal', {
            template: `
                <div class="modal-wrapper" v-bind:class="{hidden: !isVisible}" v-on:click="toggleActive">
                  <div class="modal-content" v-on:click="stopProp">
                      <div v-on:click="toggleActive" class="close">✕</div>
                      <div class="modal-form"></div>
                  </div>
                </div>
            `,
            data() {
                return {
                    isVisible: false,
                    message: "I am enquiring about: "
                }
            },
            methods: {
                toggleActive() {
                    this.isVisible = !this.isVisible;
                },
                stopProp(e) {
                    e.stopPropagation();
                },
                injectFormData() {
                    const form = document.querySelector("#footerBlocksTop .sqs-block-form");

                    const inject = document.querySelector(".modal-form");

                    inject.appendChild(form);

                    //enter the title into the message form
                    const subject = document.getElementById('text-yui_3_17_2_49_1506560555564_6186-field');

                    const title = document.querySelector(".ProductItem-details-title").innerText;
                    
                    const message = document.getElementById('textarea-yui_3_17_2_49_1506560555564_6187-field');

                    subject.value = title;
                    message.value = this.message + title;
                }
            },
            beforeMount() {
                //button inject point
                this.button = document.createElement("div");
                this.button.setAttribute("class", "button-enquiry-trigger-form");
                this.button.innerHTML = '<enquiry-button></enquiry-button>';

                const targets = document.querySelectorAll(".ProductItem-details");

                targets.forEach((item) => {
                    item.appendChild(this.button);
                    this.button.classList.add("ready");
                });
            },
            mounted() {
                this.injectFormData();
                Events.on("buttonClick", () => {
                    this.isVisible = true;
                });
            }
        });

        const modal = new Vue({
            el: '#modal-enquiry-form'
        });

        Vue.component('enquiry-button', {
            template: `
                <div v-on:click="showForm" class="button-wrapper">
                    <div class="button">{{ text }}</div>
                </div>
            `,
            data() {
                return {
                    text: "Enquire"
                }
            },
            methods: {
                showForm() {
                    Events.emit("buttonClick");
                }
            }
        });

        const button = new Vue({
            el: '.ProductItem-details .button-enquiry-trigger-form'
        });
    },
};

export default productPageController;