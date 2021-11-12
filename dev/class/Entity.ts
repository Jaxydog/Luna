class Entity implements Engine.Updatable, Display.Renderable {
	public entry: Internals.QueueType<keyof Internals.LifetimeMap, Entity>

	constructor(public pos: Vector, lifetime: Internals.Lifetime<keyof Internals.LifetimeMap>, collision: CollisionBox) {
		this.entry = {
			entry: this,
			type: lifetime.type,
			lifetime: lifetime.lifetime,
		}
	}

	public async update(delta: number) {
		let t = delta ** (this.pos.x + Math.random() + 2)
	}
	public async render(delta: number) {
		let t = delta ** (this.pos.y + Math.random() + 2)
	}
	public remove() {
		Engine.remove(this)
		Display.remove(this)
	}
	public to_string() {
		return JSON.stringify(this)
	}
}
