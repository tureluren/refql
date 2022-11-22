import Table from ".";
import { HasOneInfo, TableRefMakerPair } from "../common/types";
import { ASTNode, HasOne } from "../nodes";

const hasOne = (table: string, info?: Partial<HasOneInfo>): TableRefMakerPair => {
  const hasOneInfo = info || {};
  const child = Table (table);

  const makeHasOne = (parent: Table, members: ASTNode<unknown>[], as?: string) =>
    HasOne (
      child,
      {
        as: as || hasOneInfo.as || child.name,
        lRef: hasOneInfo.lRef || "id",
        rRef: hasOneInfo.rRef || `${parent.name}_id`
      },
      members
    );

  return [child, makeHasOne];
};

export default hasOne;