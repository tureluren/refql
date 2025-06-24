import { Pool } from "pg";
import RefQL from "../RefQL";
import pgQuerier from "../test/pgQuerier";
import userConfig from "../test/userConfig";

const pool = new Pool (userConfig ("pg"));

const querier = pgQuerier (pool);

const { introspect } = RefQL ({ querier });

(async () => {
  try {
    await introspect ();
  } catch (e) {
    console.log (e);
  } finally {
    process.exit (0);
  }
}) ();