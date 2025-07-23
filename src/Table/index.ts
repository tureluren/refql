import { flEquals, refqlType } from "../common/consts";
import copyObj from "../common/copyObj";
import { CUDOutput, Deletable, Insertable, InsertParams, Output, Params, PropMap, RequiredRefQLOptions, Selectable, Simplify, Updatable, UpdateParams } from "../common/types";
import validateTable, { validateComponents } from "../common/validateTable";
import withDefaultOptions from "../common/withDefaultOptions";
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
  <Components extends Selectable<TableId, Props>[]>(components: Components): RQLTag<TableId, Params<TableId, Props, Components>, { [K in Output<TableId, Props, Components> as K["as"]]: K["type"] }>;
  tableId: TableId;
  name: string;
  schema?: string;
  props: Props;
  empty<Params, Output>(): RQLTag<TableId, Params, Output>;
  equals(other: Table<TableId, Props>): boolean;
  [flEquals]: Table<TableId, Props>["equals"];
  toString(): string;
  insert<Components extends Insertable<TableId>[]>(components: Components): InsertRQLTag<TableId, Simplify<{ data: InsertParams<Props>[] } & Omit<Params<TableId, Props, Components>, "rows">>, CUDOutput<TableId, Props, Components>["output"]>;
  update<Components extends Updatable<TableId>[]>(components: Components): UpdateRQLTag<TableId, Simplify<{ data: UpdateParams<Props> } & Omit<Params<TableId, Props, Components>, "rows">>, CUDOutput<TableId, Props, Components>["output"]>;
  delete<Components extends Deletable<TableId>[]>(components: Components): DeleteRQLTag<TableId, Params<TableId, Props, Components>, CUDOutput<TableId, Props, Components>["output"]>;
  addProps<Props2 extends PropType<any>[]>(props: Props2): Table<TableId, Props & PropMap<TableId, Props2>>;
}

const type = "refql/Table";

function upsertRQLNode(nodes: RQLNode[], newNode: RQLNode) {
  if (Prop.isProp (newNode) || SQLProp.isSQLProp (newNode)) {
    const index = nodes.findIndex (node => {
      if (Prop.isProp (node) || SQLProp.isSQLProp (node)) {
        return node.as === newNode.as;
      }

      return false;

    });

    if (index !== -1) {
      // Merge operations if item exists
      const existingNode = nodes[index] as Prop | SQLProp;

      const prop = copyObj (existingNode) as Prop | SQLProp;

      prop.operations = prop.operations.concat (newNode.operations);

      // || the same prop can occur twice when selecting components, but if one is omitted, the output type wil always exclude the prop
      prop.isOmitted = prop.isOmitted || newNode.isOmitted;

      nodes[index] = prop;

      return nodes;
    }
  }
  // Add new item
  nodes.push (newNode);

  return nodes;
}

const makeTable = (options: RequiredRefQLOptions) => {
  const prototype = Object.assign (Object.create (Function.prototype), {
    constructor: Table,
    [refqlType]: type,
    insert, update,
    delete: remove,
    equals, [flEquals]: equals,
    toString,
    addProps
  });

  function Table<TableId extends string, Props extends PropType<any>[]>(name: TableId, props: Props) {
    validateTable (name);

    if (props != null && !Array.isArray (props)) {
      throw new Error ("Invalid props: not an Array");
    }

    const [tableName, schema] = name.trim ().split (".").reverse ();

    let properties = props.reduce (
      (acc, prop) => ({ ...acc, [prop.as]: prop.setTableName (tableName) }),
      {} as PropMap<TableId, Props>
    );

    const table = (components => {
      validateComponents (components);

      let nodes: RQLNode[] = [];

      let memberCount = 0;

      // isSQLTag kan weg als dit niet meer kan voorvallen bij gen schema
      const fieldProps = Object.entries (properties)
        .map (([, prop]) => prop as Prop)
        .filter (prop => Prop.isProp (prop) && !isSQLTag (prop.col));

      for (const comp of components) {
        if (typeof comp === "string" && properties[comp]) {
          const prop = properties[comp] as unknown as Prop;
          nodes = upsertRQLNode (nodes, prop);
          if (!SQLProp.isSQLProp (prop)) {
            memberCount += 1;
          }
        } else if (Prop.isProp (comp) && properties[comp.as as keyof typeof properties]) {
          nodes = upsertRQLNode (nodes, comp);
          if (comp.operations.length === 0 && !comp.isOmitted) {
            memberCount += 1;
          }
        } else if (SQLProp.isSQLProp (comp)) {
          nodes = upsertRQLNode (nodes, comp);
        } else if (isTable (comp)) {
          const refNodes = Object.keys (properties)
            .map (key => properties[key as keyof typeof properties])
            .filter (prop => RefProp.isRefProp (prop) && comp.equals (prop.child))
            .map ((refProp => {
              const fieldProps = Object.entries (comp.props as any)
                .map (([, prop]) => prop as Prop)
                .filter (prop => Prop.isProp (prop) && !isSQLTag (prop.col));
              return RefNode (createRQLTag (comp, [...fieldProps], options), refProp as any, table as any, options);
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
            .map ((refProp => RefNode (createRQLTag (comp.table, comp.nodes, options), refProp as any, table as any, options)));

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

      return createRQLTag (table, nodes, options);

    }) as Table<TableId, typeof properties>;

    Object.setPrototypeOf (table, prototype);

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

  function addProps<Props extends PropType<any>[]>(this: Table, props: Props) {
    const schemaAndName = `${this.schema ? this.schema + "." : ""}${this.name}`;
    return Table (schemaAndName, Object.values (this.props).concat (props) as Props);
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

    return createInsertRQLTag (this, nodes, options);
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

    return createUpdateRQLTag (this, nodes, options);
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

    return createDeleteRQLTag (this, nodes, options);
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

export const TableX = makeTable (withDefaultOptions ({}));

export default makeTable;