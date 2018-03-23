App = {
  web3Provider: null,
  contracts: {},
  account: '',

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    // TODO: refactor conditional
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }

    return App.initContract();
  },

  initContract: function() {
    $.getJSON("AccessControlManager.json", function(manager) {
      console.log("init contract");
      console.log(manager);
      // Instantiate a new truffle contract from the artifact
      App.contracts.AccessControlManager = TruffleContract(manager);
      console.log(App.contracts.AccessControlManager);
      // Connect provider to interact with contract
      App.contracts.AccessControlManager.setProvider(App.web3Provider);
      console.log(App.contracts.AccessControlManager);

      return App.render();
    });
  },

  render: function() {
    var electionInstance;
    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase(function(err, acct) {
      if (err === null) {
        App.account = acct;
        console.log(App.account);
        $("#accountAddress").html("Account: " + App.account);
      }
    });

    console.log(App.account);
    console.log(App.contracts);
    console.log(App.contracts.AccessControlManager);

    // Load contract data
    App.contracts.AccessControlManager.deployed().then(function(instance) {
      console.log("random");
      managerInstance = instance;
      console.log(App.account);
      console.log(managerInstance);
      return managerInstance.GetFileCount();
    }).then(function(fileCount) {
      var fileResults = $("#fileResults");
      fileResults.empty();

      for (var i = 0; i < fileCount; i++) {
        managerInstance.GetFileName(i).then(function(fileHash) {
          var fileTemplate = "<tr><td>" + fileHash + "</td><td><a onClick='App.downloadFile(\"" + fileHash + "\");'>Download</a></td><td><a data-id=\"" + fileHash + "\" data-toggle=\"modal\" data-target=\"#myModalHorizontal\">Share</a></td></tr>"
          fileResults.append(fileTemplate);
        });
      }
      loader.hide();
      content.show();
      App.renderUploadControl();
    }).catch(function(error) {
      console.log(error);
    });
  },

  renderUploadControl: function()
  {
    $(document).ready(function(){
      $('.upload input').change(function () {
        $('.upload p').text(this.files[0].name + " selected");
      });
    });
  },

  uploadFile: function() 
  {
    App.contracts.AccessControlManager.deployed().then(function(instance) {
        managerInstance = instance;

        var file = App.getFileToUpload();
        var fileHash =  web3.sha3(file.name);

        return managerInstance.UploadFile(fileHash, Math.random().toString());
      }).then(function() {
        location.reload();
      }).catch(function(error) {
        console.log(error);
      });
  },

  shareFile: function(fileHash, userIndex, role, isGrant)
  {
    console.log(fileHash);
     App.contracts.AccessControlManager.deployed().then(function(instance) {
        managerInstance = instance;
        web3.eth.getAccounts().then(function (accounts) {
          console.log(accounts);
          console.log(accounts[parseInt(userIndex)]);
          return managerInstance.AmendAccess(fileHash, accounts[parseInt(userIndex)], Math.random().toString(), role, isGrant);
        })
      }).then(function() {
        loader.hide();
        content.show();          
      }).catch(function(error) {
        console.warn(error);
      });
  },

  downloadFile: function(fileHash)
  {
     App.contracts.AccessControlManager.deployed().then(function(instance) {
        managerInstance = instance;
        return managerInstance.DownloadFile(fileHash);
      }).then(function(canDownloadfile) {
            // Render candidate Result
            if (canDownloadfile) {
              alert("Your download will begin in a moment");
            } else {
              alert("Access denied");
            }
      }).catch(function(error) {
        console.log(error);
      });
  },

  getFileToUpload: function()
  {
    var x = document.getElementById("myFile");  
     var txt = "";
      if ('files' in x) {
          if (x.files.length == 0) {
              return null;
          } else {
               return x.files[0];  
          }
      }

      return null;
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
