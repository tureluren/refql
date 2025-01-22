import { refqlType } from "../common/consts";
import { InterpretedString, TagFunctionVariable } from "../common/types";
import { SQLTag } from "../SQLTag";
import Raw from "../SQLTag/Raw";
import sql from "../SQLTag/sql";
import Value from "../SQLTag/Value";
import Operation from "../Table/Operation";
import RQLNode, { rqlNodePrototype } from "./RQLNode";

interface Eq<Params = any, Type = any> extends RQLNode, Operation<Params, Type> {
  notEq: boolean;
}

const type = "refql/Eq";

const prototype = Object.assign ({}, rqlNodePrototype, {
  constructor: Eq,
  [refqlType]: type,
  precedence: 1,
  interpret
});

function Eq<Params, Type>(run: TagFunctionVariable<Params, Type> | Type, notEq = false) {
  let eq: Eq<Params, Type> = Object.create (prototype);

  eq.run = (
    typeof run === "function" ? run : () => run
  ) as TagFunctionVariable<Params, Type>;

  eq.notEq = notEq;

  return eq;
}

function interpret(this: Eq, interpretedColumn: Raw | SQLTag, pred: any = () => true) {
  const { notEq } = this;
  const equality = notEq ? "!=" : "=";

  return sql`
          and ${interpretedColumn} ${Raw (equality)} ${Value (this.run)}
        `;
  // };

  // return {
  //   run: (p: any, i: number) => {
  //     if (pred (p)) {
  //       // return [` and ${interpretedColumn} ${equality} $${i + 1}`, 1];
  //       return sql`
  //         and ${interpretedColumn} ${Raw (equality)} ${Value (this.run)}
  //       `;
  //     }
  //     return sql``;
  //   }
  // };
}

Eq.isEq = function <Params = any, Type = any> (x: any): x is Eq<Params, Type> {
  return x != null && x[refqlType] === type;
};

export default Eq;