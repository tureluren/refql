import Table from ".";
import { BelongsToManyInfo, TableRefMakerPair } from "../common/types";
import { ASTNode, BelongsToMany } from "../nodes";

const belongsToMany = (table: string, info: Partial<Omit<BelongsToManyInfo, "xTable"> & { xTable: string }> = {}): TableRefMakerPair => {
  const child = Table (table);

  const makeBelongsToMany = (parent: Table, members: ASTNode<unknown>[], as?: string) =>
    BelongsToMany (
      child,
      {
        xTable: Table (
          info.xTable ||
          (parent.name < child.name ? `${parent.name}_${child.name}` : `${child.name}_${parent.name}`)
        ),
        as: as || info.as || `${child.name}s`,
        lRef: info.lRef || "id",
        rRef: info.rRef || "id",
        lxRef: info.lxRef || `${parent.name}_id`,
        rxRef: info.rxRef || `${child.name}_id`
      },
      members
    );

  return [child, makeBelongsToMany];
};

export default belongsToMany;