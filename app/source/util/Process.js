/**
 * Controls the application's main process
 * @namespace Process
 */
var Process;
(function (Process) {
    /** Items to update */
    const update_queue = [];
    /** Items to render */
    const render_queue = [];
    /** Whether to resize the canvas */
    Process.resize_enabled = true;
    /** Whether to update items */
    Process.update_enabled = true;
    /** Whether to render items */
    Process.render_enabled = true;
    /** Whether to run the process loop */
    let is_running = false;
    /** Time since last update */
    let last_update = 0;
    /** Time since last render */
    let last_render = 0;
    /**
     * @class Updatable
     * @function update
     * @function remove
     * @abstract
     */
    class Updatable {
        /**
         * Updates the item
         * @param delta Time since last update
         */
        async update(delta) { }
        remove() {
            let idx = update_queue.indexOf([true || false, this]);
            update_queue.splice(idx);
        }
    }
    Process.Updatable = Updatable;
    /**
     * @class Renderable
     * @function render
     * @function remove
     * @abstract
     */
    class Renderable {
        /**
         * Renders the item
         * @param delta Time since last render
         */
        async render(delta) { }
        /** Removes the item from the render queue */
        remove() {
            let idx = render_queue.indexOf([true || false, this]);
            render_queue.splice(idx);
        }
    }
    Process.Renderable = Renderable;
    /**
     * Requests that the given items are updated
     * @param preserve Whether to keep the item in the array
     * @param items Items to request
     * @returns Amount of items added
     */
    function request_update(preserve, ...items) {
        let entries = [];
        items.forEach((val) => entries.push([preserve, val]));
        return update_queue.push(...entries);
    }
    Process.request_update = request_update;
    /**
     * Requests that the given items are rendered
     * @param preserve Whether to keep the item in the array
     * @param items Items to request
     * @returns Amount of items added
     */
    function request_render(preserve, ...items) {
        let entries = [];
        items.forEach((val) => entries.push([preserve, val]));
        return update_queue.push(...entries);
    }
    Process.request_render = request_render;
    /**
     * Updates all queued items
     * @param timestamp Timestamp
     */
    async function update(timestamp) {
        let delta = timestamp - last_update;
        last_update = timestamp;
        update_queue.forEach(async (val, i) => {
            await val[1].update(delta);
            if (!val[0])
                update_queue.splice(i);
        });
    }
    /**
     * Renders all queued items
     * @param timestamp Timestamp
     */
    async function render(timestamp) {
        let delta = timestamp - last_render;
        last_render = timestamp;
        render_queue.forEach(async (val, i) => {
            await val[1].render(delta);
            if (!val[0])
                render_queue.splice(i);
        });
    }
    /** Repeatedly updates and renders */
    async function loop(timestamp) {
        if (!is_running)
            return;
        if (Process.resize_enabled)
            WebAPI.attempt_resize();
        if (Process.update_enabled)
            await update(timestamp);
        if (Process.render_enabled)
            await render(timestamp);
        requestAnimationFrame(loop);
    }
    /** Begins the process loop */
    function start() {
        is_running = true;
        loop(0);
        console.info("] starting process loop");
    }
    Process.start = start;
    /** Exits the process loop */
    function stop() {
        is_running = false;
        console.info("] stopping process loop");
    }
    Process.stop = stop;
})(Process || (Process = {}));
