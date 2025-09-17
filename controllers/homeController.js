const Q = require("../db/queries");

exports.homeGet = async (req, res, next) => {
  try {
    const selectedCategoryId = req.query.category ? Number(req.query.category) : null;
    const [categories, games] = await Promise.all([
      Q.categoriesAllWithCounts(),
      Q.gamesListAll({ categoryId: selectedCategoryId || undefined }),
    ]);

    res.render("home", {
      title: "Board Game Library",
      categories,
      games,
      selectedCategoryId
    });
  } catch (e) { next(e); }
};
