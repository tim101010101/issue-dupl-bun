import { describe, expect, test } from "bun:test";

import { ThreadPool } from "./pool";

describe("ThreadPool", () => {
	test("concurrent workers", async () => {
		const pool = new ThreadPool();

		const tasks = Array(8)
			.fill(0)
			.map((_, i) => pool.run(i));

		const results = await Promise.all(tasks);
		expect(results).toEqual(
			Array(8)
				.fill(0)
				.map((_, i) => i * 2),
		);
	});
});
