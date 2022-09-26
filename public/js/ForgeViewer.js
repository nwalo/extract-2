var viewer;

// @urn the model to show
// @viewablesId which viewables to show, applies to BIM 360 Plans folder
function launchViewer(urn, vid, viewableId) {
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
      console.log(i);
    });

    setTimeout(() => {
      viewer.getScreenShot(400, 400, (res) => {
        console.log(res);
        const myFile = new File([res], "image.png", {
          type: "image/png",
        });

        let link = document.createElement("a");
        link.download = "hello.png";

        let blob = new Blob([res], { type: "image/png" });

        let reader = new FileReader();
        reader.readAsDataURL(blob); // converts the blob to base64 and calls onload

        reader.onload = function (e) {
          // console.log(e);
          console.log(typeof reader.result);
          link.href = res; // data url
          // link.href = reader.result; // data url
          // link.click();
        };

        var xhr = new XMLHttpRequest();
        xhr.responseType = "blob";

        xhr.onload = () => {
          let recoveredBlob = xhr.response;
          console.log(xhr.response);
          var reader = new FileReader();

          reader.onload = () => {
            let blobAsDataUrl = reader.result;
            console.log(blobAsDataUrl);
            axios.post("/images/", { url: blobAsDataUrl }).then((result) => {
              console.log(result);
              // location.assign(result.data);
            });
            // document.getElementById("pic").setAttribute("src", blobAsDataUrl);
            // window.location.href = blobAsDataUrl;
          };

          reader.readAsDataURL(recoveredBlob);
          console.log(recoveredBlob);
        };

        xhr.open("GET", res);
        xhr.send();

        // const uploadFile = (file) => {
        //   console.log("Uploading file...");
        //   const API_ENDPOINT = "/images/";
        //   const request = new XMLHttpRequest();
        //   const formData = new FormData();

        //   request.open("POST", API_ENDPOINT);
        //   request.onreadystatechange = () => {
        //     if (request.readyState === 4 && request.status === 200) {
        //       console.log(request.responseText);
        //     } else {
        //       console.log("err");
        //     }
        //   };
        //   formData.append("file", file);
        //   formData.append("url", res);
        //   request.send(formData);
        // };

        // uploadFile(myFile);
      });
    }, 20000);
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
