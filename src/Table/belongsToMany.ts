import Table from ".";
import { RefInfo, RefInfoInput, RefMakerPair } from "../common/types";
import { ASTNode, BelongsToMany, Ref } from "../nodes";
import RQLTag from "../RQLTag";

const belongsToMany = (table: string, info?: RefInfoInput): RefMakerPair => {
  const belongsToManyInfo = info || {};
  const child = Table (table);

  const makeBelongsToMany = (parent: Table, tag: RQLTag<unknown>, as?: string) => {
    as = as || belongsToManyInfo.as || `${child.name}s`;
    const refOf = Ref.refOf (as);

    const xTable = Table (
      belongsToManyInfo.xTable ||
      (parent.name < child.name ? `${parent.name}_${child.name}` : `${child.name}_${parent.name}`)
    );

    return BelongsToMany (
      {
        as,
        xTable,
        lRef: refOf (parent, "lref", belongsToManyInfo.lRef || "id"),
        rRef: refOf (child, "rref", belongsToManyInfo.rRef || "id"),
        lxRef: refOf (xTable, "lxref", belongsToManyInfo.lxRef || `${parent.name}_id`),
        rxRef: refOf (xTable, "rxref", belongsToManyInfo.rxRef || `${child.name}_id`)
      },
      tag
    );
  };

  return [child, makeBelongsToMany];
};

export default belongsToMany;