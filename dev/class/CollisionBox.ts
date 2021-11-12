/**
 * @class Collision box
 * @property Size
 */
class CollisionBox {
	constructor(private parent: Entity, public size: Vector) {}

	public copy() {
		return new CollisionBox(this.parent, this.size)
	}
	public to_string() {
		return JSON.stringify(this)
	}
}
