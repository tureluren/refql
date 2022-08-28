import convertCase from "../more/convertCase";
import { Link, CaseType } from "../types";

// links: [["tableFromCol", "tableToCol"]]
// links should be validated before calling this function
const convertLinks = (caseType: CaseType, links: Link[]): Link[] =>
  links.map (link =>
    <Link>link.map (l => convertCase (caseType, l))
  );

export default convertLinks;