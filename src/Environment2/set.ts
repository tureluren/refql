import { Rec } from "../types";

function set <K extends keyof Rec<any>>(prop: K, value: Rec<any>[K]): <Input>(rec: Rec<Input>) => Rec<Input>;
function set <Input, K extends keyof Rec<Input>>(prop: K, value: Rec<Input>[K], rec: Rec<Input>): Rec<Input>;
function set <K extends keyof Rec<any>>(prop: K, value: Rec<any>[K], rec?: Rec<any>): Rec<any> | (<Input>(rec: Rec<Input>) => Rec<Input>) {
  const go = <Input>(rec: Rec<Input>): Rec<Input> => {
    return { ...rec, [prop]: value };
  };

  return !rec ? go : go (rec);
}

export default set;