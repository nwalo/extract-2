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

mongoose.connect("mongodb://localhost:27017/partsimonyDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// SCHEMAS

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

// MODEL

const Component = mongoose.model("Component", componentSchema);
const Metadata = mongoose.model("Metadata", metadataSchema);

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
let global = "";

app.post("/post/partsimony/component", (req, res) => {
  let result = req.body.data.objects;
  let comp;
  let compId;
  let compName;

  result.forEach((i) => {
    req.session.key = i.name + "-" + i.objectid;

    comp = new Component({
      key: req.session.userId + "-" + req.session.key.replaceAll(" ", "-"),
      name: i.name,
      objectId: i.objectid,
      objects: i.objects,
    });

    compId = i.objectid;
    compName = i.name;
  });

  Component.findOne(
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
                  res.json({ status: true });
                } else {
                  console.log("didn't save");
                }
              });
            }
          });
        }
      }
    }
  );

  // res.json({ status: true });
});

app.post("/post/partsimony/metadata/properties", (req, res) => {
  data = req.body.data;

  let meta = new Metadata({
    key: req.session.userId + "-" + req.session.key.replaceAll(" ", "-"),
    type: data.type,
    component: data.collection,
  });

  Metadata.findOne({ key: req.session.key }, (err, found) => {
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
  });

  res.json(data);

  // res.redirect("/partsimony/get/metadata/properties");
});

app.get("/partsimony/get/metadata/properties", (req, res) => {
  res.send(data);
  console.log("sent");
});

app.get("/retrieve/metadata/properties/:key/:componentId", (req, res) => {
  console.log(req.params.key);

  Metadata.findOne({ key: req.params.key }, (err, found) => {
    if (err) {
      console.log("err");
    } else {
      // console.log(found);
      let output = found.component.find((comp) => {
        return comp.objectid == req.params.componentId;
      });
      console.log(output);
      // res.send(output);
    }
  });
  // Metadata

  console.log("sent");
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

let res = [];
Component.findOne(
  { objectId: 47, name: "AUTODESK CAR" },
  function (err, found) {
    if (err) {
      console.log("err");
    } else {
      if (found) {
        console.log("found Component");
        // console.log(found.objects);

        for (const i in found.objects) {
          if (Object.hasOwnProperty.call(found.objects, i)) {
            const element = found.objects[i];
            // console.log(element);
            if (element.objects) {
              let parentId = element.objectid;
              element.objects.forEach((k) => {
                k["parentId"] = parentId;
                res.push(k);
              });
              // console.log("y");
            } else {
              res.push(element);
              // console.log(element);
            }
          }
        }
      } else {
        console.log("found not");
      }
    }
  }
);

// const arr = [
//   {
//     id: 1,
//     name: "Component1:1",
//     properties: {
//       Mass: "619.014 g",
//       Material: "textured",
//       Name: "Component1",
//     },
//   },
//   {
//     id: 2,
//     name: "Body1",
//     properties: {
//       Mass: "619.014 g",
//       Material: "gold",
//       Name: "Body1",
//     },
//   },
//   {
//     id: 3,
//     name: "Component2:1",
//     properties: {
//       Mass: "619.014 g",
//       Material: "Steel",
//       Name: "Component2",
//     },
//   },
//   {
//     id: 4,
//     name: "flange v3",
//     properties: {
//       Mass: "619.014 g",
//       Material: "Steel",
//       Name: "flange",
//     },
//   },
// ];

// ob = [
//   { name: "Component1:1", objectid: 2 },
//   { name: "Component2:1", objectid: 3 },
// ];

// let n = [];
// let names = arr.map((a) => {
//   return a.name;
// });

// // console.log(names);

// for (let i = 0; i < arr.length; i++) {
//   if (ob[i]) {
//     if (names.includes(ob[i].name)) {
//       // console.log("y");
//       let index = names.indexOf(ob[i].name);
//       // console.log(names.indexOf(ob[i].name));
//       n.push(arr[index]);
//     } else {
//       console.log("n");
//     }
//   } else {
//     // console.log(ob[i].name);
//     break;
//   }
// }
// console.log(n);
