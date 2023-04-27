import { Querier } from "../common/types";

// declare module "../SQLTag" {
//   interface SQLTag<Params = any, Output = any> {
//     (params: Params, querier?: Querier): ReturnType<SQLTag["convertPromise"]>;
//     convertPromise: (p: Promise<Output>) => Task<Output>;
//   }
// }

class Task<Output> {
  fork: (rej: (e: any) => void, res: (x: Output) => void) => void;

  constructor(fork: (rej: (e: any) => void, res: (x: Output) => void) => void) {
    this.fork = fork;
  }
}

export const promiseToTask = <Output>(p: Promise<Output>) =>
  new Task<Output> ((rej, res) => p.then (res).catch (rej));

export const fork = <Output>(task: Task<Output>) =>
  new Promise<Output> ((res, rej) =>
    task.fork (rej, res)
  );

export default Task;