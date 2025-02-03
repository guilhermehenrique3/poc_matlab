const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const { MongoClient } = require("mongodb");

const uri =
  "mongodb+srv://guilhermehenriqu3:6UZDKQbsBNFLNqxy@cluster0.nfcvk.mongodb.net/?retryWrites=true&w=majority";
const app = express();
const port = 3000;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

let db;
MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((client) => {
    console.log("Conectado ao MongoDB Atlas!");
    db = client.db("POCTOMASI");
  })
  .catch((err) => {
    console.error("Erro ao conectar ao MongoDB", err);
  });

function formatData(filename, arr) {
  noEmpty = arr.filter((item) => Object.keys(item).length > 0);

  const parsed = noEmpty.map((i) => ({
    Intensity: i["_1"]?.split(";")[1] + "." + i["_2"],
  }));

  const sum = parsed.reduce((acc, curr) => acc + Number(curr.Intensity), 0);
  const average = sum / parsed.length;
  return {
    uploadedAt: new Date(),
    Amostra: filename?.split(`-`)[0],
    Media: average,
  };
}

function agruparEMedia(arr) {
  const agrupado = arr.reduce((acc, item) => {
    if (!acc[item.Amostra]) {
      acc[item.Amostra] = { Amostra: item.Amostra, MediaTotal: 0, Count: 0 };
    }
    acc[item.Amostra].MediaTotal += item.Media;
    acc[item.Amostra].Count += 1;
    return acc;
  }, {});

  return Object.values(agrupado).map(({ Amostra, MediaTotal, Count }) => ({
    Amostra,
    Media: MediaTotal / Count,
  }));
}

app.post("/upload", upload.array("csvfiles", 314), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send("Nenhum arquivo enviado.");
  }

  try {
    const collection = db.collection("CSVFiles");
    const documents = [];

    await Promise.all(
      req.files.map(async (file) => {
        const results = [];

        return new Promise((resolve, reject) => {
          fs.createReadStream(file.path)
            .pipe(csv())
            .on("data", (data) => results.push(data))
            .on("end", async () => {
              try {
                const document = formatData(file.originalname, results);
                documents.push(document);
                fs.unlinkSync(file.path);
                resolve();
              } catch (error) {
                reject(error);
              }
            })
            .on("error", (error) => {
              fs.unlinkSync(file.path);
              reject(error);
            });
        });
      })
    );

    console.log(`documents`, documents);

    const groups = agruparEMedia(documents);

    const toSave = {
      uploadedAt: new Date(),
      amostras: groups,
    };

    console.log(`agrupado`, agruparEMedia(documents));

    await collection.insertOne(toSave);
    res.status(200).json({
      message: `${req.files.length} arquivos processados com sucesso!`,
      data: documents,
    });
  } catch (error) {
    console.error("Erro no processamento:", error);
    res.status(500).send("Erro durante o processamento dos arquivos.");
  }
});

app.get("/data", async (req, res) => {
  try {
    const collection = db.collection("CSVFiles");
    const data = await collection.find().toArray();
    res.json(data);
  } catch (error) {
    console.error("Erro ao buscar os dados:", error);
    res.status(500).send("Erro ao buscar os dados.");
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
