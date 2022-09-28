import Rec from "./Rec.ts";

type Transformations = {
  [key in keyof Partial<Rec>]: (value: Rec[key]) => Rec[key];
};

export function evolve <K extends keyof Rec>(tfs: Transformations): (rec: Rec) => Rec;
export function evolve <K extends keyof Rec>(tfs: Transformations, rec: Rec): Rec;
export function evolve <K extends keyof Rec>(tfs: Transformations, rec?: Rec): Rec | ((rec: Rec) => Rec) {
  const go = (rec: Rec): Rec => {
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

export function get <K extends keyof Rec>(prop: K): (rec: Rec) => Rec[K];
export function get <K extends keyof Rec>(prop: K, rec: Rec): Rec[K];
export function get <K extends keyof Rec>(prop: K, rec?: Rec): Rec[K] | ((rec: Rec) => Rec[K]) {
  const go = (rec: Rec): Rec[K] =>
    rec[prop];

  return !rec ? go : go (rec);
}

export function over <K extends keyof Rec>(prop: K, f: (value: Rec[K]) => Rec[K]): (rec: Rec) => Rec;
export function over <K extends keyof Rec>(prop: K, f: (value: Rec[K]) => Rec[K], rec: Rec): Rec;
export function over <K extends keyof Rec>(prop: K, f: (value: Rec[K]) => Rec[K], rec?: Rec): Rec | ((rec: Rec) => Rec) {
  const go = (rec: Rec): Rec => {
    return { ...rec, [prop]: f (get (prop, rec)) };
  };
  return !rec ? go : go (rec);
}

export function set <K extends keyof Rec>(prop: K, value: Rec[K]): (rec: Rec) => Rec;
export function set <K extends keyof Rec>(prop: K, value: Rec[K], rec: Rec): Rec;
export function set <K extends keyof Rec>(prop: K, value: Rec[K], rec?: Rec): Rec | ((rec: Rec) => Rec) {
  const go = (rec: Rec): Rec => {
    return { ...rec, [prop]: value };
  };

  return !rec ? go : go (rec);
}