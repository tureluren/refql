import Table from ".";
import createRef from "../common/createRef";
import { HasOneInfo, TableRefMakerPair } from "../common/types";
import { ASTNode, HasOne } from "../nodes";
import RQLTag from "../RQLTag";

const hasOne = (table: string, info?: Partial<HasOneInfo>): TableRefMakerPair => {
  const hasOneInfo = info || {};
  const child = Table (table);

  const makeHasOne = (_parent: Table, tag: RQLTag<unknown, unknown>, as?: string) => {
    as = as || hasOneInfo.as || child.name;
    const refOf = createRef (as);

    return HasOne (
      {
        as,
        lRef: refOf ("lref", hasOneInfo.lRef || "id"),
        rRef: refOf ("rref", hasOneInfo.rRef || `${parent.name}_id`)
      },
      tag
    );
  };

  return [child, makeHasOne];
};

export default hasOne;