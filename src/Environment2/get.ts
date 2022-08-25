import { Rec } from "../types";

function get <K extends keyof Rec<any>>(prop: K): <Input>(rec: Rec<Input>) => Rec<Input>[K];
function get <Input, K extends keyof Rec<Input>>(prop: K, rec: Rec<Input>): Rec<Input>[K];
function get <K extends keyof Rec<any>>(prop: K, rec?: Rec<any>): Rec<any>[K] | (<Input>(rec: Rec<Input>) => Rec<Input>[K]) {
  const go = <Input>(rec: Rec<Input>): Rec<Input>[K] =>
    rec[prop];

  return !rec ? go : go (rec);
}

export default get;