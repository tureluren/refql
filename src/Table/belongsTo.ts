import Table from ".";
import { BelongsToInfo, TableRefMakerPair } from "../common/types";
import { ASTNode, BelongsTo } from "../nodes";

const belongsTo = (table: string, info?: Partial<BelongsToInfo>): TableRefMakerPair => {
  const belongsToInfo = info || {};
  const child = Table (table);

  const makeBelongsTo = (_parent: Table, members: ASTNode<unknown>[], as?: string) =>
    BelongsTo (
      child,
      {
        as: as || belongsToInfo.as || child.name,
        lRef: belongsToInfo.lRef || `${child.name}_id`,
        rRef: belongsToInfo.rRef || "id"
      },
      members
    );

  return [child, makeBelongsTo];
};

export default belongsTo;