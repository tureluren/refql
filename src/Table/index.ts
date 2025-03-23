import { flEquals, refqlType } from "../common/consts";
import dummyQuerier from "../common/dummyQuerier";
import { CUDOutput, Deletable, Insertable, InsertParams, Output, Params, Querier, Runner, Selectable, Simplify, Updatable, UpdateParams } from "../common/types";
import validateTable, { validateComponents } from "../common/validateTable";
import Prop from "../Prop";
import PropType from "../Prop/PropType";
import RefProp from "../Prop/RefProp";
import SQLProp from "../Prop/SQLProp";
import { createRQLTag, isRQLTag, RQLTag } from "../RQLTag";
import { createDeleteRQLTag, DeleteRQLTag } from "../RQLTag/DeleteRQLTag";
import { createInsertRQLTag, InsertRQLTag } from "../RQLTag/InsertRQLTag";
import RefNode from "../RQLTag/RefNode";
import RQLNode, { isRQLNode } from "../RQLTag/RQLNode";
import { createUpdateRQLTag, UpdateRQLTag } from "../RQLTag/UpdateRQLTag";
import { isSQLTag } from "../SQLTag";

export interface Table<TableId extends string = any, Props = any> {
  <Components extends Selectable<Props>[]>(components: Components): RQLTag<TableId, Params<Props, Components>, { [K in Output<Props, Components> as K["as"]]: K["type"] }>;
  tableId: TableId;
  name: string;
  schema?: string;
  props: Props;
  empty<Params, Output>(): RQLTag<TableId, Params, Output>;
  equals(other: Table<TableId, Props>): boolean;
  [flEquals]: Table<TableId, Props>["equals"];
  toString(): string;
  insert<Components extends Insertable<TableId>[]>(components: Components): InsertRQLTag<TableId, Simplify<{ data: InsertParams<Props>[] } & Omit<Params<Props, Components>, "rows">>, CUDOutput<TableId, Props, Components>["output"]>;
  update<Components extends Updatable<TableId, Props>[]>(components: Components): UpdateRQLTag<TableId, Simplify<{ data: UpdateParams<Props> } & Omit<Params<Props, Components>, "rows">>, CUDOutput<TableId, Props, Components>["output"]>;
  delete<Components extends Deletable<Props>[]>(components: Components): DeleteRQLTag<TableId, Params<Props, Components>, CUDOutput<TableId, Props, Components>["output"]>;
}

const type = "refql/Table";

