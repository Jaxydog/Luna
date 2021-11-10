namespace Engine {
	export interface Updatable {
		update(delta: number): Promise<void>
		remove(): void
	}
	export interface QueueItem {
		entry: Updatable
		permanent: boolean
	}

	let queue: QueueItem[] = []

	export function request(entry: Updatable, permanent = false) {
		queue.push({ entry, permanent })
	}
	export function request_all(...items: QueueItem[]) {
		items.forEach((item) => request(item.entry, item.permanent))
	}
	export async function update(delta: number) {
		queue.forEach(async (item, index) => {
			await item.entry.update(delta)
			if (!item.permanent) queue = queue.splice(index, 1)
		})

		let frame = Internals.frame
		Internals.trigger("update", {
			event: "update",
			payload: { frame, delta },
			source: "Luna.Engine.update",
			timestamp: performance.now(),
		})
	}
}
