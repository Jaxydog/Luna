/**
 * Allows for script/webpage information transfer
 * @namespace WebAPI interface
 */
namespace WebAPI {
	/** Canvas element */
	export let canvas: HTMLCanvasElement
	/** Image rendering context */
	export let context: RenderingContext

	/** Sets up the API */
	export function init() {
		canvas = document?.querySelector("canvas")
		context = canvas?.getContext("2d")
		if (context) context.imageSmoothingEnabled = false
	}

	/** Resizes the canvas to fit the window */
	export function resize_canvas() {
		let { clientWidth: w, clientHeight: h } = document?.documentElement
		canvas?.setAttribute("width", `${w}px`)
		canvas?.setAttribute("height", `${h}px`)
	}

	/** Attempts to resize the canvas to fit the window */
	export function attempt_resize() {
		let { clientWidth: dw, clientHeight: dh } = document?.documentElement
		let { width: cw, height: ch } = canvas
		if (cw !== dw || ch !== dh) resize_canvas()
	}
}
