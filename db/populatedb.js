const db = require("./pool");

const schema = `
CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS games (
  id             SERIAL PRIMARY KEY,
  name           TEXT NOT NULL UNIQUE,
  min_players    INTEGER NOT NULL CHECK (min_players >= 1),
  max_players    INTEGER NOT NULL CHECK (max_players >= min_players),
  play_time_min  INTEGER NOT NULL CHECK (play_time_min >= 0),
  created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_categories (
  game_id     INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (game_id, category_id)
);
`;

async function seed() {
  await db.query("BEGIN");
  try {
    const catNames = ['TCG','Co-op','Strategy','Card Game','2 Players','RPG'];
    const catMap = {};
    for (const name of catNames) {
      const { rows } = await db.query(
        `INSERT INTO categories (name)
         VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING *;`,
        [name]
      );
      catMap[name] = rows[0];
    }

    async function upsertGame({ name, min, max, time, cats }) {
      const { rows } = await db.query(
        `INSERT INTO games (name, min_players, max_players, play_time_min)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (name) DO UPDATE
           SET min_players = EXCLUDED.min_players,
               max_players = EXCLUDED.max_players,
               play_time_min = EXCLUDED.play_time_min
         RETURNING *;`,
        [name, min, max, time]
      );
      const game = rows[0];
      await db.query(`DELETE FROM game_categories WHERE game_id = $1`, [game.id]);
      for (const cname of cats) {
 const cat = catMap[cname];
        if (cat) {
          await db.query(
            `INSERT INTO game_categories (game_id, category_id)
             VALUES ($1,$2) ON CONFLICT DO NOTHING;`,
            [game.id, cat.id]
          );
        }
      }
    }

    await upsertGame({ name: "Gloomhaven", min: 1, max: 4, time: 120, cats: ["RPG","Strategy","Co-op"] });
    await upsertGame({ name: "Azul",       min: 2, max: 4, time: 45,  cats: ["Strategy"] });
    await upsertGame({ name: "Exploding Kittens", min: 2, max: 5, time: 20, cats: ["Card Game"] });
    await upsertGame({ name: "Pandemic",   min: 2, max: 4, time: 60,  cats: ["Co-op","Strategy"] });
    await upsertGame({ name: "Jaipur",     min: 2, max: 2, time: 30,  cats: ["2 Players","Card Game"] });

    await db.query("COMMIT");
    console.log("✅ Seed complete.");
  } catch (e) {
    await db.query("ROLLBACK");
    console.error("❌ Seed failed:", e);
  } finally {
    db.pool.end();
  }
}

(async () => {
  try {
    await db.query(schema);
    console.log("✅ Schema ready");
    await seed();
  } catch (e) {
    console.error("❌ Init failed:", e);
    db.pool.end();
  }
})();