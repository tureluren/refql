import Table from ".";
import { BelongsToManyInfo, TableRefMakerPair } from "../common/types";
import { ASTNode, BelongsToMany } from "../nodes";

const belongsToMany = (table: string, info?: Partial<Omit<BelongsToManyInfo, "xTable"> & { xTable: string }>): TableRefMakerPair => {
  const belongsToManyInfo = info || {};
  const child = Table (table);

  const makeBelongsToMany = (parent: Table, members: ASTNode<unknown>[], as?: string) =>
    BelongsToMany (
      child,
      {
        xTable: Table (
          belongsToManyInfo.xTable ||
          (parent.name < child.name ? `${parent.name}_${child.name}` : `${child.name}_${parent.name}`)
        ),
        as: as || belongsToManyInfo.as || `${child.name}s`,
        lRef: belongsToManyInfo.lRef || "id",
        rRef: belongsToManyInfo.rRef || "id",
        lxRef: belongsToManyInfo.lxRef || `${parent.name}_id`,
        rxRef: belongsToManyInfo.rxRef || `${child.name}_id`
      },
      members
    );

  return [child, makeBelongsToMany];
};

export default belongsToMany;