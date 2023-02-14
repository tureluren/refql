declare module "../common/BoxRegistry" {
  interface BoxRegistry<Output> {
    readonly Task: Task<Output>;
  }
}

class Task<Output> {
  fork: (rej: (x: any) => void, res: (x: Output) => void) => void;

  constructor(fork: (reject: (x: any) => void, resolve: (x: Output) => void) => void) {
    this.fork = fork;
  }
}

export const promiseToTask = <Output>(p: Promise<Output>) =>
  new Task<Output> ((rej, res) => p.then (res).catch (rej));

export default Task;