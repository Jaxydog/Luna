namespace Luna {
	export function add_interval(interval: number) {
		Internals.fps.dynamic.push(interval)
		Internals.fps.overall.push(interval)
	}
	export function print_frames(type: "dynamic" | "overall" = "dynamic") {
		let arr = type === "dynamic" ? Internals.fps.dynamic : Internals.fps.overall
		if (arr.length === 0) return
		let sum = arr.reduce((p, c) => p + c)
		let avg = sum / arr.length
		console.log(`${+(1000 / avg).toFixed(3)}fps`, `${+avg.toFixed(3)}ms`)
	}
	export function start() {
		Internals.fps = { dynamic: [], overall: [] }
		Internals.frame = { current: 0, last: 0, id: requestAnimationFrame(process) }

		let frame = Internals.frame
		Internals.trigger("start", {
			event: "start",
			payload: { frame },
			source: "Luna.start",
			timestamp: performance.now(),
		})
	}
	export function stop(code = 0) {
		cancelAnimationFrame(Internals.frame.id)
		print_frames("overall")

		let frame = Internals.frame
		Internals.trigger("stop", {
			event: "stop",
			payload: { code, frame },
			source: "Luna.stop",
			timestamp: performance.now(),
		})
	}
	export async function process(timestamp: number) {
		let delta = timestamp - Internals.frame.last
		if (Internals.frame.last !== 0) add_interval(delta)
		Internals.frame.last = timestamp

		await Engine.update(delta)
		await Display.render(delta)

		if (Internals.fps.dynamic.length >= 10) {
			print_frames()
			Internals.fps.dynamic = []
		}

		Internals.frame.id = requestAnimationFrame(process)
	}
}
