import { DBRef, Link, RefQLConfig, Refs } from "../types";
import convertRefs from "./convertRefs";
import getRefInfo from "./getRefInfo";
import getRefPath from "./getRefPath";
import makeLinks from "./makeLinks";
import setRefPath from "./setRefPath";

const makeRefs = (config: RefQLConfig, dbRefs: DBRef[]) => {
  let refs: Refs = {};

  if (config.detectRefs) {
    let multipleDetects: [string, string, Link[]][] = [];
    dbRefs.forEach (ref => {
      const { tableFrom: tf, constraint } = ref;

      const {
        tableFrom, tableTo,
        tableFromCols, tableToCols
      } = getRefInfo (tf, constraint);

      const existingLink = getRefPath (tableFrom, tableTo, refs);

      if (existingLink) {
        multipleDetects.push ([
          tableFrom, tableTo,
          makeLinks (tableFromCols, tableToCols)
        ]);

      } else {
        refs = setRefPath (
          tableFrom, tableTo,
          makeLinks (tableFromCols, tableToCols),
          refs
        );
      }
    });

    multipleDetects.forEach (item => {
      const tableFrom = item[0];
      const tableTo = item[1];
      const link = item[2];

      const toMove = getRefPath (tableFrom, tableTo, refs);

      if (toMove) {
        refs = setRefPath (
          tableFrom,
          tableTo + "/1",
          toMove,
          refs
        );

        delete refs[tableFrom][tableTo];
      }

      // find next free number
      const itemNo = (start => {
        const go = no => {
          if (getRefPath (tableFrom, tableTo + "/" + no, refs)) {
            return go (no + 1);
          }
          return no;
        };
        return go (start);
      }) (2);

      refs = setRefPath (
        tableFrom,
        tableTo + "/" + itemNo,
        link,
        refs
      );

    });

  }

  // overwrite detected refs with provided refs
  if (config.refs) {
    const configRefs = convertRefs (config.caseTypeDB, config.refs);

    Object.keys (configRefs).forEach (tableFrom => {
      const ref = configRefs[tableFrom];

      Object.keys (ref).forEach (tableTo => {
        const links = ref[tableTo];

        refs = setRefPath (
          tableFrom,
          tableTo,
          links,
          refs
        );
      });
    });
  }

  return refs;
};

export default makeRefs;