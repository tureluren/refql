import { Rec, Tfs } from "../types";
import get from "./get";

function evolve <K extends keyof Rec<any>>(tfs: Tfs<any>): <Input>(rec: Rec<Input>) => Rec<Input>;
function evolve <Input, K extends keyof Rec<Input>>(tfs: Tfs<Input>, rec: Rec<Input>): Rec<Input>;
function evolve <K extends keyof Rec<any>>(tfs: Tfs<any>, rec?: Rec<any>): Rec<any> | (<Input>(rec: Rec<Input>) => Rec<Input>) {
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

export default evolve;