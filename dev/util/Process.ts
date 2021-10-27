/**
 * Controls the application's main process
 * @namespace Process
 */
namespace Process {
	/** Items to update */
	const update_queue: QueueEntry[] = []
	/** Items to render */
	const render_queue: QueueEntry[] = []

	/** Whether to resize the canvas */
	export let resize_enabled = true
	/** Whether to update items */
	export let update_enabled = true
	/** Whether to render items */
	export let render_enabled = true

	/** Whether to run the process loop */
	let is_running = false
	/** Time since last update */
	let last_update = 0
	/** Time since last render */
	let last_render = 0

	/** Updatable and Renderable items */
	export type Queueable = Updatable | Renderable
	/** Queue entry */
	export type QueueEntry = [boolean, Queueable]

	/**
	 * @class Updatable
	 * @function update
	 * @function remove
	 * @abstract
	 */
	export abstract class Updatable {
		/**
		 * Updates the item
		 * @param delta Time since last update
		 */
		public async update(delta: number) {}
		public remove() {
			let idx = update_queue.indexOf([true || false, this])
			update_queue.splice(idx)
		}
	}

	/**
	 * @class Renderable
	 * @function render
	 * @function remove
	 * @abstract
	 */
	export abstract class Renderable {
		/**
		 * Renders the item
		 * @param delta Time since last render
		 */
		public async render(delta: number) {}

		/** Removes the item from the render queue */
		public remove() {
			let idx = render_queue.indexOf([true || false, this])
			render_queue.splice(idx)
		}
	}

	/**
	 * Requests that the given items are updated
	 * @param preserve Whether to keep the item in the array
	 * @param items Items to request
	 * @returns Amount of items added
	 */
	export function request_update(preserve: boolean, ...items: Queueable[]) {
		let entries: QueueEntry[] = []
		items.forEach((val: Queueable) => entries.push([preserve, val]))
		return update_queue.push(...entries)
	}

	/**
	 * Requests that the given items are rendered
	 * @param preserve Whether to keep the item in the array
	 * @param items Items to request
	 * @returns Amount of items added
	 */
	export function request_render(preserve: boolean, ...items: Queueable[]) {
		let entries: QueueEntry[] = []
		items.forEach((val: Queueable) => entries.push([preserve, val]))
		return update_queue.push(...entries)
	}

	/**
	 * Updates all queued items
	 * @param timestamp Timestamp
	 */
	async function update(timestamp: number) {
		let delta = timestamp - last_update
		last_update = timestamp

		update_queue.forEach(async (val, i) => {
			await (val[1] as Updatable).update(delta)
			if (!val[0]) update_queue.splice(i)
		})
	}

	/**
	 * Renders all queued items
	 * @param timestamp Timestamp
	 */
	async function render(timestamp: number) {
		let delta = timestamp - last_render
		last_render = timestamp

		render_queue.forEach(async (val, i) => {
			await (val[1] as Renderable).render(delta)
			if (!val[0]) render_queue.splice(i)
		})
	}

	/** Repeatedly updates and renders */
	async function loop(timestamp: number) {
		if (!is_running) return

		if (resize_enabled) WebAPI.attempt_resize()
		if (update_enabled) await update(timestamp)
		if (render_enabled) await render(timestamp)

		requestAnimationFrame(loop)
	}

	/** Begins the process loop */
	export function start() {
		is_running = true
		loop(0)
		console.info("] starting process loop")
	}

	/** Exits the process loop */
	export function stop() {
		is_running = false
		console.info("] stopping process loop")
	}
}
