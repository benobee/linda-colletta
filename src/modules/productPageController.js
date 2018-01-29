import Vue from "vue";
import Events from "./events";
import axios from "axios";

const productPageController = {
    init (productPage) {
        this.cacheDOM(productPage);

        if (this.testAccess()) {
            this.productDetails.classList.add("price-visible");
        } else {
            this.productDetails.classList.add("price-hidden");
        }

        axios.get(location.pathname, {
            headers: {
                "Cache-Control": "no-cache, no-store, must-revalidate"
            },
            params: {
                format: "json",
                nocache: true
            }
        }).then((response) => {
            this.pageData = response.data;
            this.buildTargetElements();
            this.buildComponents();
        });
    },
    cacheDOM (parent) {
        this.productDetails = parent.querySelector(".ProductItem-summary");
    },
    testAccess () {
        let search = location.search;

        const params = {};

        search = search.substring(1, search.length).split("&");
        search = search.forEach((item) => {
            item = item.split("=");
            params[ item[ 0 ] ] = item[ 1 ];
        });

        if (params.access === "true" || sessionStorage.getItem("access") === "true") {
            search = true;
        }

        return search;
    },
    buildTargetElements () {
        //button inject point
        this.button = document.createElement("div");
        this.button.setAttribute("class", "button-enquiry-trigger-form");
        this.button.innerHTML = "<enquiry-button></enquiry-button>";

        const targets = document.querySelectorAll(".ProductItem-details");

        targets.forEach((item) => {
            item.appendChild(this.button);
            this.button.classList.add("ready");
        });

        //modal inect point
        this.modal = document.createElement("div");
        this.modal.setAttribute("id", "modal-enquiry-form");
        this.modal.innerHTML = "<modal></modal>";

        const targetRender = document.querySelector(".Site");

        targetRender.appendChild(this.modal);
    },
    buildComponents () {
        Vue.component("modal", {
            template: `
                <div class="modal-wrapper" v-bind:class="{hidden: !isVisible}" v-on:click="toggleActive">
                  <div class="modal-content" v-on:click="stopProp">
                      <div v-on:click="toggleActive" class="close">✕</div>
                      <div class="modal-form"></div>
                  </div>
                </div>
            `,
            data () {
                return {
                    isVisible: false,
                    message: "I am enquiring about: "
                };
            },
            methods: {
                toggleActive () {
                    this.isVisible = !this.isVisible;
                },
                stopProp (e) {
                    e.stopPropagation();
                },
                injectFormData () {
                    const form = document.querySelector("#footerBlocksTop .sqs-block-form");

                    const inject = document.querySelector(".modal-form");

                    inject.appendChild(form);

                    //enter the title into the message form
                    const subject = document.getElementById("text-yui_3_17_2_49_1506560555564_6186-field");

                    const title = document.querySelector(".ProductItem-details-title").innerText;

                    const message = document.getElementById("textarea-yui_3_17_2_49_1506560555564_6187-field");

                    subject.value = title;
                    message.value = this.message + title;
                }
            },
            beforeMount () {
                //button inject point
                this.button = document.createElement("div");
                this.button.setAttribute("class", "button-enquiry-trigger-form");
                this.button.innerHTML = "<enquiry-button></enquiry-button>";

                const targets = document.querySelectorAll(".ProductItem-details");

                targets.forEach((item) => {
                    item.appendChild(this.button);
                    this.button.classList.add("ready");
                });
            },
            mounted () {
                this.injectFormData();
                Events.on("buttonClick", () => {
                    this.isVisible = true;
                });
            }
        });

        const modal = new Vue({
            el: "#modal-enquiry-form"
        });

        let stock = 0;

        if (this.pageData.item.structuredContent) {
            stock = this.pageData.item.structuredContent.variants[ 0 ].qtyInStock;
        }

        Vue.component("enquiry-button", {
            template: `
                <div v-on:click="showForm" class="button-wrapper" v-bind:class="classObject">
                    <div class="button" v-if="stock !== 0">{{ forSaleText }}</div>
                    <div class="button" v-else>{{ notForSaleText }}</div>
                </div>
            `,
            data () {
                return {
                    forSaleText: "Enquire",
                    notForSaleText: "Sold",
                    stock,
                    isSold: false
                };
            },
            computed: {
                classObject () {
                    if (this.stock === 0) {
                        this.isSold = true;
                    }

                    return {
                        disabled: this.isSold
                    };
                }
            },
            methods: {
                showForm () {
                    Events.emit("buttonClick");
                }
            }
        });

        const button = new Vue({
            el: ".ProductItem-details .button-enquiry-trigger-form"
        });

        return {
            button,
            modal
        };
    },
};

export default productPageController;