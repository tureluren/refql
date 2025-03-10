import Raw from "../SQLTag/Raw";
import truePred from "../common/truePred";
import { TagFunctionVariable } from "../common/types";

const rawSpace = (pred: TagFunctionVariable<any, boolean> = truePred) =>
  Raw (" ").setPred (pred);

export default rawSpace;
