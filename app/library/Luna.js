var Luna;
(function (Luna) {
    /** Whether the engine is currently running */
    Luna.running = false;
    /** Engine configuration */
    Luna.settings = {
        /** Whether to log current FPS */
        logfps: true,
        /** Inverval between fps logs */
        loginterval: 10,
        /** Whether to log the average FPS on stop */
        logavg: true,
        /** Whether to enable vsync */
        vsync: false,
    };
    /** Handles internal events */
    let Event;
    (function (Event) {
        /** Map of all event listeners */
        Event.events = new Map();
        /**
         * Adds an event listener
         * @param event Event name
         * @param callback Listener callback function
         * @returns Listener ID
         */
        function on(event, callback) {
            let arr = Event.events.get(event) ?? [];
            let entry = { id: Internals.gen_id(), callback };
            Event.events.set(event, [...arr, entry]);
            return entry.id;
        }
        Event.on = on;
        /**
         * Removes an event listener
         * @param event Event name
         * @param id Listener ID
         * @returns Whether the listener was removed
         */
        function remove(event, id) {
            let arr = Event.events.get(event);
            if (!arr)
                return false;
            arr = arr.splice(arr.findIndex((entry) => entry.id === id));
            Event.events.set(event, arr);
            return true;
        }
        Event.remove = remove;
        /**
         * Triggers an event
         * @param event Event name
         * @param payload Event payload
         */
        function trigger(event, payload) {
            if (!Event.events.has(event))
                return;
            Event.events.get(event).forEach((entry) => entry.callback(payload));
        }
        Event.trigger = trigger;
    })(Event = Luna.Event || (Luna.Event = {}));
    /** Program internals */
    let Internals;
    (function (Internals) {
        /** Defines a queue object */
        class Queue {
            /** Contents of the queue */
            contents = new Map();
            /**
             * Adds an item to the queue
             * @param entry Item to add
             * @param id ID of the item
             * @returns Item ID
             */
            request(entry, id) {
                id ??= Internals.gen_id();
                this.contents.set(id, entry);
                return id;
            }
            /**
             * Removes an item from the queue
             * @param id ID of the item
             * @returns Whether the item was removed
             */
            remove(id) {
                return this.contents.delete(id);
            }
            /** Clears the queue */
            clear() {
                this.contents.clear();
            }
            /** Returns an array of the entries */
            array() {
                return Array.of(...this.contents.values());
            }
        }
        Internals.Queue = Queue;
        /** Stores frame information */
        Internals.frame = {
            /** Current frame number */
            current: 0,
            /** Timestamp of last frame */
            last: 0,
            /** ID of current frame */
            id: 0,
        };
        /** Stores framerate information */
        Internals.fps = {
            /** Temporary interval between frames */
            dynamic: [],
            /** Overall interval between frames */
            overall: [],
        };
        /** Generates a unique ID using four unsigned integers and the `crypto` api */
        function gen_id() {
            let nums = crypto.getRandomValues(new Uint16Array(4));
            let strs = Array.from(nums).map((n) => `${n}`.padStart(5, "0"));
            return strs.join("-");
        }
        Internals.gen_id = gen_id;
        /**
         * Throws an error
         * @param source Error source
         * @param name Type of error
         * @param reason Reason for error
         * @param stack Stacktrace of error
         */
        function error(source, name, reason, stack) {
            let err = new Error();
            (err.name = name), (err.message = reason), (err.stack = stack);
            Event.trigger("error", {
                name: "error",
                payload: { name, reason, stack },
                source,
                timestamp: performance.now(),
            });
            throw err;
        }
        Internals.error = error;
    })(Internals = Luna.Internals || (Luna.Internals = {}));
    /** Engine internals */
    let Engine;
    (function (Engine) {
        /** Engine update queue */
        Engine.queue = new Internals.Queue();
        /**
         * Updates all items in the queue
         * @param delta Time since last frame
         */
        async function update(delta) {
            Engine.queue.array().forEach(async (item) => await item.update(delta));
            Event.trigger("update", {
                name: "update",
                payload: { frame: Internals.frame, delta },
                source: "Luna.Engine.update",
                timestamp: performance.now(),
            });
        }
        Engine.update = update;
    })(Engine = Luna.Engine || (Luna.Engine = {}));
    /** Display internals */
    let Display;
    (function (Display) {
        /** Display render queue */
        Display.queue = new Internals.Queue();
        let canvas = document.querySelector("canvas");
        let ctx = canvas.getContext("2d");
        /** Initializes the display */
        function init() {
            if (!canvas)
                Internals.error("Luna.Display.init", "Unable to initialize", "Missing canvas element");
            if (!ctx)
                Internals.error("Luna.Display.init", "Unable to initialize", "Missing image rendering context");
            ctx.imageSmoothingEnabled = false;
        }
        Display.init = init;
        /** Resizes the canvas to fit the screen */
        function autofit() {
            let { clientWidth: w, clientHeight: h } = document.documentElement;
            canvas.setAttribute("width", `${w}px`);
            canvas.setAttribute("height", `${h}px`);
        }
        Display.autofit = autofit;
        /**
         * Renders all items in the queue
         * @param delta Time since last frame
         */
        async function render(delta) {
            let { clientWidth: dw, clientHeight: dh } = document?.documentElement;
            let { width: cw, height: ch } = canvas;
            if (cw !== dw || ch !== dh)
                autofit();
            ctx.beginPath();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            Display.queue.array().forEach(async (item) => item.render(delta, ctx));
            ctx.closePath();
            Event.trigger("render", {
                name: "render",
                payload: { canvas, ctx, delta, frame: Internals.frame },
                source: "Luna.Display.render",
                timestamp: performance.now(),
            });
        }
        Display.render = render;
    })(Display = Luna.Display || (Luna.Display = {}));
    /** Engine classes */
    let Class;
    (function (Class) {
        /** @class Vector2D */
        class Vector2D {
            x;
            y;
            /** A (1, 1) vector */
            static unit = new Vector2D(1, 1);
            /** A (0, 0) vector */
            static zero = new Vector2D(0, 0);
            /**
             * Creates a new 2d vector
             * @param x X value
             * @param y Y value
             */
            constructor(x = 0, y = 0) {
                this.x = x;
                this.y = y;
            }
            /** Creates a copy of the vector instance */
            copy() {
                return new Vector2D(this.x, this.y);
            }
            /** Multiplies both values by -1 */
            inverse() {
                return new Vector2D(-this.x, -this.y);
            }
            /** Sets both values to their reciprocal */
            reciprocal() {
                return new Vector2D(1 / this.x, 1 / this.y);
            }
            /** Returns a string representation of the instance */
            to_string() {
                return JSON.stringify(this, null, "\t");
            }
            /** Sets the values of the instance */
            set(x = this.x, y = this.y) {
                this.x = x;
                this.y = y;
                return this;
            }
            /** Adds to the values of the instance */
            add(x = 0, y = 0) {
                this.x += x;
                this.y += y;
                return this;
            }
            /** Subtracts from the values of the instance */
            sub(x = 0, y = 0) {
                this.x -= x;
                this.y -= y;
                return this;
            }
            /** Multiplies the values of the instance */
            mul(x = 1, y = 1) {
                this.x *= x;
                this.y *= y;
                return this;
            }
            /** Divides the values of the instance */
            div(x = 1, y = 1) {
                this.x /= x;
                this.y /= y;
                return this;
            }
            /** Raises the values of the instance to a power */
            pow(x = 1, y = 1) {
                this.x **= x;
                this.y **= y;
                return this;
            }
            /** Divides the values of the instance and sets them to the remainder */
            mod(x = 1, y = 1) {
                this.x %= x;
                this.y %= y;
                return this;
            }
        }
        Class.Vector2D = Vector2D;
        /** @class Vector3D */
        class Vector3D {
            x;
            y;
            z;
            /** A (1, 1, 1) vector */
            static unit = new Vector3D(1, 1, 1);
            /** A (0, 0, 0) vector */
            static zero = new Vector3D(0, 0, 0);
            /**
             * Creates a new 3d vector
             * @param x X value
             * @param y Y value
             * @param z Z value
             */
            constructor(x = 0, y = 0, z = 0) {
                this.x = x;
                this.y = y;
                this.z = z;
            }
            /** Creates a copy of the vector instance */
            copy() {
                return new Vector3D(this.x, this.y, this.z);
            }
            /** Multiplies both values by -1 */
            inverse() {
                return new Vector3D(-this.x, -this.y, -this.z);
            }
            /** Sets both values to their reciprocal */
            reciprocal() {
                return new Vector3D(1 / this.x, 1 / this.y, 1 / this.z);
            }
            /** Returns a string representation of the instance */
            to_string() {
                return JSON.stringify(this, null, "\t");
            }
            /** Converts the instance to a 2D vector */
            to_2d() {
                return new Vector2D(this.x, this.y);
            }
            /** Sets the values of the instance */
            set(x = this.x, y = this.y, z = this.z) {
                this.x = x;
                this.y = y;
                this.z = z;
                return this;
            }
            /** Adds to the values of the instance */
            add(x = 0, y = 0, z = 0) {
                this.x += x;
                this.y += y;
                this.z += z;
                return this;
            }
            /** Subtracts from the values of the instance */
            sub(x = 0, y = 0, z = 0) {
                this.x -= x;
                this.y -= y;
                this.z -= z;
                return this;
            }
            /** Multiplies the values of the instance */
            mul(x = 1, y = 1, z = 1) {
                this.x *= x;
                this.y *= y;
                this.z *= z;
                return this;
            }
            /** Divides the values of the instance */
            div(x = 1, y = 1, z = 1) {
                this.x /= x;
                this.y /= y;
                this.z /= z;
                return this;
            }
            /** Raises the values of the instance to a power */
            pow(x = 1, y = 1, z = 1) {
                this.x **= x;
                this.y **= y;
                this.z **= z;
                return this;
            }
            /** Divides the values of the instance and sets them to the remainder */
            mod(x = 1, y = 1, z = 1) {
                this.x %= x;
                this.y %= y;
                this.z %= z;
                return this;
            }
        }
        Class.Vector3D = Vector3D;
        class Entity {
            position;
            size;
        }
        Class.Entity = Entity;
        class StaticEntity {
            position;
            size;
            constructor(position, size) {
                this.position = position;
                this.size = size;
            }
            async update(delta) { }
            async render(delta) { }
            remove() { }
        }
        Class.StaticEntity = StaticEntity;
        class KineticEntity {
            position;
            size;
            constructor(position, size) {
                this.position = position;
                this.size = size;
            }
            async update(delta) { }
            async render(delta) { }
            remove() { }
        }
        Class.KineticEntity = KineticEntity;
    })(Class = Luna.Class || (Luna.Class = {}));
    /** Developer settings */
    Luna.dev = {
        /** Whether dev mode is enabled */
        enabled: false,
        /** Frames to process before exiting */
        runtime: 10,
    };
    /** Requests a new frame */
    async function request_process_tick() {
        if (!Luna.running)
            return;
        if (Luna.settings.vsync) {
            Internals.frame.id = requestAnimationFrame(process);
        }
        else {
            // this 0ms delay acts as a buffer to stop the thread from halting
            await new Promise((res) => setTimeout(res, 0));
            process(performance.now());
        }
    }
    Luna.request_process_tick = request_process_tick;
    /**
     * Adds a frame interval to the fps arrays
     * @param interval Delay between frames
     */
    function add_interval(interval) {
        Internals.fps.overall.push(interval);
        if (!Luna.settings.logfps)
            return;
        Internals.fps.dynamic.push(interval);
    }
    Luna.add_interval = add_interval;
    /**
     * Prints fps data to the console
     * @param type Type of fps log
     */
    function print_frames(type = "dynamic") {
        let arr = Internals.fps[type];
        if (arr.length === 0)
            return;
        let sum = arr.reduce((p, c) => p + c);
        let avg = sum / arr.length;
        console.log(`${+(1000 / avg).toFixed(3)}fps`, `${+avg.toFixed(3)}ms`);
    }
    Luna.print_frames = print_frames;
    /** Starts the engine process */
    function start() {
        Luna.running = true;
        request_process_tick();
        Event.trigger("start", {
            name: "start",
            payload: { frame: Internals.frame },
            source: "Luna.start",
            timestamp: performance.now(),
        });
    }
    Luna.start = start;
    /**
     * Stops the engine process
     * @param code Stop code
     */
    function stop(code = 0) {
        Luna.running = false;
        if (Luna.settings.vsync)
            cancelAnimationFrame(Internals.frame.id);
        print_frames("overall");
        Event.trigger("stop", {
            name: "stop",
            payload: { code, frame: Internals.frame, fps: Internals.fps },
            source: "Luna.stop",
            timestamp: performance.now(),
        });
        Engine.queue.clear();
        Display.queue.clear();
        Internals.fps = { dynamic: [], overall: [] };
        Internals.frame = { current: 0, last: 0, id: 0 };
    }
    Luna.stop = stop;
    /**
     * Processes a frame
     * @param timestamp Current time
     */
    async function process(timestamp) {
        if (!Luna.running)
            return;
        let delta = timestamp - Internals.frame.last;
        if (Luna.settings.logfps) {
            if (Internals.frame.last !== 0)
                add_interval(delta);
            if (Internals.fps.dynamic.length >= Luna.settings.loginterval && Luna.settings.logfps) {
                print_frames();
                Internals.fps.dynamic = [];
            }
        }
        Internals.frame.last = timestamp;
        Internals.frame.current++;
        await Engine.update(delta);
        await Display.render(delta);
        if (Luna.dev.enabled && Internals.frame.current >= Luna.dev.runtime)
            stop(-1);
        else
            await request_process_tick();
    }
    Luna.process = process;
})(Luna || (Luna = {}));
