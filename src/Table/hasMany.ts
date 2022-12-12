import Table from ".";
import createRef from "../common/createRef";
import { HasManyInfo, TableRefMakerPair } from "../common/types";
import { ASTNode, HasMany } from "../nodes";
import RQLTag from "../RQLTag";

const hasMany = (table: string, info?: Partial<HasManyInfo>): TableRefMakerPair => {
  const hasManyInfo = info || {};
  const child = Table (table);

  const makeHasMany = (_parent: Table, tag: RQLTag<unknown, unknown>, as?: string) => {
    as = as || hasManyInfo.as || `${child.name}s`;
    const refOf = createRef (as);

    return HasMany (
      {
        as,
        lRef: refOf ("lref", hasManyInfo.lRef || "id"),
        rRef: refOf ("rref", hasManyInfo.rRef || `${parent.name}_id`)
      },
      tag
    );
  };

  return [child, makeHasMany];
};

export default hasMany;