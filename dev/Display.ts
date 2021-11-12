namespace Display {
	export interface Renderable {
		render(delta: number): Promise<void>
		remove(): void
	}
	export type QueueItem = Internals.QueueMap["display"]

	let canvas = document.querySelector("canvas")
	let ctx = canvas.getContext("2d")

	export function request(entry: QueueItem) {
		Internals.queue_list.display.push(entry)
	}
	export function request_all(...items: QueueItem[]) {
		items.forEach(request)
	}
	export function remove(entry: Renderable) {
		let index = Internals.queue_list.display.findIndex((item) => item.entry === entry)
		Internals.queue_list.display.splice(index, 1)
	}
	export function get_queue() {
		return Array.from(Internals.queue_list.display)
	}
	export function clear() {
		Internals.queue_list.display = []
	}
	export function init() {
		if (!canvas) Internals.error("Luna.Display.init", "Unable to initialize", "Missing canvas element")
		if (!ctx) Internals.error("Luna.Display.init", "Unable to initialize", "Missing image rendering context")
		ctx.imageSmoothingEnabled = false
	}
	export function autofit() {
		let { clientWidth: w, clientHeight: h } = document.documentElement
		canvas.setAttribute("width", `${w}px`)
		canvas.setAttribute("height", `${h}px`)
	}
	export async function render(delta: number) {
		let { clientWidth: dw, clientHeight: dh } = document?.documentElement
		let { width: cw, height: ch } = canvas
		if (cw !== dw || ch !== dh) autofit()

		ctx.beginPath()
		ctx.clearRect(0, 0, canvas.width, canvas.height)
		Internals.queue_list.display.forEach(async (item, index) => {
			await item.entry.render(delta)
			switch (item.type) {
				case "permanent":
					break
				case "once": {
					remove(item.entry)
					break
				}
				case "frames": {
					if (--(item.lifetime as Internals.LifetimeMap["frames"]).duration <= 0) remove(item.entry)
					break
				}
			}
		})
		ctx.closePath()

		Internals.trigger("render", {
			name: "render",
			payload: { canvas, ctx, delta, frame: Internals.frame },
			source: "Luna.Display.render",
			timestamp: performance.now(),
		})
	}
}