const makeTable = (querier: Querier, runner: Runner) => {
  const prototype = Object.assign (Object.create (Function.prototype), {
    constructor: Table,
    [refqlType]: type,
    insert, update,
    delete: remove,
    equals, [flEquals]: equals,
    toString
  });

  function Table<TableId extends string, Props extends PropType<any>[]>(name: TableId, props: Props) {
    validateTable (name);

    if (props != null && !Array.isArray (props)) {
      throw new Error ("Invalid props: not an Array");
    }

    let properties = props.reduce (
      (acc, prop) => ({ ...acc, [prop.as]: prop }),
      {} as { [P in Props[number] as P["as"] ]: P }
    );

    const table = (components => {
      validateComponents (components);

      const nodes: RQLNode[] = [];

      let memberCount = 0;
      // isSQLTag kan weg als dit niet meer kan voorvallen bij gen schema
      const fieldProps = Object.entries (properties)
        .map (([, prop]) => prop as Prop)
        .filter (prop => Prop.isProp (prop) && !isSQLTag (prop.col));

      for (const comp of components) {
        if (typeof comp === "string" && properties[comp]) {
          const prop = properties[comp] as unknown as Prop;
          nodes.push (prop);
          memberCount += 1;
        } else if (Prop.isProp (comp) && properties[comp.as as keyof typeof properties]) {
          nodes.push (comp);
          if (comp.operations.length === 0 && !comp.isOmitted) {
            memberCount += 1;
          }
        } else if (isTable (comp)) {
          const refNodes = Object.keys (properties)
            .map (key => properties[key as keyof typeof properties])
            .filter (prop => RefProp.isRefProp (prop) && comp.equals (prop.child))
            .map ((refProp => {
              const fieldProps = Object.entries (comp.props as any)
                .map (([, prop]) => prop as Prop)
                .filter (prop => Prop.isProp (prop) && !isSQLTag (prop.col));
              return RefNode (createRQLTag (comp, [...fieldProps], querier), refProp as any, table as any);
            }));

          if (!refNodes.length) {
            throw new Error (
              `${table.tableId} has no ref defined for: ${comp.tableId}`
            );
          }

          nodes.push (...refNodes);
        } else if (isRQLTag (comp)) {
          const refNodes = Object.keys (properties)
            .map (key => properties[key as keyof typeof properties])
            .filter (prop => RefProp.isRefProp (prop) && comp.table.equals (prop.child))
            .map ((refProp => RefNode (createRQLTag (comp.table, comp.nodes, querier), refProp as any, table as any)));

          if (!refNodes.length) {
            throw new Error (
              `${table.tableId} has no ref defined for: ${comp.table.tableId}`
            );
          }

          nodes.push (...refNodes);
        } else if (isRQLNode (comp)) {
          nodes.push (comp);
        } else {
          throw new Error (`Unknown Selectable Type: "${String (comp)}"`);
        }
      }

      if (memberCount === 0) {
        nodes.push (...fieldProps);
      }

      return createRQLTag (table, nodes, querier);
    }) as Table<TableId, typeof properties>;

    Object.setPrototypeOf (table, prototype);

    const [tableName, schema] = name.trim ().split (".").reverse ();

    Object.defineProperty (table, "name", {
      value: tableName,
      writable: false,
      enumerable: true
    });

    table.tableId = name;
    table.schema = schema;
    table.props = properties;

    return table;
  }


  function insert(this: Table, components: any) {
    validateComponents (components);

    const nodes: RQLNode[] = [];

    for (const comp of components) {
      if (isRQLTag (comp)) {
        if (this.equals (comp.table)) {
          nodes.push (comp);
        } else {
          throw new Error ("When creating an InsertRQLTag, RQLTags are reserved for determining the return type. Therefore, the table associated with the RQLTag must match the table into which you are inserting data");
        }
      } else {
        throw new Error (`Unknown Insertable Type: "${String (comp)}"`);
      }
    }

    return createInsertRQLTag (this, nodes, querier);
  }

  function update(this: Table, components: any) {
    validateComponents (components);

    const nodes: RQLNode[] = [];

    for (const comp of components) {
      if ((Prop.isProp (comp) && this.props[comp.as as keyof typeof this.props]) || SQLProp.isSQLProp (comp)) {
        nodes.push (comp);
      } else if (isRQLTag (comp)) {
        if (this.equals (comp.table)) {
          nodes.push (comp);
        } else {
          throw new Error ("When creating an UpdateRQLTag, RQLTags are reserved for determining the return type. Therefore, the table associated with the RQLTag must match the table into which you are inserting data");
        }
      } else if (isSQLTag (comp)) {
        nodes.push (comp);
      } else {
        throw new Error (`Unknown Updatable Type: "${String (comp)}"`);
      }
    }

    return createUpdateRQLTag (this, nodes, querier);
  }

  function remove(this: Table, components: any) {
    validateComponents (components);

    const nodes: RQLNode[] = [];

    for (const comp of components) {
      if ((Prop.isProp (comp) && this.props[comp.as as keyof typeof this.props]) || SQLProp.isSQLProp (comp)) {
        nodes.push (comp);
      } else if (isSQLTag (comp)) {
        nodes.push (comp);
      } else {
        throw new Error (`Unknown Deletable Type: "${String (comp)}"`);
      }
    }

    return createDeleteRQLTag (this, nodes, querier);
  }

  function toString<Name extends string, S>(this: Table<Name, S>) {
    return `${this.schema ? `${this.schema}.` : ""}${this.name}`;
  }

  function equals<Name extends string, S>(this: Table<Name, S>, other: Table<Name, S>) {
    if (!isTable (other)) return false;

    return (
      this.name === other.name &&
      this.schema === other.schema
    );
  }


  return Table;
};

export function isTable<Name extends string, S>(x: any): x is Table<Name, S> {
  return x != null && x[refqlType] === type;
}

export const TableX = makeTable (dummyQuerier);

export default makeTable;