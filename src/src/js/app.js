App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasVoted: false,

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
      // Instantiate a new truffle contract from the artifact
      App.contracts.AccessControlManager = TruffleContract(manager);
      // Connect provider to interact with contract
      App.contracts.AccessControlManager.setProvider(App.web3Provider);

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
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    // Load contract data
    App.contracts.AccessControlManager.deployed().then(function(instance) {
      managerInstance = instance;
      var signs = App.getSignatures(App.account);
      return managerInstance.GetFileCount(App.getFixedData(App.account), signs[0], signs[1], signs[2]);
    }).then(function(fileCount) {
      var fileResults = $("#fileResults");
      fileResults.empty();

      for (var i = 0; i < fileCount; i++) {
        var signs = App.getSignatures(i.toString());
        managerInstance.GetFileName(i, App.getFixedData(i.toString()), signs[0], signs[1], signs[2]).then(function(fileName) {
          var fileTemplate = "<tr><th>" + fileName + "</th><td><button type="button" id="fileName" /></td><td><button type="button" name="fileName" /></td></tr>"
          fileResults.append(fileTemplate);
        });
      }
      loader.hide();
      content.show();
    }).catch(function(error) {
      console.warn(error);
    });
  },

  getSignatures: function(data) {
    var sign = web3.eth.sign(App.account, '0x' + App.toHex(data));
    var signature = sign.substr(2); //remove 0x
    const r = '0x' + signature.slice(0, 64);
    const s = '0x' + signature.slice(64, 128);
    const v = '0x' + signature.slice(128, 130);
    const vD = web3.toDecimal(v);

    return [vD, r, s];
  },

  getFixedData: function(data) {
    var fixedData = `\x19Ethereum Signed Message:\n${data.length}${data}`
    return web3.sha3(fixedData)
  }

  toHex: function (str) {
   var hex = ''
   for(var i=0 ; i < str.length ; i++) {
    hex += ''+str.charCodeAt(i).toString(16)
   }

   return hex
  },

UploadFile: function () 
{
  App.contracts.AccessControlManager.deployed().then(function(instance) {
      managerInstance = instance;
      var signs = GetSignature();
      var file = GetFileToUpload();
      var filehash =  web3.sha3(file.name);       
      return managerInstance.UploadFile(fileHash,Math.random(), file.name ,signs[3],signs[0],signs[1]);
    }).then(function() {
      loader.hide();
      content.show();          
    }).catch(function(error) {
      console.warn(error);
    });
  
}

ShareFile: function ()
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
  
}

DownloadFile: function ()
{
   App.contracts.AccessControlManager.deployed().then(function(instance) {
      managerInstance = instance;
      var signs = GetSignature();
      //getfilehash by binding
      return managerInstance.DownloadFile(fileHash,signs[3],signs[0],signs[1]);
    }).then(function(canDownloadfile) {
     
          // Render candidate Result
          if(canDownloadfile){
            alert("Download now")
          }
          else
          {
            alert("Access denied")
          }
    }).catch(function(error) {
      console.warn(error);
    });
}

GetFileToUpload : function()
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
