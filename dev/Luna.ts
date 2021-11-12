namespace Luna {
	export let dev = {
		enabled: true,
		runtime: 10,
		logging: true,
		onlyavg: true,
		vsyncon: false,
		max_fps: 1000,
	}

	export async function request_process_tick() {
		if (dev.vsyncon) {
			Internals.frame.id = requestAnimationFrame(process)
		} else {
			// this 0ms delay acts as a buffer to stop the thread from halting
			await new Promise((res) => setTimeout(res, 0))
			process(performance.now())
		}
	}
	export function add_interval(interval: number) {
		Internals.fps.overall.push(interval)
		if (dev.onlyavg) return
		Internals.fps.dynamic.push(interval)
	}
	export function print_frames(type: keyof typeof Internals.fps = "dynamic") {
		let arr = Internals.fps[type]
		if (arr.length === 0) return
		let sum = arr.reduce((p, c) => p + c)
		let avg = sum / arr.length
		console.log(`${+(1000 / avg).toFixed(3)}fps`, `${+avg.toFixed(3)}ms`)
	}
	export function test() {
		let test = {
			scale: 1000,
			run: { current: 0, max: 10 },
			iter: { current: 0, max: 100 },
			result: [] as number[][],
		}

		let id = Internals.on("stop", (event) => {
			if (++test.iter.current > test.iter.max) {
				if (++test.run.current <= test.run.max) {
					test.iter.current = 0
				} else {
					Internals.remove("stop", id)
					console.log(test.result)
					return
				}
			}

			let num = test.scale * test.iter.current
			let arr = new Array(num).fill(
				new Entity(
					new Vector(test.iter.current, test.run.current),
					Internals.gen_lifetime("permanent", {}),
					new CollisionBox(null, new Vector(Math.random(), Math.random()))
				)
			)

			Engine.request_all(...arr)
			Display.request_all(...arr)

			let sum = event.payload.fps.overall.reduce((p, c) => p + c)
			let avg = sum / event.payload.fps.overall.length
			let fps = `${+(1000 / avg).toFixed(3)}fps`
			let ms = `${+avg.toFixed(3)}ms`

			// console.log(test.run.current, test.iter.current - 1, num - 100, fps, ms)
			test.result.push(event.payload.fps.overall)
			Luna.start()
		})

		Luna.start()
	}
	export function start() {
		request_process_tick()

		Internals.trigger("start", {
			name: "start",
			payload: { frame: Internals.frame },
			source: "Luna.start",
			timestamp: performance.now(),
		})
	}
	export function stop(code = 0) {
		if (dev.vsyncon) cancelAnimationFrame(Internals.frame.id)
		print_frames("overall")

		Internals.trigger("stop", {
			name: "stop",
			payload: { code, frame: Internals.frame, fps: Internals.fps },
			source: "Luna.stop",
			timestamp: performance.now(),
		})

		Engine.clear()
		Display.clear()
		Internals.fps = { dynamic: [], overall: [] }
		Internals.frame = { current: 0, last: 0, id: 0 }
	}
	export async function process(timestamp: number) {
		let delta = timestamp - Internals.frame.last

		if (dev.logging) {
			if (Internals.frame.last !== 0) add_interval(delta)
			if (!dev.onlyavg && Internals.fps.dynamic.length >= 10) {
				print_frames()
				Internals.fps.dynamic = []
			}
		}

		Internals.frame.last = timestamp
		Internals.frame.current++

		await Engine.update(delta)
		await Display.render(delta)

		if (dev.enabled && Internals.frame.current >= dev.runtime) stop(-1)
		else await request_process_tick()
	}
}
