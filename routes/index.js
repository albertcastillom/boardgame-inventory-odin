const express = require("express");
const router = express.Router();

const home = require("../controllers/homeController");
const cats = require("../controllers/categoriesController");
const games = require("../controllers/gamesController");

// Home
router.get("/", home.homeGet);

// Categories CRUD
router.get("/categories", cats.index);
router.get("/categories/new", cats.newGet);
router.post("/categories", cats.createPost);
router.get("/categories/:id", cats.detail);
router.get("/categories/:id/edit", cats.editGet);
router.put("/categories/:id", cats.updatePut);
router.get("/categories/:id/delete", cats.deleteGet);
router.delete("/categories/:id", cats.deleteDelete);

// Games CRUD
router.get("/games", games.index);
router.get("/games/new", games.newGet);
router.post("/games", games.createPost);
router.get("/games/:id", games.detail);
router.get("/games/:id/edit", games.editGet);
router.put("/games/:id", games.updatePut);
router.get("/games/:id/delete", games.deleteGet);
router.delete("/games/:id", games.deleteDelete);

module.exports = router;
