import Table from ".";
import { HasManyInfo, TableRefMakerPair } from "../common/types";
import { ASTNode, HasMany } from "../nodes";

const hasMany = (table: string, info: Partial<HasManyInfo> = {}): TableRefMakerPair => {
  const child = Table (table);

  const makeHasMany = (parent: Table, members: ASTNode<unknown>[], as?: string) =>
    HasMany (
      child,
      {
        as: as || info.as || `${child.name}s`,
        lRef: info.lRef || "id",
        rRef: info.rRef || `${parent.name}_id`
      },
      members
    );

  return [child, makeHasMany];
};

export default hasMany;