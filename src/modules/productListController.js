import Vue from "vue";
import axios from "axios";
import { productList, productListImage, backToTopButton } from "../components/index";
/*import JSONdata from "./data.json";*/

const productListController = {
    init (collection) {
        const options = this.getShopOptions(collection);

        this.getShopData(collection, options);
        //this.renderGallery(JSONdata, options);
    },
    getShopOptions (collection) {
        const availableToSell = collection.dataset.prices;

        const tag = collection.dataset.tag;

        const priceMax = collection.dataset.priceMax;

        const priceMin = collection.dataset.priceMin;

        return {
            tag,
            availableToSell,
            priceMax,
            priceMin
        };
    },
    getShopData (collection, options) {
        //get json data via SQS API and Axios
        const config = {
            headers: {
                "Cache-Control": "no-cache, no-store, must-revalidate"
            },
            params: {
                format: "json",
                nocache: true
            }
        };

        const getShop = (url) => {
            return axios.get(url, config);
        };

        let url = collection.dataset.collection;

        url = url.replace(/\s{1,10}/g, "").split(",");

        const shopOne = getShop(`/${ url[ 0 ]}`);

        const shopTwo = getShop(`/${ url[ 1 ]}`);

        axios.all([shopOne, shopTwo])
            .then(axios.spread((responseOne, responseTwo) => {
                const data = responseOne.data.items.concat(responseTwo.data.items);

                responseOne.data.items = data;

                if (responseOne.data.items.length > 0) {
                    sessionStorage.setItem("shop-data", true);
                    sessionStorage.setItem("shop", JSON.stringify(responseOne.data));
                    this.renderGallery(responseOne.data, options);
                }
            }))
            .catch((error) => {
                if (error.response) {
                    // The request was made and the server responded with a status code 
                    // that falls out of the range of 2xx 
                    console.log(error.response.data);
                    console.log(error.response.status);
                    console.log(error.response.headers);
                } else if (error.request) {
                    // The request was made but no response was received 
                    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of 
                    // http.ClientRequest in node.js 
                    console.log(error.request);
                } else {
                    // Something happened in setting up the request that triggered an Error 
                    console.log("Error", error.message);
                }
                console.log(error.config);
            });
    },
    renderGallery (data, options) {
        //extend components
        Vue.component("back-to-top", backToTopButton);
        Vue.component("image-component", productListImage);

        //render the gallery
        const galleryList = new Vue(productList(data, options));

        return {
            galleryList
        };
    }
};

export default productListController;