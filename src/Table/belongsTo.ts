import Table from ".";
import { BelongsToInfo, TableRefMakerPair } from "../common/types";
import { ASTNode, BelongsTo } from "../nodes";

const belongsTo = (table: string, info: Partial<BelongsToInfo> = {}): TableRefMakerPair => {
  const child = Table (table);

  const makeBelongsTo = (_parent: Table, members: ASTNode<unknown>[], as?: string) =>
    BelongsTo (
      child,
      {
        as: as || info.as || child.name,
        lRef: info.lRef || `${child.name}_id`,
        rRef: info.rRef || "id"
      },
      members
    );

  return [child, makeBelongsTo];
};

export default belongsTo;