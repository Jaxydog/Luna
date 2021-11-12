namespace Internals {
	export interface EventType<T extends string, P> {
		name: T
		payload: P
		source: string
		timestamp: number
	}
	export interface EventMap {
		start: EventType<"start", { frame: typeof frame }>
		stop: EventType<"stop", { code: number; frame: typeof frame; fps: typeof fps }>
		update: EventType<"update", { delta: number; frame: typeof frame }>
		render: EventType<"render", { delta: number; frame: typeof frame; canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }>
		error: EventType<"error", { name: string; reason: string; stack?: string }>
	}
	export interface ListenerEntry {
		id: string
		callback: Function
	}
	export interface LifetimeMap {
		permanent: {}
		once: {}
		frames: { duration: number }
	}
	export interface Lifetime<T extends keyof LifetimeMap> {
		type: T
		lifetime: LifetimeMap[T]
	}
	export interface QueueType<L extends keyof LifetimeMap, C> extends Lifetime<L> {
		entry: C
	}
	export interface QueueMap {
		engine: QueueType<keyof LifetimeMap, Engine.Updatable>
		display: QueueType<keyof LifetimeMap, Display.Renderable>
	}
	export type GenericQueueType = QueueType<keyof Internals.LifetimeMap, any>

	export let frame = { current: 0, last: 0, id: 0 }
	export let fps = { dynamic: [] as number[], overall: [] as number[] }
	export let events: Map<keyof EventMap, ListenerEntry[]> = new Map()
	export let queue_list = {
		engine: [] as QueueMap["engine"][],
		display: [] as QueueMap["display"][],
	}

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
		return entry.id
	}
	export function remove(event: keyof EventMap, id: string) {
		let arr = events.get(event)
		if (!arr) return true
		arr = arr.splice(arr.findIndex((entry) => entry.id === id))
		events.set(event, arr)
		return false
	}
	export function trigger<K extends keyof EventMap>(event: K, payload: EventMap[K]) {
		if (!events.has(event)) return

		for (const entry of events.get(event)!) {
			entry.callback(payload)
		}
	}
	export function gen_lifetime<T extends keyof LifetimeMap>(type: T, args: LifetimeMap[T]) {
		return { type, lifetime: args } as Lifetime<T>
	}
	export function error(source: string, name: string, reason: string, stack?: string) {
		let err = new Error()
		;(err.name = name), (err.message = reason), (err.stack = stack)

		trigger("error", {
			name: "error",
			payload: { name, reason, stack },
			source,
			timestamp: performance.now(),
		})

		throw err
	}
}
