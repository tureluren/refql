import { Rec, Transformations } from "../types.ts";

export function evolve <K extends keyof Rec<any>>(tfs: Transformations<any>): <Params>(rec: Rec<Params>) => Rec<Params>;
export function evolve <Params, K extends keyof Rec<Params>>(tfs: Transformations<Params>, rec: Rec<Params>): Rec<Params>;
export function evolve <K extends keyof Rec<any>>(tfs: Transformations<any>, rec?: Rec<any>): Rec<any> | (<Params>(rec: Rec<Params>) => Rec<Params>) {
  const go = <Params>(rec: Rec<Params>): Rec<Params> => {
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

export function get <K extends keyof Rec<any>>(prop: K): <Params>(rec: Rec<Params>) => Rec<Params>[K];
export function get <Params, K extends keyof Rec<Params>>(prop: K, rec: Rec<Params>): Rec<Params>[K];
export function get <K extends keyof Rec<any>>(prop: K, rec?: Rec<any>): Rec<any>[K] | (<Params>(rec: Rec<Params>) => Rec<Params>[K]) {
  const go = <Params>(rec: Rec<Params>): Rec<Params>[K] =>
    rec[prop];

  return !rec ? go : go (rec);
}

export function over <K extends keyof Rec<any>>(prop: K, f: (value: Rec<any>[K]) => Rec<any>[K]): <Params>(rec: Rec<Params>) => Rec<Params>;
export function over <Params, K extends keyof Rec<Params>>(prop: K, f: (value: Rec<Params>[K]) => Rec<Params>[K], rec: Rec<Params>): Rec<Params>;
export function over <K extends keyof Rec<any>>(prop: K, f: (value: Rec<any>[K]) => Rec<any>[K], rec?: Rec<any>): Rec<any> | (<Params>(rec: Rec<Params>) => Rec<Params>) {
  const go = <Params>(rec: Rec<Params>): Rec<Params> => {
    return { ...rec, [prop]: f (get (prop, rec)) };
  };
  return !rec ? go : go (rec);
}

export function set <K extends keyof Rec<any>>(prop: K, value: Rec<any>[K]): <Params>(rec: Rec<Params>) => Rec<Params>;
export function set <Params, K extends keyof Rec<Params>>(prop: K, value: Rec<Params>[K], rec: Rec<Params>): Rec<Params>;
export function set <K extends keyof Rec<any>>(prop: K, value: Rec<any>[K], rec?: Rec<any>): Rec<any> | (<Params>(rec: Rec<Params>) => Rec<Params>) {
  const go = <Params>(rec: Rec<Params>): Rec<Params> => {
    return { ...rec, [prop]: value };
  };

  return !rec ? go : go (rec);
}