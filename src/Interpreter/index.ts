import Environment from "../Environment2";
import isRaw from "../Raw/isRaw";
import associate from "../refs/associate";
import getRefPath from "../refs/getRefPath";
import compileSQLTag from "../SQLTag/compileSQLTag";
import Table from "../Table";
import { ASTRelation, ASTType, Link, ASTNode, Refs } from "../types";
import varToSQLTag from "../JBOInterpreter/varToSQLTag";
import arrayToParams from "../more/arrayToParams";
import isFunction from "../predicate/isFunction";

class Interpreter {
  refs: Refs;
  useSmartAlias: boolean;

  constructor(refs: Refs, useSmartAlias: boolean) {
    this.refs = refs;
    this.useSmartAlias = useSmartAlias;
  }

  interpret<Input>(exp: ASTNode, params: Input, rows: any[], env: Environment = new Environment ({ next: [] }, null)) {
    // root
    if (exp.type === "Root") {
      const { name, as, members } = exp;

      const membersEnv = new Environment ({
        table: new Table (name, as),
        sql: "",
        query: "select",
        keyIdx: 0,
        values: [],
        next: []
      }, null);

      this.interpretEach (members, membersEnv);

      // membersEnv.writeToQuery (`from "${name}" "${as}"`
      //   .concat (hasId ? ` where "${as}".id = ${id}` : "")
      // );
      // const hasId = id != null;

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

    if (exp.type === "HasMany") {
      const { name, as, members } = exp;
      const table = env.lookup ("table");

      // convert naar specified caseTYpe
      const columnLinks = this.findHasManyLinks (name, table.name)
      || [[table.name + "_id", "id"]];

      const assoc = associate (as, table.as, columnLinks);

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
      //   `)${orderByPart}), '[]'::json) from "${name}" "${as}" where ${assoc}`
      // );

      membersEnv.writeSQLToQuery (true);

      env.writeToQuery (")");

      return;
    }

    if (exp.type === "BelongsTo") {
      const { name, as, members, keywords } = exp;
      const table = env.lookup ("table");

      const columnLinks = this.findBelongsToLinks (table.name, name, as)
      || [[name + "_id", "id"]];

      const assoc = associate (table.as, as, columnLinks);

      if (!rows[0]) {
        env.addToNext ({
          exp,
          pred: () => true
        });
        return;
      }

      const membersEnv = new Environment ({
        table: new Table (name, as),
        query: "select",
        sql: "",
        keyIdx: 0,
        values: [],
        next: []
      }, env);

      this.interpretEach (members, membersEnv);

      // unique list
      // doe join met player dan heb ik teamId nie nodig ?
      /**
       * select player.team_id, team.id, team.name
       * from player player
       * join team team on ...
       * where player id in ()
       *
       * of voeg team_id dynamisch toe door map over next
       * en haal het er dan terug vanaf als het er initieel nie was
       */
      membersEnv.writeToQuery (
        `from "${name}" "${as}" where id in (${arrayToParams (membersEnv.lookup ("keyIdx"), rows, "")})`
      );

      membersEnv.addValues (rows.map (r => r.team_id));
      console.log (membersEnv);

      membersEnv.writeSQLToQuery (true);

      return membersEnv.record;
    }

    if (exp.type === "ManyToMany") {
      const { name, as, members, keywords } = exp;
      const { xTable } = keywords;
      const table = env.lookup ("table");
      let _x = xTable || (table.name + "_" + name);
      const _xReversed = xTable || (name + "_" + table.name);

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
    return getRefPath (foreignTable, col, this.refs);
  }

  findBelongsToLinks(foreignTable: string, col: string, as: string) {
    let ref = getRefPath (foreignTable, col, this.refs);

    if (ref == null && this.useSmartAlias) {
      const tableLinks = this.refs[foreignTable];

      if (tableLinks) {
        const arr =
          Object.keys (tableLinks)
            .filter (key => {
              // <table>/n
              const match = key.match (new RegExp ("^" + col + "/\\d+"));
              return match != null;
            })
            .map (key => tableLinks[key]);

        let idx = 0;
        while (ref == null && idx < arr.length) {
          const links = arr[idx];
          const colnames = links.map (i => i[0]);
          let jdx = 0;

          while (ref == null && jdx < colnames.length) {

            // only alphanumeric (letters, numbers, regardless of case) plus underscore (_)
            // can get through the parse phase and therefore we only need to replace underscores
            const colname = colnames[jdx]
              .toLowerCase ()
              .replace (/_/g, "");

            const fAs = as
              .toLowerCase ()
              .replace (/_/g, "");

            // "homeTeamId".startsWith ("homeTeam") === true
            if (colname.startsWith (fAs)) {
              ref = links;
            }

            jdx += 1;
          }

          idx += 1;
        }

      }
    }

    return ref;
  }

  findManyToManyLinks(foreignTable: string, col: string, reversed: string): [Link[] | undefined, boolean] {
    let ref = getRefPath (foreignTable, col, this.refs);
    let foundByReversing = false;

    if (ref == null) {
      ref = getRefPath (reversed, col, this.refs);
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
      this.interpret (exp, {}, [], env);

      if (moveSQL) {
        env.moveSQLToQuery ();
      }
    });
  }
}

export default Interpreter;