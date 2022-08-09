import over from "../Environment2/over";

const select = (comps: string | string[]) =>
  over ("comps") (c => c.concat (comps));

export default select;