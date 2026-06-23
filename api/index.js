require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const multer = require("multer");
const fs = require("fs");

const app = express();

/* =========================
   CREATE UPLOADS FOLDER
========================= */
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

/* =========================
   MULTER CONFIG
========================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

/* =========================
   SESSION
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

/* =========================
   SESSION SERIALIZE
========================= */
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

/* =========================
   STATIC FILES
========================= */
app.use("/uploads", express.static("uploads"));

/* =========================
   ROUTES
========================= */

// HOME
app.get("/", (req, res) => {
  res.send(`
    <html>
      <body style="font-family:Arial;text-align:center;margin-top:100px;">
        <h1>Login App</h1>
        <a href="/auth/google" style="padding:10px 15px;background:#4285F4;color:white;text-decoration:none;border-radius:8px;">
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

// DASHBOARD (MODERN UI)
app.get("/dashboard", (req, res) => {
  if (!req.user) return res.redirect("/");

  const name = req.user.displayName;
  const email = req.user.emails?.[0]?.value;
  const photo = req.user.photos?.[0]?.value;

  res.send(`
  <html>
  <head>
    <title>Dashboard</title>
    <style>
      body {
        margin: 0;
        font-family: Arial, sans-serif;
        background: #f4f6f9;
      }

      .container {
        max-width: 800px;
        margin: 50px auto;
        padding: 20px;
      }

      .card {
        background: white;
        padding: 25px;
        border-radius: 15px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        text-align: center;
      }

      img {
        width: 110px;
        height: 110px;
        border-radius: 50%;
        object-fit: cover;
        margin-bottom: 10px;
      }

      h1 {
        margin: 10px 0;
      }

      p {
        color: #666;
      }

      .upload-box {
        margin-top: 20px;
        padding: 15px;
        border: 2px dashed #ccc;
        border-radius: 12px;
      }

      input {
        margin-top: 10px;
      }

      button {
        margin-top: 10px;
        padding: 10px 15px;
        border: none;
        background: #4a90e2;
        color: white;
        border-radius: 8px;
        cursor: pointer;
      }

      button:hover {
        background: #357bd8;
      }

      a.logout {
        display: inline-block;
        margin-top: 15px;
        color: red;
        text-decoration: none;
      }
    </style>
  </head>

  <body>
    <div class="container">
      <div class="card">
        <img src="${photo}" />
        <h1>${name}</h1>
        <p>${email}</p>

        <div class="upload-box">
          <h3>Upload File</h3>
          <form action="/upload" method="POST" enctype="multipart/form-data">
            <input type="file" name="file" />
            <br />
            <button type="submit">Upload</button>
          </form>
        </div>

        <a class="logout" href="/logout">Logout</a>
      </div>
    </div>
  </body>
  </html>
  `);
});

// UPLOAD FILE
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");

  res.send(`
    <h2>Upload Berhasil</h2>
    <p>${req.file.filename}</p>
    <a href="/uploads/${req.file.filename}" target="_blank">Lihat File</a>
    <br><br>
    <a href="/dashboard">Kembali</a>
  `);
});

// LOGOUT
app.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});

/* =========================
   SERVER
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
});