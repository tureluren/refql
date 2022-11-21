import Table from ".";
import { HasOneInfo, TableRefMakerPair } from "../common/types";
import { ASTNode, HasOne } from "../nodes";

const hasOne = (table: string, info: Partial<HasOneInfo> = {}): TableRefMakerPair => {
  const child = Table (table);

  const makeHasOne = (parent: Table, members: ASTNode<unknown>[], as?: string) =>
    HasOne (
      child,
      {
        as: as || info.as || child.name,
        lRef: info.lRef || "id",
        rRef: info.rRef || `${parent.name}_id`
      },
      members
    );

  return [child, makeHasOne];
};

export default hasOne;