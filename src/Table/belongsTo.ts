import Table from ".";
import createRef from "../common/createRef";
import { BelongsToInfo, TableRefMakerPair } from "../common/types";
import { ASTNode, BelongsTo } from "../nodes";
import RQLTag from "../RQLTag";

const belongsTo = (table: string, info?: Partial<BelongsToInfo>): TableRefMakerPair => {
  const belongsToInfo = info || {};
  const child = Table (table);

  const makeBelongsTo = (_parent: Table, tag: RQLTag<unknown, unknown>, as?: string) => {
    as = as || belongsToInfo.as || child.name;
    const refOf = createRef (as);
    return BelongsTo (
      {
        as,
        lRef: refOf ("lref", belongsToInfo.lRef || `${child.name}_id`),
        rRef: refOf ("rref", belongsToInfo.rRef || "id")
      },
      tag
    );
  };

  return [child, makeBelongsTo];
};

export default belongsTo;