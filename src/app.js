import productListController from "./modules/productListController";
import productPageController from "./modules/productPageController";

const App = {
    init() {
        this.cacheDOM();
        this.execute();
    },
    cacheDOM() {
        this.productCollection = document.querySelector(".app.has-custom-shop");
        this.productPage = document.querySelector(".collection-type-products.view-item");
    },
    execute() {
        //test for product collection and execute vue instance
        if (this.productCollection) {
            productListController.init(this.productCollection);
        }

        //test for product page and execute
        if (this.productPage) {
            productPageController.init(this.productPage);
        }
    }
};

window._CustomProductViewApp = App;

App.init();
