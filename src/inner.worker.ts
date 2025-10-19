import { ok } from "node:assert";
import type { MessagePort } from "node:worker_threads";
import { parentPort, receiveMessageOnPort } from "node:worker_threads";

ok(parentPort, "This file should be run inside a Worker Thread");

let port: MessagePort;
let channelBuffer: Int32Array;
let lastReqCount = 0;

const handleTask = async (taskMsg: any) => {
	try {
		const result = taskMsg.value * 2;
		port.postMessage({ taskId: taskMsg.id, result, error: null });

		const res = waitLoop();
		if (res?.then != null) await res;
	} catch (error) {
		port.postMessage({ taskId: taskMsg.id, result: null, error });
	}
};

const waitLoop = () => {
	const { async, value } = Atomics.waitAsync(channelBuffer, 0, lastReqCount);
	if (!async) return;

	return value.then(() => {
		lastReqCount = Atomics.load(channelBuffer, 0);
		let taskMsg: ReturnType<typeof receiveMessageOnPort>;
		// biome-ignore lint/suspicious/noAssignInExpressions: <>
		while ((taskMsg = receiveMessageOnPort(port))) {
			handleTask(taskMsg.message);
		}
	});
};

parentPort.once("message", async ({ port: p, channelBuffer: cb }) => {
	port = p;
	channelBuffer = cb;

	parentPort!.postMessage({ ready: true });

	port.on("message", (taskMsg) => handleTask(taskMsg));

	const res = waitLoop();
	if (res?.then != null) await res;
});
