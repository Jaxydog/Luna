namespace Internals {
	interface EventType<T extends string, P> {
		event: T
		payload: P
		source: string
		timestamp: number
	}
	export interface EventMap {
		start: EventType<
			"start",
			{
				frame: {
					current: number
					last: number
					id: number
				}
			}
		>
		stop: EventType<
			"stop",
			{
				code: number
				frame: {
					current: number
					last: number
					id: number
				}
			}
		>
		update: EventType<
			"update",
			{
				delta: number
				frame: {
					current: number
					last: number
					id: number
				}
			}
		>
		render: EventType<
			"render",
			{
				delta: number
				frame: {
					current: number
					last: number
					id: number
				}
				canvas: HTMLCanvasElement
				ctx: CanvasRenderingContext2D
			}
		>
		error: EventType<
			"error",
			{
				name: string
				reason: string
				stack?: string
			}
		>
	}
	export interface ListenerEntry {
		id: string
		callback: Function
	}

	export let events: Map<keyof EventMap, ListenerEntry[]> = new Map()
	export let frame = { current: 0, last: 0, id: 0 }
	export let fps = { dynamic: [] as number[], overall: [] as number[] }

	export function gen_id() {
		let nums = crypto.getRandomValues(new Uint16Array(4))
		let strs: string[] = []
		for (const num of nums) strs.push(`${num}`.padStart(5, "0"))
		return strs.join("-")
	}
	export function on<K extends keyof EventMap>(event: K, callback: (event: EventMap[K]) => any) {
		let arr = events.get(event) ?? []
		let entry = { id: gen_id(), callback } as ListenerEntry
		events.set(event, [...arr, entry])
	}
	export function remove(event: keyof EventMap, id: string) {
		let arr = events.get(event)
		if (!arr) return
		arr = arr.splice(arr.findIndex((entry) => entry.id === id))
		events.set(event, arr)
	}
	export function trigger<K extends keyof EventMap>(event: K, payload: EventMap[K]) {
		if (!events.has(event)) return

		for (const entry of events.get(event)!) {
			entry.callback(payload)
		}
	}
	export function error(source: string, name: string, reason: string, stack?: string) {
		let err = new Error()
		;(err.name = name), (err.message = reason), (err.stack = stack)

		trigger("error", {
			event: "error",
			payload: { name, reason, stack },
			source,
			timestamp: performance.now(),
		})

		throw err
	}
}
