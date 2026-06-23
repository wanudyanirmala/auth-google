require("dotenv").config();

const express = require("express");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const multer = require("multer");

const app = express();

/* =========================
   MEMORY UPLOAD (SAFE VERCEL)
========================= */
const upload = multer({ storage: multer.memoryStorage() });

/* =========================
   GOOGLE AUTH
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

let currentUser = null;

/* =========================
   HOME
========================= */
app.get("/", (req, res) => {
  res.send(`
  <html>
  <head>
    <title>Login App</title>
    <style>
      body {
        font-family: Arial;
        margin: 0;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        background: linear-gradient(135deg,#667eea,#764ba2);
        color: white;
      }
      .box {
        text-align: center;
      }
      a {
        background: white;
        color: black;
        padding: 12px 20px;
        border-radius: 10px;
        text-decoration: none;
        font-weight: bold;
      }
    </style>
  </head>
  <body>
    <div class="box">
      <h1>🚀 Login Google App</h1>
      <a href="/auth/google">Login dengan Google</a>
    </div>
  </body>
  </html>
  `);
});

/* =========================
   LOGIN GOOGLE
========================= */
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

/* =========================
   CALLBACK
========================= */
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    currentUser = req.user;
    res.redirect("/dashboard");
  }
);

/* =========================
   DASHBOARD (MODERN UI)
========================= */
app.get("/dashboard", (req, res) => {
  if (!currentUser) return res.redirect("/");

  const name = currentUser.displayName;
  const email = currentUser.emails?.[0]?.value;
  const photo = currentUser.photos?.[0]?.value;

  res.send(`
  <html>
  <head>
    <title>Dashboard</title>
    <style>
      body {
        margin: 0;
        font-family: Arial;
        background: linear-gradient(135deg, #667eea, #764ba2);
      }

      .container {
        max-width: 900px;
        margin: 50px auto;
        padding: 20px;
      }

      .card {
        background: white;
        padding: 30px;
        border-radius: 20px;
        text-align: center;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      }

      img {
        width: 110px;
        height: 110px;
        border-radius: 50%;
        border: 4px solid #667eea;
        object-fit: cover;
      }

      h1 {
        margin: 10px 0;
      }

      .email {
        color: gray;
        font-size: 14px;
      }

      .upload {
        margin-top: 20px;
        padding: 20px;
        border: 2px dashed #667eea;
        border-radius: 15px;
        background: #f7f7ff;
      }

      button {
        margin-top: 10px;
        padding: 12px 20px;
        border: none;
        background: #667eea;
        color: white;
        border-radius: 10px;
        cursor: pointer;
      }

      button:hover {
        background: #5a67d8;
      }

      a.logout {
        display: inline-block;
        margin-top: 20px;
        color: red;
        text-decoration: none;
        font-weight: bold;
      }
    </style>
  </head>

  <body>
    <div class="container">
      <div class="card">
        <img src="${photo}" />
        <h1>${name}</h1>
        <p class="email">${email}</p>

        <div class="upload">
          <h3>📤 Upload File</h3>
          <form action="/upload" method="POST" enctype="multipart/form-data">
            <input type="file" name="file" />
            <br/>
            <button>Upload</button>
          </form>
        </div>

        <a class="logout" href="/logout">Logout</a>
      </div>
    </div>
  </body>
  </html>
  `);
});

/* =========================
   UPLOAD (MEMORY ONLY)
========================= */
app.post("/upload", upload.single("file"), (req, res) => {
  res.send(`
    <h2>Upload berhasil 🚀</h2>
    <p>File tidak disimpan permanen (Vercel memory mode)</p>
    <a href="/dashboard">Kembali</a>
  `);
});

/* =========================
   LOGOUT
========================= */
app.get("/logout", (req, res) => {
  currentUser = null;
  res.redirect("/");
});

/* =========================
   EXPORT VERCEL
========================= */
module.exports = app;