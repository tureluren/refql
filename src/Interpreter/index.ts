import Environment from "../Environment2";
import isRaw from "../Raw/isRaw";
import associate from "../refs/associate";
import getRefPath from "../refs/getRefPath";
import compileSQLTag from "../SQLTag/compileSQLTag";
import Table from "../Table";
import { ASTRelation, ASTType, Link, ASTNode, Refs, CaseType, OptCaseType } from "../types";
import varToSQLTag from "../JBOInterpreter/varToSQLTag";
import parameterize from "../more/parameterize";
import isFunction from "../predicate/isFunction";
import convertCase from "../more/convertCase";

const splitKeys = (keys: string) =>
  keys.split (",").map (s => s.trim ());

class Interpreter<Input> {
  caseType: OptCaseType;
  useSmartAlias: boolean;
  params?: Input;

  constructor(caseType: OptCaseType, useSmartAlias: boolean, params?: Input) {
    this.caseType = caseType;
    this.useSmartAlias = useSmartAlias;
    this.params = params;
  }

  interpret(exp: ASTNode, env: Environment = new Environment ({}, null), rows?: any[]) {
    // root
    if (exp.type === "Root") {
      const { name, as, members } = exp;

      const membersEnv = new Environment ({
        table: new Table (name, as),
        sql: "",
        query: "select",
        keyIdx: 0,
        values: [],
        next: [],
        required: []
      }, null);

      this.interpretEach (members, membersEnv);

      // membersEnv.writeToQuery (`from "${name}" "${as}"`
      //   .concat (hasId ? ` where "${as}".id = ${id}` : "")
      // );
      // const hasId = id != null;

      membersEnv.lookup ("required").forEach (req => {
        membersEnv.writeToQuery (req);
      });

      membersEnv.writeToQuery (`from "${name}" "${as || name}"`
        // .concat (hasId ? ` where "${as}".id = ${id}` : "")
      );

      // if (limit != null) {
      //   membersEnv.writeToSQL (`limit ${limit}`);
      // }

      // if (offset != null) {
      //   membersEnv.writeToSQL (`offset ${offset}`);
      // }

      // membersEnv.writeSQLToQuery (hasId);

      return membersEnv.record;
    }

    if (exp.type === "Identifier") {
      const { name, as, cast } = exp;
      const { inFunction } = env.record;

      const table = env.lookup ("table");

      let sql = inFunction
        ? `"${table.as}".${name}`
        : `"${table.as}".${name} as ${as}`;

      if (cast) {
        sql += "::" + cast;
      }

      env.writeToQuery (sql);

      return;
    }

    if (exp.type === "BelongsTo") {
      const { name, as, members, keywords } = exp;

      const table = env.lookup ("table");

      const { lkey, rkey } = keywords;

      const lkeys = splitKeys (lkey || convertCase (this.caseType, name + "_id"))
        .map ((name, idx) => {
          return {
            name,
            as: `${as || name}lkey${idx}`
          };
        });

      const rkeys = splitKeys (rkey || "id")
        .map ((name, idx) => {
          return {
            name,
            as: `${as || name}rkey${idx}`
          };
        });

      const required = lkeys.map (lk => `"${table.as || table.name}".${lk.name} as ${lk.as}`);

      if (!rows) {
        env.addToRequired (required);
        env.addToNext ({
          exp,
          lkeys: lkeys.map (lk => lk.as),
          rkeys: rkeys.map (rk => rk.as)
        });
        return;
      }

      const membersEnv = new Environment ({
        table: new Table (name, as),
        query: "select",
        sql: "",
        keyIdx: 0,
        values: [],
        next: [],
        required: []
      }, env);

      this.interpretEach (members, membersEnv);

      const requiredHere = rkeys.map (rk => `"${as || name}".${rk.name} as ${rk.as}`);

      membersEnv.addToRequired (requiredHere);

      membersEnv.lookup ("required").forEach (req => {
        membersEnv.writeToQuery (req);
      });

      let wherePart = `from "${name}" "${as}" where`;

      // lkeys length should equal rkeys length
      lkeys.forEach ((lk, idx) => {
        const uniqRows = [...new Set (rows.map (r => r[lk.as]))];
        const rk = rkeys[idx];
        const andOp = idx === 0 ? "" : "and ";

        wherePart += ` ${andOp}${rk.name} in (${parameterize (membersEnv.lookup ("keyIdx"), uniqRows.length, "")})`;

        membersEnv.addValues (uniqRows);
      });

      membersEnv.writeToQuery (wherePart);

      membersEnv.writeSQLToQuery (true);

      return membersEnv.record;
    }

    if (exp.type === "HasMany") {
      const { name, as, members, keywords } = exp;
      const { lkey, rkey } = keywords;

      const table = env.lookup ("table");

      const lkeys = splitKeys (lkey || "id")
        .map ((name, idx) => {
          return {
            name,
            as: `${as || name}lkey${idx}`
          };
        });

      const rkeys = splitKeys (rkey || convertCase (this.caseType, table.name + "_id"))
        .map ((name, idx) => {
          return {
            name,
            as: `${as || name}rkey${idx}`
          };
        });

      const required = lkeys.map (lk => `"${table.as || table.name}".${lk.name} as ${lk.as}`);

      if (!rows) {
        env.addToRequired (required);
        env.addToNext ({
          exp,
          lkeys: lkeys.map (lk => lk.as),
          rkeys: rkeys.map (rk => rk.as)
        });
        return;
      }

      const membersEnv = new Environment ({
        table: new Table (name, as),
        query: "select",
        sql: "",
        keyIdx: 0,
        values: [],
        next: [],
        required: []
      }, env);

      this.interpretEach (members, membersEnv);

      const requiredHere = rkeys.map (rk => `"${as || name}".${rk.name} as ${rk.as}`);

      membersEnv.addToRequired (requiredHere);

      membersEnv.lookup ("required").forEach (req => {
        membersEnv.writeToQuery (req);
      });

      let wherePart = `from "${name}" "${as}" where`;

      lkeys.forEach ((lk, idx) => {
        const uniqRows = [...new Set (rows.map (r => r[lk.as]))];
        const rk = rkeys[idx];
        const andOp = idx === 0 ? "" : "and ";

        wherePart += ` ${andOp}${rk.name} in (${parameterize (membersEnv.lookup ("keyIdx"), uniqRows.length, "")})`;

        membersEnv.addValues (uniqRows);
      });

      membersEnv.writeToQuery (wherePart);

      membersEnv.writeSQLToQuery (true);

      return membersEnv.record;
    }

    if (exp.type === "ManyToMany") {
      const { name, as, members, keywords } = exp;
      const { x, lkey, lxkey, rkey, rxkey } = keywords;
      const table = env.lookup ("table");
      const xTable = x || convertCase (this.caseType, `${table.name}_${name}`);

      const lkeys = splitKeys (lkey || "id")
        .map ((name, idx) => {
          return {
            name,
            as: `${as || name}lkey${idx}`
          };
        });

      const rkeys = splitKeys (rkey || "id")
        .map ((name, idx) => {
          return {
            name,
            as: `${as || name}rkey${idx}`
          };
        });

      const lxkeys = splitKeys (lxkey || convertCase (this.caseType, table.name + "_id"))
        .map ((name, idx) => {
          return {
            name,
            as: `${as || name}lxkey${idx}`
          };
        });

      const rxkeys = splitKeys (rxkey || convertCase (this.caseType, name + "_id"))
        .map ((name, idx) => {
          return {
            name,
            as: `${as || name}rxkey${idx}`
          };
        });

      const required = lkeys.map (lk => `${lk.name} as ${lk.as}`);

      if (!rows) {
        env.addToRequired (required);
        env.addToNext ({
          exp,
          lkeys: lkeys.map (lk => lk.as),
          rkeys: lxkeys.map (lxk => lxk.as)
        });
        return;
      }


      const membersEnv = new Environment ({
        table: new Table (name, as),
        query: "select",
        sql: "",
        keyIdx: 0,
        values: [],
        next: [],
        required: []
      }, env);

      this.interpretEach (members, membersEnv);

      const requiredHere = rkeys.map (rk => `"${as || name}".${rk.name} as ${rk.as}`);

      const requiredHere2 = lxkeys.map (lxk => `"${xTable}".${lxk.name} as ${lxk.as}`);

      const requiredHere3 = rxkeys.map (rxk => `"${xTable}".${rxk.name} as ${rxk.as}`);

      membersEnv.addToRequired (requiredHere.concat (requiredHere2).concat (requiredHere3));

      membersEnv.lookup ("required").forEach (req => {
        membersEnv.writeToQuery (req);
      });

      let wherePart = `from ${name} as "${as}" join ${xTable} as "${xTable}" on`;

      /**
       * select * from game
       * join x on rxkey = rkey
       * where lxkey = lkey
       */

      rkeys.forEach ((rk, idx) => {
        const andOp = idx === 0 ? "" : "and ";
        const rxk = rxkeys[idx];

        wherePart += ` ${andOp}"${xTable}".${rxk.name} = "${as || name}".${rk.name}`;
      });

      wherePart += " where";

      // lkeys length should equal lxkeys length
      lkeys.forEach ((lk, idx) => {
        const uniqRows = [...new Set (rows.map (r => r[lk.as]))];
        const lxk = lxkeys[idx];
        const andOp = idx === 0 ? "" : "and ";

        wherePart += ` ${andOp}"${xTable}".${lxk.name} in (${parameterize (membersEnv.lookup ("keyIdx"), uniqRows.length, "")})`;

        membersEnv.addValues (uniqRows);
      });

      membersEnv.writeToQuery (wherePart);

      membersEnv.writeSQLToQuery (true);

      return membersEnv.record;
    }

    if (exp.type === "Subselect") {
      const { tag, as } = exp;

      const sql = this.getSQLIfSQLTag (tag, env);

      if (sql) {
        env.writeToQuery (`'${as}', (${sql})`);
      } else {
        throw new Error ("A subselect should be a sql snippet or a function that returns a sql snippet");
      }

      return;
    }

    if (exp.type === "Call") {
      const { args, name, as, cast } = exp;
      const { inFunction } = env.record;

      const argumentEnv = new Environment ({
        inFunction: true,
        sql: "",
        next: []
      }, env);

      // nested
      if (inFunction) {
        env.writeToQuery (`${name}(`);
      } else {
        env.writeToQuery (`'${as}', ${name}(`);
      }

      this.interpretEach (args, argumentEnv, true);

      env.writeToQuery (`)${cast ? `::${cast}` : ""}`);

      return;
    }

    if (exp.type === "Variable") {
      const { value, cast } = exp;
      // const { isRoot } = env.record;

      const sql = this.getSQLIfSQLTag (value, env);

      if (sql) {
        // if (!isRoot) {
        //   const invalid = /\b(limit|offset)\b/i.test (sql);
        //   if (invalid) {
        //     throw new Error ("Limit and offset can't be used inside a relation");
        //   }
        // }

        env.writeToSQL (sql);
      } else if (isRaw (value)) {
        env.writeToQuery (value.value);

      } else {
        // normal variable
        env.addValues ([value]);

        let query = "$" + env.lookup ("keyIdx");

        if (cast) {
          query += "::" + cast;
        }

        env.writeToQuery (query);
      }

      return;
    }

    if (exp.type === "StringLiteral") {
      const { value, as } = exp;
      const { inFunction } = env.record;

      if (inFunction) {
        env.writeToQuery (`'${value}'`);
      } else {
        env.writeToQuery (`'${as}', '${value}'`);
      }

      return;
    }

    if (
      exp.type === "NumericLiteral" ||
      exp.type === "BooleanLiteral" ||
      exp.type === "NullLiteral"
    ) {
      const { value, as } = exp;
      const { inFunction } = env.record;

      if (inFunction) {
        env.writeToQuery (`${value}`);
      } else {
        env.writeToQuery (`'${as}', ${value}`);
      }

      return;
    }

    throw new Error (`Unimplemented: ${JSON.stringify (exp)}`);
  }

