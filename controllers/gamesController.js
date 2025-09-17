const Q = require("../db/queries");

exports.index = async (req, res, next) => {
  try {
    const games = await Q.gamesListAll();
    res.render("games/index", { title: "All Games", games });
  } catch (e) { next(e); }
};

exports.detail = async (req, res, next) => {
  try {
    const game = await Q.gamesFind(req.params.id);
    if (!game) return res.status(404).send("Game not found");
    res.render("games/detail", { title: game.name, game });
  } catch (e) { next(e); }
};

exports.newGet = async (req, res, next) => {
  try {
    const categories = await Q.categoriesAll();
    res.render("games/form", {
      title: "Add Game",
      game: {},
      categories,
      selectedCategoryIds: [],
      errors: null,
      formAction: "/games"
    });
  } catch (e) { next(e); }
};

exports.createPost = async (req, res, next) => {
  try {
    const { name, min_players, max_players, play_time_min } = req.body;
    const selected = Array.isArray(req.body.category_ids)
      ? req.body.category_ids
      : req.body.category_ids ? [req.body.category_ids] : [];

    const payload = {
      name: (name || "").trim(),
      minPlayers: Number(min_players),
      maxPlayers: Number(max_players),
      playTimeMin: Number(play_time_min),
      categoryIds: selected.map(Number)
    };

    const errors = [];
    if (!payload.name) errors.push("Name is required.");
    if (!payload.minPlayers || !payload.maxPlayers) errors.push("Min/Max players required.");
    if (payload.maxPlayers < payload.minPlayers) errors.push("Max players must be ≥ min players.");
    if (Number.isNaN(payload.playTimeMin) || payload.playTimeMin < 0) errors.push("Play time must be ≥ 0.");

    if (errors.length) {
      const categories = await Q.categoriesAll();
      return res.status(400).render("games/form", {
        title: "Add Game", game: payload, categories,
        selectedCategoryIds: payload.categoryIds, errors, formAction: "/games"
      });
    }

    const created = await Q.gamesCreate(payload);
    res.redirect(`/games/${created.id}`);
  } catch (e) { next(e); }
};

exports.editGet = async (req, res, next) => {
  try {
    const [game, categories] = await Promise.all([
      Q.gamesFind(req.params.id),
      Q.categoriesAll()
    ]);
    if (!game) return res.status(404).send("Game not found");
    const selectedIds = await Q.gameSelectedCategoryIds(req.params.id);

    res.render("games/form", {
      title: `Edit ${game.name}`,
      game,
      categories,
      selectedCategoryIds: selectedIds,
      errors: null,
      formAction: `/games/${game.id}?_method=PUT`
    });
  } catch (e) { next(e); }
};

exports.updatePut = async (req, res, next) => {
  try {
    const { name, min_players, max_players, play_time_min } = req.body;
    const selected = Array.isArray(req.body.category_ids)
      ? req.body.category_ids
      : req.body.category_ids ? [req.body.category_ids] : [];

    const payload = {
      name: (name || "").trim(),
      minPlayers: Number(min_players),
      maxPlayers: Number(max_players),
      playTimeMin: Number(play_time_min),
      categoryIds: selected.map(Number)
    };

    const errors = [];
    if (!payload.name) errors.push("Name is required.");
    if (!payload.minPlayers || !payload.maxPlayers) errors.push("Min/Max players required.");
    if (payload.maxPlayers < payload.minPlayers) errors.push("Max players must be ≥ min players.");
    if (Number.isNaN(payload.playTimeMin) || payload.playTimeMin < 0) errors.push("Play time must be ≥ 0.");

    if (errors.length) {
      const categories = await Q.categoriesAll();
      return res.status(400).render("games/form", {
        title: "Edit Game", game: payload, categories,
        selectedCategoryIds: payload.categoryIds, errors,
        formAction: `/games/${req.params.id}?_method=PUT`
      });
    }

    await Q.gamesUpdate(req.params.id, payload);
    res.redirect(`/games/${req.params.id}`);
  } catch (e) { next(e); }
};

exports.deleteGet = async (req, res, next) => {
  try {
    const game = await Q.gamesFind(req.params.id);
    if (!game) return res.status(404).send("Game not found");
    res.render("games/delete", { title: `Delete ${game.name}?`, game });
  } catch (e) { next(e); }
};

exports.deleteDelete = async (req, res, next) => {
  try {
    await Q.gamesDestroy(req.params.id);
    res.redirect("/games");
  } catch (e) { next(e); }
};
