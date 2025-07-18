import { SQLTag } from "../SQLTag/index.ts";
import Raw from "../SQLTag/Raw.ts";
import { sqlX } from "../SQLTag/sql.ts";

const joinMembers = (tempMembers: {as: string; node: Raw | SQLTag; isOmitted: boolean}[]) => {
  const members = tempMembers
    .reduce ((acc, member) => {
      const existing = acc[member.as];

      // && otherwise impossible the construct output type after concatenation (output & output2) when dealing with ignored props
      const nextIsOmmitted = existing ? existing.isOmitted && member.isOmitted : member.isOmitted;

      acc[member.as] = { node: member.node, isOmitted: nextIsOmmitted };

      return acc;
    }, {} as {[as: string]: {node: Raw | SQLTag; isOmitted: boolean}});

  return Object.values (members)
    .filter (m => !m.isOmitted)
    .map (m => m.node)
    .reduce ((tag: SQLTag, member, idx) =>
    tag.join (idx === 0 ? "" : ", ", Raw.isRaw (member) ? sqlX`${member}` : member as SQLTag), sqlX``);
};

export default joinMembers;