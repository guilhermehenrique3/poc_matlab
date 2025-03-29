const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const cors = require("cors");
const fs = require("fs");
const { MongoClient } = require("mongodb");
const { trainPLS } = require("./plsexample.js");
const Y = require("./YMatrix.js").Y;

const uri =
  "mongodb+srv://guilhermehenriqu3:6UZDKQbsBNFLNqxy@cluster0.nfcvk.mongodb.net/?retryWrites=true&w=majority";
const app = express();
app.use(cors());
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

function agruparPorAmostraEMedia(arr) {
  const agrupado = arr.reduce((acc, item) => {
    if (!acc[item.Amostra]) {
      acc[item.Amostra] = [];
    }
    acc[item.Amostra].push(item.Values.map((v) => Number(v.Intensity)));
    return acc;
  }, {});

  return Object.keys(agrupado).map((amostra) => {
    const matriz = agrupado[amostra];
    const maxLength = Math.max(...matriz.map((arr) => arr.length));

    const mediaValues = Array.from({ length: maxLength }, (_, i) => {
      const valoresNaPosicao = matriz
        .map((arr) => arr[i] || 0)
        .filter((val) => !isNaN(val));

      const media =
        valoresNaPosicao.length > 0
          ? valoresNaPosicao.reduce((a, b) => a + b, 0) / valoresNaPosicao.length
          : 0;

      return { Intensity: media };
    });

    return {
      Amostra: amostra,
      MediaValues: mediaValues,
      UploadedAt: new Date(),
    };
  });
}

function formatData(filename, arr) {
  const noEmpty = arr.filter((item) => Object.keys(item).length > 0);

  const parsed = noEmpty.map((i) => ({
    Intensity: parseFloat(i["_1"]?.split(";")[1] + "." + i["_2"]),
  }));

  return {
    UploadedAt: new Date(),
    Amostra: filename?.split(`-`)[0],
    Values: parsed,
  };
}

function formatarParaX(data) {
  return data.map((item, index) => [...item.MediaValues.map((v) => Number(v.Intensity))]);
}

app.post("/upload", upload.array("csvfiles", 314), async (req, res) => {
  if (!db) {
    console.error("Erro: db está undefined");
    return res.status(500).send("Erro: Banco de dados não conectado.");
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).send("Nenhum arquivo enviado.");
  }

  try {
    const collection = db.collection("CSVFiles");
    const collectionData = db.collection("processedData");

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

    const groups = agruparPorAmostraEMedia(documents);

    const toSave = {
      uploadedAt: new Date(),
      matrizX: formatarParaX(groups),
      matrizY: Y,
    };

    // await collection.insertOne(toSave);

    const trainedData = {
      uploadedAt: new Date(),
      results: trainPLS(formatarParaX(groups)),
    };

    console.log("trainedData", trainedData);

    // await collectionData.insertOne(trainedData);

    res.status(200).json({
      message: `${req.files.length} arquivos processados com sucesso!`,
      data: trainedData,
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

app.get("/processedData", async (req, res) => {
  try {
    const collection = db.collection("processedData");
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
