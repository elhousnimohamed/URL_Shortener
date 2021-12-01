const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const yup = require("yup"); //shema validation
const monk = require("monk");
require("dotenv").config();
const middlewares = require("./middlewares");
const { nanoid } = require("nanoid"); // generate slug if those not exist

const db = monk(process.env.DATABASE_URL);
const urls = db.get("urls");
urls.createIndex({ slug: 1 }, { unique: true });

const app = express();

app.use(helmet());
app.use(morgan("tiny"));
app.use(cors());
app.use(express.json());

app.use(express.static("./public"));
const port = process.env.PORT || 1337;

const schema = yup.object().shape({
  alias: yup
    .string()
    .trim()
    .matches(/[\w\-]/i),
  url: yup.string().trim().url().required(),
});
app.get("/", (req, res) => {
  res.json({ message: "Short URL" });
});

app.get("/", (req, res) => {
  res.json({ message: "Short URL" });
});

app.get("/:id", async (req, res) => {
  const { id: slug } = req.params;
  try {
    const url = await urls.findOne({ slug });
    if (url) res.redirect(url.url);
    res.redirect(`/?error=${slug} Not found`);
  } catch (error) {
    res.redirect(`/?error=Link not found`);
  }
});

app.post("/url", async (req, res, next) => {
  let { slug, url } = req.body;
  try {
    if (!slug) {
      slug = nanoid(5);
    } else {
      const existing = await urls.findOne({ slug });
      if (existing) {
        throw new Error("Slug in use 😠😠😠 ");
      }
    }
    await schema.validate({
      slug,
      url,
    });
    slug = slug.toLowerCase();
    const newUrl = {
      url,
      slug,
    };
    const created = await urls.insert(newUrl);
    res.json(created);
  } catch (error) {
    next(error);
  }
});

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

app.listen(port, () => console.log(`listening at ${port} !`));
