import { Rec } from "../types";
import get from "./get";

function over <K extends keyof Rec<any>>(prop: K, fn: (value: Rec<any>[K]) => Rec<any>[K]): <Input>(rec: Rec<Input>) => Rec<Input>;
function over <Input, K extends keyof Rec<Input>>(prop: K, fn: (value: Rec<Input>[K]) => Rec<Input>[K], rec: Rec<Input>): Rec<Input>;
function over <K extends keyof Rec<any>>(prop: K, fn: (value: Rec<any>[K]) => Rec<any>[K], rec?: Rec<any>): Rec<any> | (<Input>(rec: Rec<Input>) => Rec<Input>) {
  const go = <Input>(rec: Rec<Input>): Rec<Input> => {
    return { ...rec, [prop]: fn (get (prop, rec)) };
  };
  return !rec ? go : go (rec);
}

export default over;