declare module "../common/BoxRegistry" {
  interface BoxRegistry<Output> {
    readonly Task: Task<Output>;
  }
}

class Task<Output> {
  fork: (rej: (x: any) => void, res: (x: Output) => void) => void;

  constructor(fork: (rej: (x: any) => void, res: (x: Output) => void) => void) {
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