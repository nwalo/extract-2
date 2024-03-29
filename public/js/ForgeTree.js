let meta = {};
let all = {};

$(document).ready(function () {
  // first, check if current visitor is signed in
  jQuery.ajax({
    url: "/api/forge/oauth/token",
    success: function (res) {
      // yes, it is signed in...
      $("#signOut").show();
      $("#refreshHubs").show();

      // prepare sign out
      $("#signOut").click(function () {
        $("#hiddenFrame").on("load", function (event) {
          location.href = "/api/forge/oauth/signout";
        });
        $("#hiddenFrame").attr(
          "src",
          "https://accounts.autodesk.com/Authentication/LogOut"
        );
        // learn more about this signout iframe at
        // https://forge.autodesk.com/blog/log-out-forge
      });

      // and refresh button
      $("#refreshHubs").click(function () {
        $("#userHubs").jstree(true).refresh();
      });

      // finally:
      prepareUserHubsTree();
      showUser();
    },
  });

  $("#autodeskSigninButton").click(function () {
    jQuery.ajax({
      url: "/api/forge/oauth/url",
      success: function (url) {
        location.href = url;
      },
    });
  });
});

// launchViewer(dXJuOmFkc2sud2lwcHJvZDpmcy5maWxlOnZmLnYzc2RVSzJQUUEyNUxhMVhZM0RMenc_dmVyc2lvbj0z);
//

function prepareUserHubsTree() {
  $("#userHubs")
    .jstree({
      core: {
        themes: { icons: true },
        multiple: false,
        data: {
          url: "/api/forge/datamanagement",
          dataType: "json",
          cache: false,
          data: function (node) {
            $("#userHubs").jstree(true).toggle_node(node);
            return { id: node.id };
          },
        },
      },
      types: {
        default: { icon: "glyphicon glyphicon-question-sign" },
        "#": { icon: "glyphicon glyphicon-user" },
        hubs: {
          icon: "https://github.com/Autodesk-Forge/bim360appstore-data.management-nodejs-transfer.storage/raw/master/www/img/a360hub.png",
        },
        personalHub: {
          icon: "https://github.com/Autodesk-Forge/bim360appstore-data.management-nodejs-transfer.storage/raw/master/www/img/a360hub.png",
        },
        bim360Hubs: {
          icon: "https://github.com/Autodesk-Forge/bim360appstore-data.management-nodejs-transfer.storage/raw/master/www/img/bim360hub.png",
        },
        bim360projects: {
          icon: "https://github.com/Autodesk-Forge/bim360appstore-data.management-nodejs-transfer.storage/raw/master/www/img/bim360project.png",
        },
        a360projects: {
          icon: "https://github.com/Autodesk-Forge/bim360appstore-data.management-nodejs-transfer.storage/raw/master/www/img/a360project.png",
        },
        folders: { icon: "glyphicon glyphicon-folder-open" },
        items: { icon: "glyphicon glyphicon-file" },
        bim360documents: { icon: "glyphicon glyphicon-file" },
        versions: { icon: "glyphicon glyphicon-time" },
        unsupported: { icon: "glyphicon glyphicon-ban-circle" },
      },
      sort: function (a, b) {
        var a1 = this.get_node(a);
        var b1 = this.get_node(b);
        var parent = this.get_node(a1.parent);
        if (parent.type === "items") {
          // sort by version number
          var id1 = Number.parseInt(
            a1.text.substring(a1.text.indexOf("v") + 1, a1.text.indexOf(":"))
          );
          var id2 = Number.parseInt(
            b1.text.substring(b1.text.indexOf("v") + 1, b1.text.indexOf(":"))
          );
          return id1 > id2 ? 1 : -1;
        } else if (a1.type !== b1.type) return a1.icon < b1.icon ? 1 : -1;
        // types are different inside folder, so sort by icon (files/folders)
        else return a1.text > b1.text ? 1 : -1; // basic name/text sort
      },
      plugins: ["types", "state", "sort"],
      state: { key: "autodeskHubs" }, // key restore tree state
    })
    .bind("activate_node.jstree", function (evt, data) {
      if (
        data != null &&
        data.node != null &&
        (data.node.type == "versions" || data.node.type == "bim360documents")
      ) {
        // in case the node.id contains a | then split into URN & viewableId
        // console.log(data.node.id)
        let myurn = { urn: data.node.id };
        axios
          .post("/api/forge/modelderivative/jobs", myurn)
          .then(function (response) {
            jQuery.ajax({
              url: `https://developer.api.autodesk.com/modelderivative/v2/designdata/${response.data.urn}/manifest`,
              headers: {
                Authorization: "Bearer " + response.data.token.access_token,
                "Content-Type": "application/json",
                "x-ads-force": true,
              },
              success: function (res) {
                console.log(res);
                if (res.status == "success") {
                  alert("Translation successful");

                  launchViewer(response.data.urn);
                  // launchViewer(response.data.urn, { ids: [54, 99, 98, 53] }); // The id object is used to show only a specific component.
                  all.token = response.data.token.access_token;
                  all.urn = response.data.urn;
                  jQuery.ajax({
                    url:
                      "https://developer.api.autodesk.com/modelderivative/v2/designdata/" +
                      response.data.urn +
                      "/metadata",
                    headers: {
                      Authorization:
                        "Bearer " + response.data.token.access_token,
                    },
                    success: function (res) {
                      meta.guid = res.data.metadata[0].guid;
                      meta.role = res.data.metadata[0].role;
                      meta.type = res.data.type;

                      handleMetadataGuid(meta, all);
                    },
                    error: function (err) {
                      console.log(err);
                    },
                  });
                } else if (
                  res.status == "pending" ||
                  res.status == "inprogress"
                ) {
                  alert("Translation in progress - " + res.progress);
                } else {
                  alert("Translation failed... file is not supported.");
                }
              },
              error: function (err) {
                console.log(err);
              },
            });
          })
          .catch(function (error) {
            console.log(error);
          });
        // jQuery.post({
        //   url: '/api/forge/modelderivative/jobs',
        //   data: myurn,
        //   success: function (url) {
        //     // location.href = url
        //     console.log('success')
        //   },
        // })
        // if (data.node.id.indexOf('|') > -1) {
        //   var urn = data.node.id.split('|')[1]
        //   var viewableId = data.node.id.split('|')[2]
        //   launchViewer(urn, viewableId)
        //   console.log('a')
        // } else {
        //   launchViewer(data.node.id)
        //   console.log('b')
        // }
      }
    });
}

