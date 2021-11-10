namespace Display {
	export interface Renderable {
		render(delta: number): Promise<void>
		remove(): void
	}
	export interface QueueItem {
		entry: Renderable
		permanent: boolean
	}

	let canvas = document.querySelector("canvas")
	let ctx = canvas.getContext("2d")
	let queue: QueueItem[] = []

	export function request(entry: Renderable, permanent = false) {
		queue.push({ entry, permanent })
	}
	export function request_all(...items: QueueItem[]) {
		items.forEach((item) => request(item.entry, item.permanent))
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
		queue.forEach(async (item, index) => {
			await item.entry.render(delta)
			if (!item.permanent) queue = queue.splice(index, 1)
		})
		ctx.closePath()

		let frame = Internals.frame
		Internals.trigger("render", {
			event: "render",
			payload: { canvas, ctx, delta, frame },
			source: "Luna.Display.render",
			timestamp: performance.now(),
		})
	}
}
