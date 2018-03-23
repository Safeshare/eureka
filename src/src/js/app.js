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
      var signs = GetSignature();
      return managerInstance.GetFileCount(App.account,signs[3],signs[0],signs[1]);
    }).then(function(fileCount) {
      var fileResults = $("#fileResults");
      fileResults.empty();

      var fileSelect = $('#fileSelect');
      fileSelect.empty();

      for (var i = 1; i <= fileCount; i++) {
        managerInstance.getFileName(i).then(function(files) {
          var name = files[0];

          // Render candidate Result
          var fileTemplate = "<tr><th>" + name + "</th><td><button type="button" id="name" /></td><td><button type="button" name="name" /></td></tr>"
          fileResults.append(fileTemplate);

        });
      }
      loader.hide();
      content.show();
    }).catch(function(error) {
      console.warn(error);
    });



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

GetSignature : function ()
{
  var sign = web3.eth.sign(App.account);
  var signature = sign.substr(2); //remove 0x
  const r = '0x' + signature.slice(0, 64);
  const s = '0x' + signature.slice(64, 128);
  const v = '0x' + signature.slice(128, 130);
  const v_decimal = web3.toDecimal(v);
  var result = [sign,r,s,v_decimal];
  return result;
}

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});


