var viewer;

// @urn the model to show
// @viewablesId which viewables to show, applies to BIM 360 Plans folder
function launchViewer(urn, vid, viewableId) {
  console.log("clicked viewer");
  console.log(vid);

  var options = {
    env: "AutodeskProduction",
    getAccessToken: getForgeToken,
  };

  Autodesk.Viewing.Initializer(options, () => {
    viewer = new Autodesk.Viewing.GuiViewer3D(
      document.getElementById("forgeViewer"),
      { extensions: ["Autodesk.DocumentBrowser"] }
    );

    viewer.start();

    var documentId = "urn:" + urn;
    Autodesk.Viewing.Document.load(
      documentId,
      onDocumentLoadSuccess,
      onDocumentLoadFailure
    );
  });

  function onDocumentLoadSuccess(doc) {
    // if a viewableId was specified, load that view, otherwise the default view
    var viewables = viewableId
      ? doc.getRoot().findByGuid(viewableId)
      : doc.getRoot().getDefaultGeometry();

    // var options = { ids: [], skipPropertyDb: true };

    viewer.loadDocumentNode(doc, viewables, vid).then((i) => {
      // any additional action here?
      // doc.hide([98]);
    });
  }

  function onDocumentLoadFailure(viewerErrorCode, viewerErrorMsg) {
    console.log("not true");
    console.error(
      "onDocumentLoadFailure() - errorCode:" +
        viewerErrorCode +
        "\n- errorMessage:" +
        viewerErrorMsg
    );
  }
}

function getForgeToken(callback) {
  fetch("/api/forge/oauth/token").then((res) => {
    res.json().then((data) => {
      callback(data.access_token, data.expires_in);
    });
  });
}
