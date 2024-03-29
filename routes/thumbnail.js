// const express = require("express");
// const { HubsApi, ProjectsApi, FoldersApi, ItemsApi } = require("forge-apis");

// const {
//   DerivativesApi,
//   JobPayload,
//   JobPayloadInput,
//   JobPayloadOutput,
//   JobSvfOutputPayload,
// } = require("forge-apis");

// const { OAuth, getClient, getInternalToken } = require("./common/oauth");

// let router = express.Router();

// // Middleware for obtaining a token for each request.
// router.use(async (req, res, next) => {
//   const oauth = new OAuth(req.session);
//   const token = await oauth.getInternalToken();
//   console.log(token);
//   req.oauth_token = token;
//   req.oauth_client = await oauth.getClient();
//   next();
// });

// // POST /api/forge/modelderivative/jobs - submits a new translation job for given object URN.
// // Request body must be a valid JSON in the form of { "objectName": "<translated-object-urn>" }.
// router.post("/modelderivative/thumbnail", async (req, res, next) => {
//   let job = new JobPayload();
//   job.input = new JobPayloadInput();
//   job.input.urn = req.body.urn;
//   job.output = new JobPayloadOutput([new JobSvfOutputPayload()]);
//   job.output.formats[0].type = "svf";
//   job.output.formats[0].views = ["2d", "3d"];

//   console.log(job);
//   // return
//   try {
//     // Submit a translation job using [DerivativesApi](https://github.com/Autodesk-Forge/forge-api-nodejs-client/blob/master/docs/DerivativesApi.md#translate).
//     await new DerivativesApi().translate(
//       job,
//       {},
//       req.oauth_client,
//       req.oauth_token
//     );
//     console.log("success");
//     res.json({ urn: job.input.urn, token: req.oauth_token });
//     res.status(200).end();
//   } catch (err) {
//     next(err);
//   }
// });

// module.exports = router;

// // /api/forge/modelderivative/jobs
