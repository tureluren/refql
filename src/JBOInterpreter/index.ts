import Environment from "../Environment";
import isRaw from "../Raw/isRaw";
import associate from "../refs/associate";
import getRefPath from "../refs/getRefPath";
import compileSQLTag from "../SQLTag/compileSQLTag";
import Table from "../Table";
import { ASTType, Link, Refs } from "../types";
import varToSQLTag from "./varToSQLTag";

class JBOInterpreter {
  refs: Refs;
  useSmartAlias: boolean;

  constructor(refs: Refs, useSmartAlias: boolean) {
    this.refs = refs;
    this.useSmartAlias = useSmartAlias;
  }

  interpret(exp: ASTType, env: Environment = new Environment ({}, null)) {
    // root
    if (exp.type === "Table") {
      const { name, as, members, id, limit, offset } = exp;

      const memberEnv = new Environment ({
        table: new Table (name, as),
        sql: "",
        isRoot: true,
        query: "select json_build_object(",
        keyIdx: 0,
        values: []
      }, null);

      this.interpretEach (members, memberEnv);

      const hasId = id != null;

      memberEnv.writeToQuery (`) from "${name}" "${as}"`
        .concat (hasId ? ` where "${as}".id = ${id}` : "")
      );

      if (limit != null) {
        memberEnv.writeToSQL (`limit ${limit}`);
      }

      if (offset != null) {
        memberEnv.writeToSQL (`offset ${offset}`);
      }

      memberEnv.writeSQLToQuery (hasId);

      return [memberEnv.record.query, memberEnv.record.values];
    }

    if (exp.type === "Identifier") {
      const { name, as, cast } = exp;
      const { inFunction } = env.record;

      const table = env.lookup ("table");

      let sql = inFunction
        ? `"${table.as}".${name}`
        : `'${as}', "${table.as}".${name}`;

      if (cast) {
        sql += "::" + cast;
      }

      env.writeToQuery (sql);

      return;
    }

    if (exp.type === "HasMany") {
      const { name, as, members, links, orderBy } = exp.include;
      const table = env.lookup ("table");

      const columnLinks = links
      || this.findHasManyLinks (name, table.name)
      || [[table.name + "_id", "id"]];

      const assoc = associate (as, table.as, columnLinks);

      env.writeToQuery (
        `'${as}', (select coalesce(json_agg(json_build_object(`
      );

      const memberEnv = new Environment ({
        table: new Table (name, as),
        sql: ""
      }, env);

      this.interpretEach (members, memberEnv);

      const orderByPart = this.getOrderBy (orderBy, memberEnv);

      env.writeToQuery (
        `)${orderByPart}), '[]'::json) from "${name}" "${as}" where ${assoc}`
      );

      memberEnv.writeSQLToQuery (true);

      env.writeToQuery (")");

      return;
    }

    if (exp.type === "BelongsTo") {
      const { name, as, members, links } = exp.include;
      const table = env.lookup ("table");

      const columnLinks = links
      || this.findBelongsToLinks (table.name, name, as)
      || [[name + "_id", "id"]];

      const assoc = associate (table.as, as, columnLinks);

      env.writeToQuery (
        `'${as}', (select json_build_object(`
      );

      const memberEnv = new Environment ({
        table: new Table (name, as),
        sql: ""
      }, env);

      this.interpretEach (members, memberEnv);

      env.writeToQuery (
        `) from "${name}" "${as}" where ${assoc}`
      );

      memberEnv.writeSQLToQuery (true);

      env.writeToQuery (")");

      return;
    }

    if (exp.type === "ManyToMany") {
      const { name, as, members, refs, xTable, orderBy } = exp.include;
      const table = env.lookup ("table");
      let _x = xTable || (table.name + "_" + name);
      const _xReversed = xTable || (name + "_" + table.name);

      let tableLinks: Link[] = [[name + "_id", "id"]];

      if (refs && refs[name]) {
        tableLinks = refs[name];
      } else {
        const [found, foundByReversing] = this.findManyToManyLinks (_x, name, _xReversed);

        if (found) {
          tableLinks = found;

          if (foundByReversing) {
            _x = _xReversed;
          }
        }
      }

      let parentLinks: Link[] = [[table.name + "_id", "id"]];

      if (refs && refs[table.name]) {
        parentLinks = refs[table.name];
      } else {
        const [found] = this.findManyToManyLinks (_x, table.name, _xReversed);
        if (found) {
          parentLinks = found;
        }
      }

      const assoc = associate (_x, as, tableLinks);
      const parentAssoc = associate (_x, table.as, parentLinks);

      env.writeToQuery (
        `'${as}', (select coalesce(json_agg(json_build_object(`
      );

      const memberEnv = new Environment ({
        table: new Table (name, as),
        sql: ""
      }, env);

      this.interpretEach (members, memberEnv);

      const orderByPart = this.getOrderBy (orderBy, memberEnv);

      env.writeToQuery (
        `)${orderByPart}), '[]'::json) from "${_x}" "${_x}" join "${name}" "${as}" on ${assoc} where ${parentAssoc}`
      );

      memberEnv.writeSQLToQuery (true);

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
        sql: ""
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
      const { isRoot } = env.record;

      const sql = this.getSQLIfSQLTag (value, env);

      if (sql) {
        if (!isRoot) {
          const invalid = /\b(limit|offset)\b/i.test (sql);
          if (invalid) {
            throw new Error ("Limit and offset can't be used inside a relation");
          }
        }

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
  };

  findHasManyLinks(foreignTable: string, col: string) {
    return getRefPath (foreignTable, col, this.refs);
  };

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
  };

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
  };

  getOrderBy(orderBy, env: Environment) {
    if (!orderBy) return "";

    const orderBySql = this.getSQLIfSQLTag (orderBy, env);

    if (orderBySql == null) {
      throw new Error (
        "`orderBy` should be a sql snippet or a function that returns a sql snippet"
      );
    }

    return " " + orderBySql;
  };

  getSQLIfSQLTag(value, env: Environment) {
    const sqlTag = varToSQLTag (value, env.lookup ("table"));

    if (sqlTag == null) {
      return null;
    }

    const [sql, values] = compileSQLTag (sqlTag, env.lookup ("keyIdx"));

    env.addValues (values);

    return sql;
  };

  interpretEach(arr: ASTType[], env: Environment, moveSQL = false) {
    arr.forEach (exp => {
      this.interpret (exp, env);

      if (moveSQL) {
        env.moveSQLToQuery ();
      }
    });
  };
}

export default JBOInterpreter;