  findHasManyLinks(foreignTable: string, col: string) {
    // return getRefPath (foreignTable, col, this.refs);
    return getRefPath (foreignTable, col, {});
  }

  // findBelongsToLinks(foreignTable: string, col: string, as: string) {
  //   let ref = getRefPath (foreignTable, col, this.refs);

  //   if (ref == null && this.useSmartAlias) {
  //     const tableLinks = this.refs[foreignTable];

  //     if (tableLinks) {
  //       const arr =
  //         Object.keys (tableLinks)
  //           .filter (key => {
  //             // <table>/n
  //             const match = key.match (new RegExp ("^" + col + "/\\d+"));
  //             return match != null;
  //           })
  //           .map (key => tableLinks[key]);

  //       let idx = 0;
  //       while (ref == null && idx < arr.length) {
  //         const links = arr[idx];
  //         const colnames = links.map (i => i[0]);
  //         let jdx = 0;

  //         while (ref == null && jdx < colnames.length) {

  //           // only alphanumeric (letters, numbers, regardless of case) plus underscore (_)
  //           // can get through the parse phase and therefore we only need to replace underscores
  //           const colname = colnames[jdx]
  //             .toLowerCase ()
  //             .replace (/_/g, "");

  //           const fAs = as
  //             .toLowerCase ()
  //             .replace (/_/g, "");

