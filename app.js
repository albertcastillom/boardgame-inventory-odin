const express = require('express');
const path = require('path');
const methodOverride = require("method-override");
const routes = require("./routes");

const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "Views"));



app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

// basic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Internal Server Error");
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});