require("dotenv").config();

const express = require("express");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const multer = require("multer");

const app = express();

/* =========================
   MULTER (MEMORY ONLY - SAFE VERCEL)
========================= */
const upload = multer({ storage: multer.memoryStorage() });

/* =========================
   GOOGLE STRATEGY
========================= */
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

app.use(passport.initialize());

/* =========================
   SIMPLE USER STORE (NO SESSION)
========================= */
let currentUser = null;

/* =========================
   ROUTES
========================= */

app.get("/", (req, res) => {
  res.send(`
    <h1>Login App</h1>
    <a href="/auth/google">Login Google</a>
  `);
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    currentUser = req.user;
    res.redirect("/dashboard");
  }
);

app.get("/dashboard", (req, res) => {
  if (!currentUser) return res.redirect("/");

  res.send(`
    <h1>Dashboard</h1>
    <img src="${currentUser.photos?.[0]?.value}" width="100"/>
    <p>${currentUser.displayName}</p>
    <p>${currentUser.emails?.[0]?.value}</p>

    <form action="/upload" method="POST" enctype="multipart/form-data">
      <input type="file" name="file" />
      <button>Upload</button>
    </form>

    <a href="/logout">Logout</a>
  `);
});

app.post("/upload", upload.single("file"), (req, res) => {
  res.send("Upload berhasil (memory mode)");
});

app.get("/logout", (req, res) => {
  currentUser = null;
  res.redirect("/");
});

/* =========================
   EXPORT
========================= */
module.exports = app;