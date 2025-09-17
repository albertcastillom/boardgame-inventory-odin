const db = require("./pool");

// ---------- CATEGORIES ----------
async function categoriesAllWithCounts() {
  const { rows } = await db.query(
    `SELECT c.id, c.name, COUNT(gc.game_id)::int AS game_count
       FROM categories c
  LEFT JOIN game_categories gc ON gc.category_id = c.id
   GROUP BY c.id
   ORDER BY c.name;`
  );
  return rows;
}

async function categoriesAll() {
  const { rows } = await db.query(`SELECT id, name FROM categories ORDER BY name;`);
  return rows;
}

async function categoriesFind(id) {
  const { rows } = await db.query(`SELECT id, name FROM categories WHERE id = $1;`, [id]);
  return rows[0] || null;
}

async function categoriesCreate({ name }) {
  const { rows } = await db.query(
    `INSERT INTO categories (name) VALUES ($1) RETURNING *;`,
    [name.trim()]
  );
  return rows[0];
}

async function categoriesUpdate(id, { name }) {
  const { rows } = await db.query(
    `UPDATE categories SET name = $1 WHERE id = $2 RETURNING *;`,
    [name.trim(), id]
  );
  return rows[0] || null;
}

async function categoriesDestroy(id) {
  const { rowCount } = await db.query(`DELETE FROM categories WHERE id = $1;`, [id]);
  return rowCount > 0;
}

async function categoriesGames(categoryId) {
  const { rows } = await db.query(
    `SELECT g.id, g.name, g.min_players, g.max_players, g.play_time_min
       FROM games g
       JOIN game_categories gc ON gc.game_id = g.id
      WHERE gc.category_id = $1
      ORDER BY g.name;`,
    [categoryId]
  );
  return rows;
}

// ---------- GAMES ----------
async function gamesListAll({ categoryId } = {}) {
  if (categoryId) {
    const { rows } = await db.query(
      `SELECT g.id, g.name, g.min_players, g.max_players, g.play_time_min,
              ARRAY_AGG(c.name ORDER BY c.name) FILTER (WHERE c.id IS NOT NULL) AS categories
         FROM games g
         JOIN game_categories gc ON gc.game_id = g.id
         JOIN categories c ON c.id = gc.category_id
        WHERE c.id = $1
        GROUP BY g.id
        ORDER BY g.name;`,
      [categoryId]
    );
    return rows;
  }

  const { rows } = await db.query(
    `SELECT g.id, g.name, g.min_players, g.max_players, g.play_time_min,
            ARRAY_AGG(c.name ORDER BY c.name) FILTER (WHERE c.id IS NOT NULL) AS categories
       FROM games g
  LEFT JOIN game_categories gc ON gc.game_id = g.id
  LEFT JOIN categories c ON c.id = gc.category_id
      GROUP BY g.id
      ORDER BY g.name;`
  );
  return rows;
}

async function gamesFind(id) {
  const { rows } = await db.query(
    `SELECT g.id, g.name, g.min_players, g.max_players, g.play_time_min,
            ARRAY_AGG(c.name ORDER BY c.name) FILTER (WHERE c.id IS NOT NULL) AS categories
       FROM games g
  LEFT JOIN game_categories gc ON gc.game_id = g.id
  LEFT JOIN categories c ON c.id = gc.category_id
      WHERE g.id = $1
      GROUP BY g.id;`,
    [id]
  );
  return rows[0] || null;
}

// Create game + link categories (transaction)
async function gamesCreate({ name, minPlayers, maxPlayers, playTimeMin, categoryIds = [] }) {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `INSERT INTO games (name, min_players, max_players, play_time_min)
       VALUES ($1, $2, $3, $4)
       RETURNING *;`,
      [name.trim(), minPlayers, maxPlayers, playTimeMin]
    );
    const game = rows[0];

    for (const cid of categoryIds) {
      await client.query(
        `INSERT INTO game_categories (game_id, category_id)
         VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
        [game.id, Number(cid)]
      );
    }

    await client.query("COMMIT");
    return game;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

// Update game + replace links (transaction)
async function gamesUpdate(id, { name, minPlayers, maxPlayers, playTimeMin, categoryIds = [] }) {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `UPDATE games
          SET name = $1,
              min_players = $2,
              max_players = $3,
              play_time_min = $4
        WHERE id = $5
      RETURNING *;`,
      [name.trim(), minPlayers, maxPlayers, playTimeMin, id]
    );
    const game = rows[0];

    await client.query(`DELETE FROM game_categories WHERE game_id = $1;`, [id]);
    for (const cid of categoryIds) {
      await client.query(
        `INSERT INTO game_categories (game_id, category_id)
         VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
        [id, Number(cid)]
      );
    }

    await client.query("COMMIT");
    return game;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

async function gamesDestroy(id) {
  const { rowCount } = await db.query(`DELETE FROM games WHERE id = $1;`, [id]);
  return rowCount > 0;
}

async function gameSelectedCategoryIds(gameId) {
  const { rows } = await db.query(
    `SELECT category_id FROM game_categories WHERE game_id = $1`,
    [gameId]
  );
  return rows.map((r) => r.category_id);
}

module.exports = {
  // categories
  categoriesAllWithCounts,
  categoriesAll,
  categoriesFind,
  categoriesCreate,
  categoriesUpdate,
  categoriesDestroy,
  categoriesGames,
  // games
  gamesListAll,
  gamesFind,
  gamesCreate,
  gamesUpdate,
  gamesDestroy,
  gameSelectedCategoryIds,
};
