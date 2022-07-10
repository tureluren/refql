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

      membersEnv.writeToQuery (`from "${name}" "${as}"`
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

      const required = lkeys.map (lk => `${lk.name} as ${lk.as}`);

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

      const requiredHere = rkeys.map (rk => `${rk.name} as ${rk.as}`);

      membersEnv.addToRequired (requiredHere);

      this.interpretEach (members, membersEnv);

      membersEnv.lookup ("required").forEach (req => {
        membersEnv.writeToQuery (req);
      });

      // unique list
      let wherePart = `from "${name}" "${as}" where`;

      rkeys.forEach ((rk, idx) => {
        const orOp = idx === 0 ? "" : "or ";

        wherePart += ` ${orOp}${rk.name} in (${parameterize (membersEnv.lookup ("keyIdx"), rows.length, "")})`;
      });

      membersEnv.writeToQuery (wherePart);

      lkeys.forEach (lk => {
        membersEnv.addValues (rows.map (r => r[lk.as]));
      });

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

      const required = lkeys.map (lk => `${lk.name} as ${lk.as}`);

      if (!rows) {
        env.addToRequired (required);
        env.addToNext ({
          exp,
          lkeys: lkeys.map (lk => lk.as),
          rkeys: rkeys.map (rk => rk.as)
        });
        return;
      }

      // // convert naar specified caseTYpe
      // const columnLinks = this.findHasManyLinks (name, table.name)
      // || [[table.name + "_id", "id"]];

      // const assoc = associate (as, table.as, columnLinks);

      // env.writeToQuery (
      //   `'${as}', (select coalesce(json_agg(json_build_object(`
      // );

      const membersEnv = new Environment ({
        table: new Table (name, as),
        query: "select",
        sql: "",
        keyIdx: 0,
        values: [],
        next: [],
        required: []
      }, env);

      const requiredHere = rkeys.map (rk => `${rk.name} as ${rk.as}`);

      membersEnv.addToRequired (requiredHere);

      this.interpretEach (members, membersEnv);

      membersEnv.lookup ("required").forEach (req => {
        membersEnv.writeToQuery (req);
      });

      let wherePart = `from "${name}" "${as}" where`;

      rkeys.forEach ((rk, idx) => {
        const orOp = idx === 0 ? "" : "or ";

        wherePart += ` ${orOp}${rk.name} in (${parameterize (membersEnv.lookup ("keyIdx"), rows.length, "")})`;
      });

      membersEnv.writeToQuery (wherePart);

      lkeys.forEach (lk => {
        membersEnv.addValues (rows.map (r => r[lk.as]));
      });

      membersEnv.writeSQLToQuery (true);

      return membersEnv.record;

      // const orderByPart = this.getOrderBy (orderBy, membersEnv);

      // env.writeToQuery (
      //   `)${orderByPart}), '[]'::json) from "${name}" "${as}" where ${assoc}`
      // );

      // membersEnv.writeSQLToQuery (true);

      // env.writeToQuery (")");

      // return;
    }


    if (exp.type === "ManyToMany") {
      const { name, as, members, keywords } = exp;
      const { x } = keywords;
      const table = env.lookup ("table");
      let _x = x || (table.name + "_" + name);
      const _xReversed = x || (name + "_" + table.name);

      // convert naar specified caseTYpe
      let tableLinks: Link[] = [[name + "_id", "id"]];

      // if (refs && refs[name]) {
      //   tableLinks = refs[name];
      // } else {
      const [found, foundByReversing] = this.findManyToManyLinks (_x, name, _xReversed);

      if (found) {
        tableLinks = found;

        if (foundByReversing) {
          _x = _xReversed;
        }
      }
      // }

      let parentLinks: Link[] = [[table.name + "_id", "id"]];

      // if (refs && refs[table.name]) {
      //   parentLinks = refs[table.name];
      // } else {
      const [found2] = this.findManyToManyLinks (_x, table.name, _xReversed);
      if (found2) {
        parentLinks = found2;
      }
      // }

      const assoc = associate (_x, as, tableLinks);
      const parentAssoc = associate (_x, table.as, parentLinks);

      env.writeToQuery (
        `'${as}', (select coalesce(json_agg(json_build_object(`
      );

      const membersEnv = new Environment ({
        table: new Table (name, as),
        sql: "",
        next: []
      }, env);

      this.interpretEach (members, membersEnv);

      // const orderByPart = this.getOrderBy (orderBy, membersEnv);

      // env.writeToQuery (
      //   `)${orderByPart}), '[]'::json) from "${_x}" "${_x}" join "${name}" "${as}" on ${assoc} where ${parentAssoc}`
      // );

      membersEnv.writeSQLToQuery (true);

      env.writeToQuery (")");

      return;
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