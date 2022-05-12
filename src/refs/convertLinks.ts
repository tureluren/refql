import convertCase from "../more/convertCase";
import { Link, OptCaseType } from "../types";

// links: [["tableFromCol", "tableToCol"]]
// links should be validated before calling this function
const convertLinks = (caseType: OptCaseType, links: Link[]): Link[] =>
  links.map (link =>
    <Link>link.map (l => convertCase (caseType, l))
  );

export default convertLinks;