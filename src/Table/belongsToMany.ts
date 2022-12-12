import Table from ".";
import createRef from "../common/createRef";
import { BelongsToManyInfo, TableRefMakerPair } from "../common/types";
import { ASTNode, BelongsToMany } from "../nodes";
import RQLTag from "../RQLTag";

const belongsToMany = (table: string, info?: Partial<Omit<BelongsToManyInfo, "xTable"> & { xTable: string }>): TableRefMakerPair => {
  const belongsToManyInfo = info || {};
  const child = Table (table);

  const makeBelongsToMany = (parent: Table, tag: RQLTag<unknown, unknown>, as?: string) => {
    as = as || belongsToManyInfo.as || `${child.name}s`;
    const refOf = createRef (as);

    return BelongsToMany (
      {
        as,
        xTable: Table (
          belongsToManyInfo.xTable ||
          (parent.name < child.name ? `${parent.name}_${child.name}` : `${child.name}_${parent.name}`)
        ),
        lRef: refOf ("lref", belongsToManyInfo.lRef || "id"),
        rRef: refOf ("rref", belongsToManyInfo.rRef || "id"),
        lxRef: refOf ("lxref", belongsToManyInfo.lxRef || `${parent.name}_id`),
        rxRef: refOf ("rxref", belongsToManyInfo.rxRef || `${child.name}_id`)
      },
      tag
    );
  };

  return [child, makeBelongsToMany];
};

export default belongsToMany;