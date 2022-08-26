import { Rec, Transformations } from "../types";

export function evolve <K extends keyof Rec<any>>(tfs: Transformations<any>): <Input>(rec: Rec<Input>) => Rec<Input>;
export function evolve <Input, K extends keyof Rec<Input>>(tfs: Transformations<Input>, rec: Rec<Input>): Rec<Input>;
export function evolve <K extends keyof Rec<any>>(tfs: Transformations<any>, rec?: Rec<any>): Rec<any> | (<Input>(rec: Rec<Input>) => Rec<Input>) {
  const go = <Input>(rec: Rec<Input>): Rec<Input> => {
    return (Object.keys (rec) as K[]).reduce ((acc, key) => {
      const tf = tfs[key];
      if (tf) {
        acc[key] = tf (get (key) (rec));
      } else {
        acc[key] = rec[key];
      }
      return acc;
    }, {} as typeof rec);
  };

  return !rec ? go : go (rec);
}

export function get <K extends keyof Rec<any>>(prop: K): <Input>(rec: Rec<Input>) => Rec<Input>[K];
export function get <Input, K extends keyof Rec<Input>>(prop: K, rec: Rec<Input>): Rec<Input>[K];
export function get <K extends keyof Rec<any>>(prop: K, rec?: Rec<any>): Rec<any>[K] | (<Input>(rec: Rec<Input>) => Rec<Input>[K]) {
  const go = <Input>(rec: Rec<Input>): Rec<Input>[K] =>
    rec[prop];

  return !rec ? go : go (rec);
}

export function over <K extends keyof Rec<any>>(prop: K, f: (value: Rec<any>[K]) => Rec<any>[K]): <Input>(rec: Rec<Input>) => Rec<Input>;
export function over <Input, K extends keyof Rec<Input>>(prop: K, f: (value: Rec<Input>[K]) => Rec<Input>[K], rec: Rec<Input>): Rec<Input>;
export function over <K extends keyof Rec<any>>(prop: K, f: (value: Rec<any>[K]) => Rec<any>[K], rec?: Rec<any>): Rec<any> | (<Input>(rec: Rec<Input>) => Rec<Input>) {
  const go = <Input>(rec: Rec<Input>): Rec<Input> => {
    return { ...rec, [prop]: f (get (prop, rec)) };
  };
  return !rec ? go : go (rec);
}

export function set <K extends keyof Rec<any>>(prop: K, value: Rec<any>[K]): <Input>(rec: Rec<Input>) => Rec<Input>;
export function set <Input, K extends keyof Rec<Input>>(prop: K, value: Rec<Input>[K], rec: Rec<Input>): Rec<Input>;
export function set <K extends keyof Rec<any>>(prop: K, value: Rec<any>[K], rec?: Rec<any>): Rec<any> | (<Input>(rec: Rec<Input>) => Rec<Input>) {
  const go = <Input>(rec: Rec<Input>): Rec<Input> => {
    return { ...rec, [prop]: value };
  };

  return !rec ? go : go (rec);
}