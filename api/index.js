require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const multer = require("multer");
const fs = require("fs");

const app = express();

/* =========================
   UPLOAD FOLDER
========================= */
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

/* =========================
   MULTER
========================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

/* =========================
   SESSION (Vercel safe)
========================= */
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

/* =========================
   PASSPORT
========================= */
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

/* =========================
   ROUTES
========================= */

// ROOT (INI PENTING BIAR TIDAK 404)
app.get("/", (req, res) => {
  res.send(`
    <h1>Login App</h1>
    <a href="/auth/google">Login Google</a>
  `);
});

// GOOGLE LOGIN
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// CALLBACK
app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/",
  }),
  (req, res) => {
    res.redirect("/dashboard");
  }
);

// DASHBOARD
app.get("/dashboard", (req, res) => {
  if (!req.user) return res.redirect("/");

  const name = req.user.displayName;
  const email = req.user.emails?.[0]?.value;
  const photo = req.user.photos?.[0]?.value;

  res.send(`
    <h1>Dashboard</h1>
    <img src="${photo}" width="100" style="border-radius:50%" />
    <p>${name}</p>
    <p>${email}</p>

    <form action="/upload" method="POST" enctype="multipart/form-data">
      <input type="file" name="file" />
      <button>Upload</button>
    </form>

    <a href="/logout">Logout</a>
  `);
});

// UPLOAD
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.send("No file");

  res.send(`
    File: ${req.file.filename}
    <br>
    <a href="/uploads/${req.file.filename}">Lihat File</a>
    <br>
    <a href="/dashboard">Back</a>
  `);
});

// LOGOUT
app.get("/logout", (req, res) => {
  req.logout(() => res.redirect("/"));
});

/* =========================
   EXPORT (WAJIB VERCEL)
========================= */
module.exports = app;