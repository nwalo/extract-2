require("dotenv").config();
const path = require("path");
const express = require("express");
const cookieSession = require("cookie-session");
const mongoose = require("mongoose");
const session = require("express-session");
// const findOrCreate = require("mongoose-findorcreate");

const PORT = process.env.PORT || 3000;
const config = require("./config.js");
if (
  config.credentials.client_id == null ||
  config.credentials.client_secret == null
) {
  console.error(
    "Missing FORGE_CLIENT_ID or FORGE_CLIENT_SECRET env. variables."
  );
  return;
}

// Mongoose Database connection.............
mongoose.connect("mongodb://localhost:27017/partsimonyDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schema Definition..................
const componentSchema = new mongoose.Schema({
  key: String,
  name: String,
  objectId: Number,
  objects: [],
});

const metadataSchema = new mongoose.Schema({
  key: String,
  type: String,
  component: [],
});

// Model Definition .....................
const Component = mongoose.model("Component", componentSchema);
const Metadata = mongoose.model("Metadata", metadataSchema);

// Express Malware Definition ................
let app = express();
app.use(express.static(path.join(__dirname, "public")));
app.use(
  cookieSession({
    name: "forge_session",
    keys: ["forge_secure_key"],
    maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days, same as refresh taoken
  })
);
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use("/api/forge", require("./routes/oauth"));
app.use("/api/forge", require("./routes/datamanagement"));
app.use("/api/forge", require("./routes/user"));
app.use("/api/forge", require("./routes/jobs"));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode).json(err);
});

let data = {};

// Component Hierarchy extraction........
app.post("/post/partsimony/component", (req, res) => {
  let result = req.body.data.objects;
  let comp;
  let compId;
  let compName;
  let output = [];

  let resObjects = result
    .map((i) => {
      return i.objects;
    })
    .flat();

  resObjects.forEach((element) => {
    if (element.objects) {
      let parentId = element.objectid;
      element.objects.forEach((k) => {
        k["parentId"] = parentId;
        output.push(k);
      });
    } else {
      output.push(element);
    }
  });

  result.forEach((i) => {
    req.session.key = i.name + "-" + i.objectid;

    comp = new Component({
      key: req.session.userId + "-" + req.session.key.replaceAll(" ", "-"), // Use a unique identifier to create a key e.g firstName-lastName-designName-objectid
      name: i.name,
      objectId: i.objectid,
      objects: output,
    });

    compId = i.objectid;
    compName = i.name;
  });

  // Output component that would be saved to the database........
  console.log(comp);

  // Saving the component to the database..........
  /* Component.findOne(
    { objectId: compId, name: compName },
    function (err, found) {
      if (err) {
        console.log("err");
      } else {
        if (found) {
          console.log("found Component");
        } else {
          console.log("found not");
          Component.create(comp, function (err, comps) {
            if (!err) {
              comps.save(function (err) {
                if (!err) {
                  console.log("saved component");
                  res.json({ status: true }); //Sends response, if true starts extraction of metadata......
                } else {
                  console.log("didn't save");
                }
              });
            }
          });
        }
      }
    }
  ); */
});

// Metadata extraction ..........
app.post("/post/partsimony/metadata/properties", (req, res) => {
  data = req.body.data;

  let meta = new Metadata({
    key: req.session.userId + "-" + req.session.key.replaceAll(" ", "-"),
    type: data.type,
    component: data.collection,
  });

  // Save Metadata to the database..........
  /* Metadata.findOne({ key: req.session.key }, (err, found) => {
    if (err) {
      console.log("err");
    } else {
      if (!found) {
        meta.save((err) => {
          if (!err) {
            console.log("saved metadata");
          } else {
            return console.log(err);
          }
        });
      } else {
        console.log("yup");
      }
    }
  }); */
  // res.json(data);
});

app.get("/partsimony/get/metadata/properties", (req, res) => {
  res.send(data);
});

// To retrieve metadata ..........
app.get("/retrieve/metadata/properties/:key/:componentId", (req, res) => {
  console.log(req.params.key);

  Metadata.findOne({ key: req.params.key }, (err, found) => {
    if (err) {
      console.log("err");
    } else {
      let output = found.component.find((comp) => {
        return comp.objectid == req.params.componentId;
      });
      console.log(output);
      // res.send(output);
    }
  });

  console.log("sent");
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
