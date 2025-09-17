const Q = require("../db/queries");

exports.index = async (req, res, next) => {
  try {
    const categories = await Q.categoriesAllWithCounts();
    res.render("categories/index", { title: "Categories", categories });
  } catch (e) { next(e); }
};

exports.detail = async (req, res, next) => {
  try {
    const cat = await Q.categoriesFind(req.params.id);
    if (!cat) return res.status(404).send("Category not found");
    const games = await Q.categoriesGames(cat.id);
    res.render("categories/detail", { title: cat.name, category: cat, games });
  } catch (e) { next(e); }
};

exports.newGet = (req, res) => {
  res.render("categories/form", { title: "Add Category", category: {}, errors: null, formAction: "/categories" });
};

exports.createPost = async (req, res, next) => {
  try {
    const name = (req.body.name || "").trim();
    if (!name) {
      return res.status(400).render("categories/form", { title: "Add Category", category: { name }, errors: ["Name is required"], formAction: "/categories" });
    }
    await Q.categoriesCreate({ name });
    res.redirect("/categories");
  } catch (e) { next(e); }
};

exports.editGet = async (req, res, next) => {
  try {
    const category = await Q.categoriesFind(req.params.id);
    if (!category) return res.status(404).send("Category not found");
    res.render("categories/form", { title: `Edit ${category.name}`, category, errors: null, formAction: `/categories/${category.id}?_method=PUT` });
  } catch (e) { next(e); }
};

exports.updatePut = async (req, res, next) => {
  try {
    const updated = await Q.categoriesUpdate(req.params.id, { name: req.body.name || "" });
    if (!updated) return res.status(404).send("Category not found");
    res.redirect(`/categories/${updated.id}`);
  } catch (e) { next(e); }
};

exports.deleteGet = async (req, res, next) => {
  try {
    const category = await Q.categoriesFind(req.params.id);
    if (!category) return res.status(404).send("Category not found");
    res.render("categories/delete", { title: `Delete ${category.name}?`, category });
  } catch (e) { next(e); }
};

exports.deleteDelete = async (req, res, next) => {
  try {
    await Q.categoriesDestroy(req.params.id); // links in game_categories auto-removed
    res.redirect("/categories");
  } catch (e) { next(e); }
};
