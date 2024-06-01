import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "fs";
import { join } from "path";
import express, { json, urlencoded } from "express";
import { execSync } from "child_process";

const app = express();

const logger = (...value) =>
  console.log(
    `Pid: ${process.pid} -`,
    `Date ${new Date().toISOString()} -`,
    ...value
  );

app.listen(5656, logger(`Server ON: Port - 5656 `));
app.use(urlencoded({ extended: true }), json());

const INSTANCE_PATH = "instances";

if (!existsSync(INSTANCE_PATH)) {
  mkdirSync(INSTANCE_PATH, { recursive: true });
}

app.options("/session/ping", function (req, res) {
  logger("Http - Path: ", req.path);
  res.status(200).json({ pong: true });
});

app.post("/session/:prefix", function (req, res) {
  const { prefix } = req.params;
  const body = req.body;

  const path = join(`${INSTANCE_PATH}/${prefix}`, body.instance);

  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }

  res.status(202).send();
});

app.post(`/session/:prefix/:instance/:key`, function (req, res) {
  const { prefix, instance, key } = req.params;
  const body = req.body;

  const path = join(`${INSTANCE_PATH}/${prefix}`, instance, key + ".json");

  writeFileSync(path, body.data || {}, { encoding: "utf8" });

  res.status(202).send();
});

app.get("/session/:prefix/:instance/:key", function (req, res) {
  const { prefix, instance, key } = req.params;

  const path = join(`${INSTANCE_PATH}/${prefix}`, instance, key + ".json");

  if (existsSync(path)) {
    const data = readFileSync(path, { encoding: "utf8" });
    res.status(200).send(data);
  }

  res.status(200).send();
});

app.delete("/session/:prefix/:instance/:key", function (req, res) {
  const { prefix, instance, key } = req.params;

  const path = join(`${INSTANCE_PATH}/${prefix}`, instance, key + ".json");

  rmSync(path, { recursive: true });

  res.status(200).send();
});

app.delete(`/session/:prefix/:instance`, function (req, res) {
  const { prefix, instance } = req.params;

  const path = join(`${INSTANCE_PATH}/${prefix}`, instance);

  execSync(`rm -rf ${path}`);

  res.status(200).send();
});

app.get("/session/list-instances/:prefix", function (req, res) {
  const { prefix } = req.params;

  const path = `${INSTANCE_PATH}/${prefix}`;

  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }

  const files = readdirSync(path);

  res.status(200).json(files);
});
