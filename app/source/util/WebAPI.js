/**
 * Allows for script/webpage information transfer
 * @namespace WebAPI interface
 */
var WebAPI;
(function (WebAPI) {
    /** Sets up the API */
    function init() {
        WebAPI.canvas = document?.querySelector("canvas");
        WebAPI.context = WebAPI.canvas?.getContext("2d");
        if (WebAPI.context)
            WebAPI.context.imageSmoothingEnabled = false;
    }
    WebAPI.init = init;
    /** Resizes the canvas to fit the window */
    function resize_canvas() {
        let { clientWidth: w, clientHeight: h } = document?.documentElement;
        WebAPI.canvas?.setAttribute("width", `${w}px`);
        WebAPI.canvas?.setAttribute("height", `${h}px`);
    }
    WebAPI.resize_canvas = resize_canvas;
    /** Attempts to resize the canvas to fit the window */
    function attempt_resize() {
        let { clientWidth: dw, clientHeight: dh } = document?.documentElement;
        let { width: cw, height: ch } = WebAPI.canvas;
        if (cw !== dw || ch !== dh)
            resize_canvas();
    }
    WebAPI.attempt_resize = attempt_resize;
})(WebAPI || (WebAPI = {}));