  //           // "homeTeamId".startsWith ("homeTeam") === true
  //           if (colname.startsWith (fAs)) {
  //             ref = links;
  //           }

  //           jdx += 1;
  //         }

  //         idx += 1;
  //       }

  //     }
  //   }

  //   return ref;
  // }

  findManyToManyLinks(foreignTable: string, col: string, reversed: string): [Link[] | undefined, boolean] {
    let ref = getRefPath (foreignTable, col, {});
    // let ref = getRefPath (foreignTable, col, this.refs);
    let foundByReversing = false;

    if (ref == null) {
      // ref = getRefPath (reversed, col, this.refs);
      ref = getRefPath (reversed, col, {});
      if (ref != null) {
        foundByReversing = true;
      }
    }

    return [ref, foundByReversing];
  }

  getOrderBy(orderBy: any, env: Environment) {
    if (!orderBy) return "";

    const orderBySql = this.getSQLIfSQLTag (orderBy, env);

    if (orderBySql == null) {
      throw new Error (
        "`orderBy` should be a sql snippet or a function that returns a sql snippet"
      );
    }

    return " " + orderBySql;
  }

  getSQLIfSQLTag(value: any, env: Environment) {
    const sqlTag = varToSQLTag (value, env.lookup ("table"));

    if (sqlTag == null) {
      return null;
    }

    const [sql, values] = compileSQLTag (sqlTag, env.lookup ("keyIdx"));

    env.addValues (values);

    return sql;
  }

  interpretEach(arr: ASTNode[], env: Environment, moveSQL = false) {
    arr.forEach (exp => {
      this.interpret (exp, env);

      if (moveSQL) {
        env.moveSQLToQuery ();
      }
    });
  }
}

export default Interpreter;