import Table from ".";
import { HasOneInfo, TableRefMakerPair } from "../common/types";
import { ASTNode, HasOne } from "../nodes";
import RQLTag from "../RQLTag";

const hasOne = (table: string, info?: Partial<HasOneInfo>): TableRefMakerPair => {
  const hasOneInfo = info || {};
  const child = Table (table);

  const makeHasOne = (_parent: Table, tag: RQLTag<unknown, unknown>, as?: string) =>
    HasOne (
      {
        as: as || hasOneInfo.as || child.name,
        lRef: hasOneInfo.lRef || "id",
        rRef: hasOneInfo.rRef || `${parent.name}_id`
      },
      tag
    );

  return [child, makeHasOne];
};

export default hasOne;