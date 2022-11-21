import Table from ".";
import { HasManyInfo, TableRefMakerPair } from "../common/types";
import { ASTNode, HasMany } from "../nodes";

const hasMany = (table: string, info?: Partial<HasManyInfo>): TableRefMakerPair => {
  const hasManyInfo = info || {};
  const child = Table (table);

  const makeHasMany = (parent: Table, members: ASTNode<unknown>[], as?: string) =>
    HasMany (
      child,
      {
        as: as || hasManyInfo.as || `${child.name}s`,
        lRef: hasManyInfo.lRef || "id",
        rRef: hasManyInfo.rRef || `${parent.name}_id`
      },
      members
    );

  return [child, makeHasMany];
};

export default hasMany;