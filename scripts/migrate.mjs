import { readFile } from "node:fs/promises";
import { database, transaction } from "../server/db.mjs";
try {
  await transaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(74592431)");
    await client.query(
      "CREATE TABLE IF NOT EXISTS public.rudhira_migrations (name text PRIMARY KEY, applied_at timestamptz DEFAULT now())",
    );
    for (const name of ["001_network.sql", "002_void_reason.sql", "003_benefit_programs.sql"]) {
      const { rows } = await client.query(
        "SELECT name FROM public.rudhira_migrations WHERE name=$1",
        [name],
      );
      if (!rows.length) {
        await client.query(
          await readFile(
            new URL(`../migrations/${name}`, import.meta.url),
            "utf8",
          ),
        );
        await client.query(
          "INSERT INTO public.rudhira_migrations(name) VALUES($1)",
          [name],
        );
      }
    }
  });
  console.log("Network database migration completed.");
} catch (e) {
  console.error("Migration failed:", e.code || e.name);
  process.exitCode = 1;
} finally {
  await database().end();
}
