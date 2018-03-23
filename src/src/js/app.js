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
        $("#accountAddress").html("Your Account: " + App.account);
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
      App.getSignatures(App.account, function(v, r, s) {
        return managerInstance.GetFileCount(App.getFixedData(App.account), v, r, s);
      });
    }).then(function(fileCount) {
      var fileResults = $("#fileResults");
      fileResults.empty();

      for (var i = 0; i < fileCount; i++) {
        App.getSignatures(i.toString(), function(v, r, s) { 
          managerInstance.GetFileName(i, App.getFixedData(i.toString()), v, r, s).then(function(fileHash) {
            var fileTemplate = "<tr><th>" + fileHash + "</th><td><input type='button' onClick='App.downloadFile(" + fileHash + ")>Download</input></td><td><input type='button' onClick='App.shareFile(" + fileHash + ")>Share</input></td></tr>"
            fileResults.append(fileTemplate);
            });
        });
      }
      loader.hide();
      content.show();
    }).catch(function(error) {
      console.log(error);
    });
  },

  uploadFile: function() 
  {
    console.log("inup");
    App.contracts.AccessControlManager.deployed().then(function(instance) {
        managerInstance = instance;

        var file = App.getFileToUpload();
        var fileHash =  web3.sha3(file.name);

        var token = Math.random().toString();
        var data = fileHash + token;
        App.getSignatures(data, function(v, r, s) {
          return managerInstance.UploadFile(fileHash, token, App.getFixedData(data), v, r, s);
        });
      }).then(function() {
      }).catch(function(error) {
        console.log(error);
      });
  },

  /*
  shareFile: function(fileHash)
  {
     App.contracts.AccessControlManager.deployed().then(function(instance) {
        managerInstance = instance;
        var signs = GetSignature();
        var file = GetFileToUpload();
        var filehash =  web3.sha3(file.name);  
        var userId
        var role
        var isGrant
        var data = file.name;
        return managerInstance.AmendAccess(fileHash, userId, Math.random(),role, isGrant, file.name ,signs[3],signs[0],signs[1]);
      }).then(function() {
        loader.hide();
        content.show();          
      }).catch(function(error) {
        console.warn(error);
      });
  },
  */

  downloadFile: function(fileHash)
  {
     App.contracts.AccessControlManager.deployed().then(function(instance) {
        managerInstance = instance;
        App.getSignatures(fileHash, function(v, r, s) {
          return managerInstance.DownloadFile(fileHash, App.getFixedData(fileHash), v, r, s);
      });
      }).then(function(canDownloadfile) {
            // Render candidate Result
            if (canDownloadfile) {
              alert("Download now")
            } else {
              alert("Access denied")
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
  },

  getSignatures: function(data, onSigned) {
    console.log(data);
    console.log('0x' + App.toHex(data));
    web3.eth.sign(App.account, '0x' + App.toHex(data), function(err, result) {
      console.log(err);
      console.log(result);
      if(err) {
        console.log(err)
      }
      if(result) {
        var signature = result.substr(2); //remove 0x
        const r = '0x' + signature.slice(0, 64);
        const s = '0x' + signature.slice(64, 128);
        const v = '0x' + signature.slice(128, 130);
        const vD = web3.toDecimal(v);

        onSigned([vD, r, s]);
      }
    });

  },

  getFixedData: function(data) {
    var fixedData = `\x19Ethereum Signed Message:\n${data.length}${data}`

    return web3.sha3(fixedData)
  },

  toHex: function (str) {
   var hex = ''
   for(var i=0 ; i < str.length ; i++) {
    hex += ''+str.charCodeAt(i).toString(16)
   }

   return hex
  },
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
