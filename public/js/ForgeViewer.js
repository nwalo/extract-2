var viewer;

// @urn the model to show
// @viewablesId which viewables to show, applies to BIM 360 Plans folder
function launchViewer(urn, viewableId) {
  console.log("clicked viewer");

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

    console.log("s");
    console.log(viewer.getProperties());

    var documentId = "urn:" + urn;
    Autodesk.Viewing.Document.load(
      documentId,
      onDocumentLoadSuccess,
      onDocumentLoadFailure
    );
  });

  function onDocumentLoadSuccess(doc) {
    console.log("true");
    // if a viewableId was specified, load that view, otherwise the default view
    var viewables = viewableId
      ? doc.getRoot().findByGuid(viewableId)
      : doc.getRoot().getDefaultGeometry();
    viewer.loadDocumentNode(doc, viewables).then((i) => {
      // any additional action here?
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
