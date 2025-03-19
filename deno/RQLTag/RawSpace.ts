import Raw from "../SQLTag/Raw.ts";
import truePred from "../common/truePred.ts";
import { TagFunctionVariable } from "../common/types.ts";

const rawSpace = (pred: TagFunctionVariable<any, boolean> = truePred) =>
  Raw (" ").setPred (pred);

export default rawSpace;
