import Table from ".";
import { RefInfoInput, RefMakerPair } from "../common/types";
import { ASTNode, HasOne, Ref } from "../nodes";
import RQLTag from "../RQLTag";

const hasOne = (table: string, info?: Omit<RefInfoInput, "lxRef" | "rxRef" | "xTable">): RefMakerPair => {
  const hasOneInfo = info || {};
  const child = Table (table);

  const makeHasOne = (parent: Table, tag: RQLTag<unknown>, as?: string) => {
    as = as || hasOneInfo.as || child.name;
    const refOf = Ref.refOf (as);

    return HasOne (
      {
        as,
        lRef: refOf (parent, "lref", hasOneInfo.lRef || "id"),
        rRef: refOf (child, "rref", hasOneInfo.rRef || `${parent.name}_id`)
      },
      tag
    );
  };

  return [child, makeHasOne];
};

export default hasOne;