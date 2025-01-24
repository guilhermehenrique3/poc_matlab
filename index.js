const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");

const app = express();
const port = 3000;

const upload = multer({ dest: "uploads/" });

// Rota para upload de arquivo CSV
app.post("/upload", upload.single("csvfile"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("Nenhum arquivo enviado.");
  }

  const filePath = req.file.path;
  const results = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", () => {
      fs.unlinkSync(filePath);

      res.json(results);
    })
    .on("error", (error) => {
      res.status(500).send("Erro ao processar o arquivo CSV.");
    });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
