import { resolve } from "node:path";
import type { MessagePort } from "node:worker_threads";
import { Worker } from "node:worker_threads";

const workerScript = resolve(__dirname, "inner.worker.ts");

export class TaskWorker {
	readonly id: number;
	private worker: Worker;
	private port: MessagePort;
	private channelBuffer: Int32Array;
	private tasks: Map<string, any>;
	private onReadyListeners: (() => void)[] | null = [];

	constructor(port: MessagePort) {
		this.worker = new Worker(workerScript);
		this.id = this.worker.threadId;
		this.port = port;
		this.tasks = new Map();
		this.channelBuffer = new Int32Array(
			new SharedArrayBuffer(2 * Int32Array.BYTES_PER_ELEMENT),
		);
	}

	private setupMessageHandlers() {
		this.worker.once("message", (msg) => {
			if (msg.ready) {
				this.ready();
			}
		});

		this.port.on("message", (msg) => {
			const { taskId, result, error } = msg;
			const task = this.tasks.get(taskId);

			if (task) {
				this.tasks.delete(taskId);
				error ? task.reject(error) : task.resolve(result);
			}
		});
	}

	ready() {
		const listeners = this.onReadyListeners;
		if (listeners === null) return;
		this.onReadyListeners = null;
		for (const listener of listeners) listener();
	}

	onReady(fn: () => void): void {
		if (this.onReadyListeners === null) {
			fn();
			return;
		}
		this.onReadyListeners.push(fn);
	}

	boot(port: MessagePort) {
		this.setupMessageHandlers();
		this.worker.postMessage({ port, channelBuffer: this.channelBuffer }, [
			port,
		]);
	}

	run(value: number) {
		const taskId = `task-${Date.now()}-${Math.random()}`;
		const { promise, resolve, reject } = Promise.withResolvers();
		this.tasks.set(taskId, { resolve, reject });

		this.port.postMessage({ id: taskId, value });
		Atomics.add(this.channelBuffer, 0, 1);
		Atomics.notify(this.channelBuffer, 0, 1);

		return promise;
	}
}
