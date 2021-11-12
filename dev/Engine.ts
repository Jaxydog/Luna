namespace Engine {
	export interface Updatable {
		update(delta: number): Promise<void>
		remove(): void
	}
	export type QueueItem = Internals.QueueMap["engine"]

	export function request(entry: QueueItem) {
		Internals.queue_list.engine.push(entry)
	}
	export function request_all(...items: QueueItem[]) {
		items.forEach(request)
	}
	export function remove(entry: Updatable) {
		let index = Internals.queue_list.engine.findIndex((item) => item.entry === entry)
		Internals.queue_list.engine.splice(index, 1)
	}
	export function get_queue() {
		return Array.from(Internals.queue_list.engine)
	}
	export function clear() {
		Internals.queue_list.engine = []
	}
	export async function update(delta: number) {
		Internals.queue_list.engine.forEach(async (item, index) => {
			await item.entry.update(delta)

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

		Internals.trigger("update", {
			name: "update",
			payload: { frame: Internals.frame, delta },
			source: "Luna.Engine.update",
			timestamp: performance.now(),
		})
	}
}