function handleMetadataGuid(meta, all) {
  jQuery.ajax({
    url: `https://developer.api.autodesk.com/modelderivative/v2/designdata/${all.urn}/metadata/${meta.guid}?forceget=true`,
    headers: { Authorization: "Bearer " + all.token, "x-ads-force": true },
    success: function (res) {
      if (res.result == "success") {
        alert("Metadata initialization in progress... please try again");
      } else if (res.data) {
        alert("Extraction complete");
        handleMetadataGuidProps(meta, all);
      }
    },
    error: function (err) {
      console.log(err);
    },
  });
}

function handleMetadataGuidProps(meta, all) {
  jQuery.ajax({
    // url: `https://developer.api.autodesk.com/modelderivative/v2/designdata/${all.urn}/metadata/${meta.guid}/properties?forceget=true`,
    url: `https://developer.api.autodesk.com/modelderivative/v2/designdata/${all.urn}/metadata/${meta.guid}`,
    headers: { Authorization: "Bearer " + all.token, "x-ads-force": true },
    success: function (res) {
      // console.log(res);
      axios
        .post("/post/partsimony/component", res)
        .then(function (response) {
          console.log(response);
          if (response.data.status && response.status == 200) {
            jQuery.ajax({
              url: `https://developer.api.autodesk.com/modelderivative/v2/designdata/${all.urn}/metadata/${meta.guid}/properties?forceget=true`,
              // url: `https://developer.api.autodesk.com/modelderivative/v2/designdata/${all.urn}/metadata/${meta.guid}`,
              headers: {
                Authorization: "Bearer " + all.token,
                "x-ads-force": true,
              },
              success: function (res) {
                console.log(res);
                axios
                  .post("/post/partsimony/metadata/properties", res)
                  .then(function (response) {
                    // console.log(response);
                    location.href = "/partsimony/get/metadata/properties";
                  })
                  .catch(function (error) {
                    console.log(error);
                  });
              },
              error: function (err) {
                console.log(err);
              },
            });
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    error: function (err) {
      console.log(err);
    },
  });
}

function showUser() {
  jQuery.ajax({
    url: "/api/forge/user/profile",
    success: function (profile) {
      var img = '<img src="' + profile.picture + '" height="30px">';
      $("#userInfo").html(img + profile.name);
    },
  });
}
