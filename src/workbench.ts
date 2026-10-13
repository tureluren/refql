import { Pool } from "pg";
import RefQL from ".";

const pool = new Pool ({
  user: "test",
  host: "localhost",
  database: "soccer",
  password: "test",
  port: 3308
});


const querier = async (query: string, values: any[]) => {
  console.log ("'" + query + "'");
  // console.log (values);
  const res = await pool.query (query, values);

  return res.rows;
};


const { sql, tables } = RefQL ({
  querier
});

const { Player } = tables.public;
const { id } = Player.props;

// No explicit selection: select all Player props except id.
Player ([id.omit ()]) ().then (([p]) => {
  // Expected: { birthday, cars, firstName, lastName, positionId, teamId }
  console.log (p);
});

// An explicit selection in the right operand restores id.
Player ([id.omit ()]).concat (Player (["id", "firstName"])) ().then (([p]) => {
  // Expected: { id, firstName }
  console.log (p);
});

// Selection also wins when it occurs in the left operand.
Player (["id", "firstName"]).concat (Player ([id.omit ()])) ().then (([p]) => {
  // Expected: { id, firstName }
  console.log (p);
});

// If both operands omit id, implicit select-all still excludes id.
Player ([id.omit ()]).concat (Player ([id.omit ()])) ().then (([p]) => {
  // Expected: { birthday, cars, firstName, lastName, positionId, teamId }
  console.log (p);
});

// An explicit selection disables the final select-all fallback.
Player ([id.omit ()]).concat (Player (["firstName"])) ().then (([p]) => {
  // Expected: { firstName }
  console.log (p);
});

// An empty tag is the concat identity and does not restore id.
Player ([id.omit ()]).concat (Player ([])) ().then (([p]) => {
  // Expected: { birthday, cars, firstName, lastName, positionId, teamId }
  console.log (p);
});

// A filter-only tag contributes its filter, but no selection fields.
Player ([id.omit ()]).concat (Player ([sql`and player.id > 0`])) ().then (([p]) => {
  // Expected: { birthday, cars, firstName, lastName, positionId, teamId }
  console.log (p);
});

const omitId = Player ([id.omit ()]);
const selectId = Player (["id"]);
const selectFirstName = Player (["firstName"]);

// Left-associated Semigroup composition.
omitId.concat (selectId).concat (selectFirstName) ().then (([p]) => {
  // Expected: { id, firstName }
  console.log (p);
});

// Right-associated Semigroup composition: same output as above.
omitId.concat (selectId.concat (selectFirstName)) ().then (([p]) => {
  // Expected: { id, firstName }
  console.log (p);
});

const selection = Player (["id", "firstName"]);
const empty = Player ([]);

// Left Monoid identity.
empty.concat (selection) ().then (([p]) => {
  // Expected: { id, firstName }
  console.log (p);
});

// Right Monoid identity.
selection.concat (empty) ().then (([p]) => {
  // Expected: { id, firstName }
  console.log (p);
});

// Within one tag, omit wins over selecting the same prop.
Player ([id, id.omit (), "firstName"]) ().then (([p]) => {
  // Expected: { firstName }
  console.log (p);
});