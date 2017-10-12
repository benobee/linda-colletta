import Vue from "vue";
import axios from "axios";

const productList = {
    init(collection) {
        const options = this.getShopOptions(collection);

        const hasCachedData = sessionStorage.getItem("shop-data", true);

        if (hasCachedData === "true") {
            console.log("cached data available");

            const data = JSON.parse(sessionStorage.getItem("shop"));

            //console.log("data fetched from cache");
            this.renderGallery(data, options);
        } else {
            console.log("getting shop data");
            this.getShopData(collection, options);
        }
    },
    getShopOptions(collection) {
        const availableToSell = collection.dataset.prices;

        const tag = collection.dataset.tag;

        const priceMax = collection.dataset.priceMax;

        const priceMin = collection.dataset.priceMin;

        return {
            tag,
            availableToSell,
            priceMax,
            priceMin
        }
    },
    getShopData(collection, options) {
        //get json data via SQS API and Axios
        function getShop(url, params) {
            return axios.get(url, {
                params
            });
        }

        let params = {
            format: "json"
        };

        let url = collection.dataset.collection;

        url = url.replace(/\s{1,10}/g, '').split(",");

        const shop1 = getShop('/' + url[0], params);

        const shop2 = getShop('/' + url[1], params);

        axios.all([shop1, shop2])
            .then(axios.spread((shop1, shop2) => {
                const data = shop1.data.items.concat(shop2.data.items);

                shop1.data.items = data;

                if (shop1.data.items.length > 0) {
                    sessionStorage.setItem("shop-data", true);
                    sessionStorage.setItem("shop", JSON.stringify(shop1.data));
                    this.renderGallery(shop1.data, options);
                }
            }))
            .catch(function(error) {
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
                    console.log('Error', error.message);
                }
                console.log(error.config);
            });
    },
    renderGallery(data, options) {
        //back to top button
        Vue.component('back-to-top', {
            template: `
                <div id="backToTop" class="back-to-top button-wrapper" v-bind:class="{hidden: !isVisible}" v-on:click="scrollTop">
                    <div class="has-background-image"></div>
                </div>
            `,
            data() {
                return {
                    position: {
                        top: 0
                    },
                    isVisible: false
                }
            },
            methods: {
                scrollTop() {
                    window.scroll({
                        top: 0,
                        left: 0,
                        behavior: 'smooth'
                    });
                }
            },
            mounted() {
                Events.on("show-back-to-top-button", (button) => {
                    this.position.top = button.distanceAway;
                    this.isVisible = button.state;
                });
            }
        });

        Vue.component("image-component", {
            template: '<img v-bind:src="src" v-bind:class="{loaded: imageLoaded}"/>',
            data() {
                return {
                    src: "/",
                    loaded: false
                }
            },
            mounted() {
                this.src = this.$el.dataset.src;
                this.$el.onload = this.checkImage();
            },
            methods: {
                checkImage() {
                    this.loaded = true;
                }
            },
            computed: {
                imageLoaded($el) {
                    if (this.loaded) {
                        return true;
                    }
                }
            }
        });

        //render the gallery
        const galleryList = new Vue({
            el: '#app',
            data() {
                let items = this.slimArray(data.items);

                if (options.tag && options.tag.length > 0) {

                    const filters = options.tag.split(",");

                    items = items.filter((item) => {
                        if (item.tags && item.tags.length > 0) {

                            const tags = item.tags.filter((tag) => {
                                const index = filters.indexOf(tag);

                                if (index > -1) {
                                    return true;
                                }
                            });

                            if (tags.length > 0) {
                                return item;
                            }
                        }
                    });
                }

                if (options.priceMax && options.priceMax.length > 0) {
                    items = items.filter(item => item.price <= options.priceMax);
                }

                if (options.priceMin && options.priceMin.length > 0) {
                    items = items.filter(item => item.price >= options.priceMin);
                }

                return {
                    search: {
                        isActive: false,
                        category: "",
                        tag: ""
                    },
                    tags: [],
                    categories: this.categoryTags(items, "category"),
                    items: items,
                    scrollHeight: 0,
                    categoryItems: [],
                    currentItems: [],
                    hash: location.hash,
                    sell: options.availableToSell,
                    options,
                    pagination: {
                        scrollBottom: false,
                        pageLimit: 15,
                        currentIndex: 0
                    },
                    lifecycle: {
                        appLoaded: false
                    }
                };
            },
            filters: {
                formatPrice(price) {
                    price = price / 100;
                    price = price.toFixed(2).toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");

                    return "$" + price;
                }
            },
            computed: {
                scrollClasses() {
                    if (this.scrollHeight < -150) {
                        return "scrolling";
                    }
                },
                currentList() {
                    /* this is the main rendered list outputted to
                    the DOM target area */

                    //clone the array
                    let array = this.items.slice(0);

                    if (this.search.isActive) {
                        //store cloned list of items in category
                        array = array.slice(0).filter(item => item.categories == this.search.category);
                        this.generateTags(array);

                        //filter the array from search criteria
                        array = array.filter(item => item.categories == this.search.category);

                        if (this.search.tag.length > 0) {
                            array = this.tagFilter(array, this.search.tag);
                        }

                    } else {
                        this.tags = [];
                    }

                    //paginate the array                                             
                    array = this.paginate(array);

                    return array;
                },
                canSell() {
                    return this.sell;
                },
                hasTags() {
                    if (this.tags.length > 0) {
                        return "has-tags";
                    }
                },
                appLoaded() {
                    if (this.lifecycle.appLoaded) {
                        return "data-loaded";
                    }
                }
            },
            methods: {
                categoryTags(items, type) {
                    let categoryArray = [];

                    items.forEach((item) => {
                        categoryArray = categoryArray.concat(item.categories);
                    });

                    categoryArray = this.removeDuplicates(categoryArray);

                    return this.filterToObject(categoryArray, type);
                },
                tagFilter(array, filterName) {
                    array = array.filter((item) => {
                        if (item.tags && item.tags.length > 0) {
                            const has = item.tags.filter(tag => tag == filterName);
                            if (has.length) {
                                return item;
                            }
                        }
                    });

                    return array;
                },
                access(url) {

                    if (this.sell == "true") {
                        url = url + "?access=true";
                    }

                    return url;
                },
                menuOpen(e) {
                    e.currentTarget.classList.toggle("menu-open");
                },
                generateUID() {
                    var firstPart = (Math.random() * 46656) | 0;
                    var secondPart = (Math.random() * 46656) | 0;
                    firstPart = ("000" + firstPart.toString(36)).slice(-3);
                    secondPart = ("000" + secondPart.toString(36)).slice(-3);
                    return firstPart + secondPart;
                },
                slugify(value) {
                    return value.toLowerCase().replace(/ /g, "-").replace(/-&-/g, "-").replace(/[^\w-]+/g, '');
                },
                generateTags(array) {
                    //get tags from curent items
                    array = this.parseTags(array);

                    //if tag is active is search make the item active
                    array = array.map((item) => {
                        if (item.tag === this.search.tag) {
                            item.isActive = true;
                        }

                        return item;
                    });

                    //reactive data change to update render logic
                    this.tags = array;
                },
                resetAll() {
                    //reset search
                    this.search.category = [];
                    this.search.tag = "";
                    this.cleanupScrollEvents();

                    //make all categories inactive to allow fo toggle behaviour
                    //tags are always inactive on render
                    this.categories.forEach((item) => {
                        this.$set(item, 'isActive', false);
                    });

                    this.bindScrollEvents();
                },
                slimArray(array) {
                    //get rid of unnecessary data
                    array = array.map((item) => {

                        return {
                            id: item.id,
                            title: item.title,
                            assetUrl: item.assetUrl,
                            categories: item.categories,
                            tags: item.tags,
                            fullUrl: item.fullUrl,
                            items: item.items,
                            price: item.structuredContent.variants[0].price
                        };
                    });

                    return array;
                },
                testArray(item, type) {
                    return item[type] !== undefined && (Array.isArray(item[type]) && item[type].length > 0);
                },
                parseTags(array) {
                    //look for tag arrays in data and concatinate
                    let tags = [];

                    array.forEach((item) => {
                        if (this.testArray(item, "tags")) {
                            tags = tags.concat(item.tags);
                        }
                    });

                    //filter out duplicates
                    tags = this.removeDuplicates(tags);

                    //re-map as object with active state
                    tags = this.filterToObject(tags, "tag");

                    return tags;
                },
                removeDuplicates(array) {
                    return array.filter(function(elem, index, self) {
                        return index == self.indexOf(elem);
                    });
                },
                paginate(array) {
                    //limit the active items list based on page index to allow for
                    //infinite scroll and append
                    array = array.splice(0, this.pagination.currentIndex + this.pagination.pageLimit);

                    return array;
                },
                bindScrollEvents() {
                    window.addEventListener("load", this.executeScrollFunctions);
                    window.addEventListener("scroll", this.executeScrollFunctions);
                },
                cleanupScrollEvents() {
                    window.removeEventListener("load", this.executeScrollFunctions);
                    window.removeEventListener("scroll", this.executeScrollFunctions);
                },
                executeScrollFunctions() {
                    const grid = this.$el.querySelector(".collection.grid.product-list");
                    const height = window.innerHeight;
                    const domRect = grid.getBoundingClientRect();
                    const triggerAmount = height - domRect.bottom;
                    const body = document.body.getBoundingClientRect();
                    this.scrollHeight = body.top;

                    if (domRect.top < -250) {
                        Events.emit("show-back-to-top-button", {
                            state: true,
                            distanceAway: domRect.top
                        });
                    } else {
                        Events.emit("show-back-to-top-button", { state: false });
                    }

                    //show next page of pagination list
                    this.appendItems(triggerAmount);
                },
                appendItems(triggerAmount) {
                    //when the page is scrolled to the bottom of the current items
                    //the next set or page of items will be auto appened to the bottom
                    if (triggerAmount > 0 && !this.pagination.scrollBottom) {
                        this.pagination.scrollBottom = true;
                        let current = this.pagination.currentIndex;
                        this.pagination.currentIndex = current + this.pagination.pageLimit + 1;
                        this.pagination.scrollBottom = false;
                    }
                },
                filterToObject(array, type) {
                    //convert filter to object with id and active props
                    array = array.map((item) => {

                        const filter = {
                            id: this.generateUID(),
                            [type]: item,
                            slug: this.slugify(item),
                            isActive: false
                        };

                        return filter;
                    });

                    return array;
                },
                scrollTop() {
                    let top = 0;

                    if (window.innerWidth > 960) {
                        top = 150;
                    }

                    const params = {
                        top: top,
                        left: 0
                    };

                    if (this.scrollHeight > -1500) {
                        params.behavior = "smooth";
                    }

                    window.scroll(params);
                },
                filterByTag(tag, item) {
                    //tag filters
                    this.scrollTop();
                    this.pagination.currentIndex = 0;

                    if (!item.isActive) {
                        item.isActive = true;
                    } else {
                        item.isActive = false;
                    }

                    const i = this.search.tag.indexOf(tag);

                    if (i === -1) {
                        //toggle between tags
                        this.search.tag = "";
                        this.search.tag = tag;
                    } else {
                        //if item is active toggle off
                        this.search.tag = "";
                    }
                },
                filterByCategory(item) {
                    //category filters
                    this.scrollTop();
                    this.pagination.currentIndex = 0;

                    if (!item.isActive) {
                        this.resetAll();
                        item.isActive = true;
                    } else {
                        item.isActive = false;
                    }

                    if (this.search.category !== item.category) {
                        //toggle between categories
                        this.search.category = item.category;
                        this.search.isActive = true;
                    } else {
                        //toggle off if active
                        this.search.isActive = false;
                        this.search.category = "";
                    }
                }
            },
            mounted() {
                setTimeout(() => {
                    this.lifecycle.appLoaded = true;
                    this.bindScrollEvents();
                }, 600)
            }
        });
    }
};

export default productList;