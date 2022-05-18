import { Pool } from "pg";
import querier from "../test/querier";
import userConfig from "../test/userConfig";
import readRefs from "./readRefs";

describe ("RefQL `readRefs` - read db refs from a database", () => {
  test ("Refs received", async () => {
    const pool = new Pool (userConfig);

    const [firstRef] = await readRefs (querier (pool));

    expect (firstRef).toHaveProperty ("tableFrom");
    expect (firstRef).toHaveProperty ("constraint");

    await pool.end ();
  });
});