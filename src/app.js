import productList from "./modules/productList";
import productPage from "./modules/productPage";

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
            productList.init(this.productCollection);
        }

        //test for product page and execute
        if (this.productPage) {
            productPage.init(this.productPage);
        }
    }
};

window._CustomProductViewApp = App;

App.init();
