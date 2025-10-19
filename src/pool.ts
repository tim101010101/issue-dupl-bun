import { MessageChannel } from "node:worker_threads";

import { TaskWorker } from "./worker";

export class ThreadPool {
	private workers: TaskWorker[] = [];

	run(value: number) {
		if (this.workers.length === 0) {
			for (let i = 0; i < 8; i++) {
				const { port1, port2 } = new MessageChannel();
				const worker = new TaskWorker(port1);

				const ready = new Promise((resolve) => worker.onReady(resolve as any));
				worker.boot(port2);

				this.workers.push(worker);
				ready.then(() => {});
			}
		}

		const worker = this.workers[0];
		return worker.run(value);
	}
}
