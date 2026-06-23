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
   MULTER CONFIG
========================= */
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) =>
      cb(null, Date.now() + "-" + file.originalname),
  }),
});

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
   PASSPORT INIT
========================= */
app.use(passport.initialize());
app.use(passport.session());

/* =========================
   GOOGLE OAUTH
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

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

/* =========================
   ROUTES
========================= */

// HOME
app.get("/", (req, res) => {
  res.send(`
    <html>
      <body style="font-family:Arial;text-align:center;margin-top:80px;">
        <h1>Login Google App</h1>
        <a href="/auth/google"
           style="padding:10px 20px;background:#4285F4;color:white;text-decoration:none;border-radius:8px;">
           Login dengan Google
        </a>
      </body>
    </html>
  `);
});

// LOGIN GOOGLE
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
  <html>
  <head>
    <style>
      body { font-family: Arial; background:#f5f6fa; text-align:center; }
      .card {
        background:white;
        width:400px;
        margin:50px auto;
        padding:20px;
        border-radius:15px;
        box-shadow:0 5px 15px rgba(0,0,0,0.1);
      }
      img { width:100px; border-radius:50%; }
      button {
        margin-top:10px;
        padding:10px;
        background:#4a90e2;
        border:none;
        color:white;
        border-radius:8px;
      }
    </style>
  </head>

  <body>
    <div class="card">
      <img src="${photo}" />
      <h2>${name}</h2>
      <p>${email}</p>

      <form action="/upload" method="POST" enctype="multipart/form-data">
        <input type="file" name="file" />
        <br/>
        <button>Upload File</button>
      </form>

      <br/>
      <a href="/logout">Logout</a>
    </div>
  </body>
  </html>
  `);
});

// UPLOAD FILE
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.send("No file uploaded");

  res.send(`
    <h2>Upload Berhasil 🚀</h2>
    <p>${req.file.filename}</p>
    <a href="/uploads/${req.file.filename}">Lihat File</a>
    <br><br>
    <a href="/dashboard">Kembali</a>
  `);
});

// LOGOUT
app.get("/logout", (req, res) => {
  req.logout(() => res.redirect("/"));
});

/* =========================
   EXPORT FOR VERCEL
========================= */
module.exports = app;