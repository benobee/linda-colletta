const productListImage = {
    template: '<img v-bind:src="src" v-bind:class="{loaded: imageLoaded}"/>',
    data() {
        return {
            src: "/",
            loaded: false
        }
    },
    computed: {
        imageLoaded($el) {
            if (this.loaded) {
                return true;
            }
        }
    },
    methods: {
        checkImage() {
            this.loaded = true;
        }
    },
    mounted() {
        this.src = this.$el.dataset.src;
        this.$el.onload = this.checkImage();
    }
};

export default productListImage;