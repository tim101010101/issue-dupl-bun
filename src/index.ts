import { ThreadPool } from "./pool";

const pool = new ThreadPool();

const res = await pool.run(1);

console.log(res);
