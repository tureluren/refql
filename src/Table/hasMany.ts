import Table from ".";
import { HasManyInfo, TableRefMakerPair } from "../common/types";
import { ASTNode, HasMany } from "../nodes";
import RQLTag from "../RQLTag";

const hasMany = (table: string, info?: Partial<HasManyInfo>): TableRefMakerPair => {
  const hasManyInfo = info || {};
  const child = Table (table);

  const makeHasMany = (_parent: Table, tag: RQLTag<unknown, unknown>, as?: string) =>
    HasMany (
      {
        as: as || hasManyInfo.as || `${child.name}s`,
        lRef: hasManyInfo.lRef || "id",
        rRef: hasManyInfo.rRef || `${parent.name}_id`
      },
      tag
    );

  return [child, makeHasMany];
};

export default hasMany;