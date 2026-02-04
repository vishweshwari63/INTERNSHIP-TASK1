const express = require("express");
const multer = require("multer");
const cors = require("cors");
const db = require("./db");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

/* Create uploads folder */
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

/* Storage */
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

/* Validation */
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "application/pdf",
    ];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid File Type"));
    }
  },
});

/* Upload API */
app.post("/upload", upload.single("file"), (req, res) => {
  const { category } = req.body;
  const file = req.file;

  if (!file)
    return res.status(400).json({ msg: "No File" });

  const sql = `
    INSERT INTO files
    (filename, filepath, category)
    VALUES (?, ?, ?)
  `;

  db.query(
    sql,
    [file.filename, file.path, category],
    (err) => {
      if (err) throw err;

      res.json({ msg: "Uploaded Successfully" });
    }
  );
});

/* Get Files */
app.get("/files", (req, res) => {
  db.query(
    "SELECT * FROM files ORDER BY id DESC",
    (err, data) => {
      if (err) throw err;

      res.json(data);
    }
  );
});

/* Error Handling */
app.use((err, req, res, next) => {
  res.status(400).json({ msg: err.message });
});

/* Start Server */
app.listen(5000, () => {
  console.log("Server Running :5000");
});
