const backToTopButton = {
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
};

export default backToTopButton;