pragma solidity ^0.4.2;

contract AccessControlManager
{
  struct AccessInfo
  {
    bool present;
    string token;
    uint role; // <unused> grant | download
  }

  struct FileInfo
  {
    bool present;
    mapping (string => AccessInfo) info;
  }

  mapping (address => FileInfo) private UserInfo;
  mapping (address => string[]) private FileList;
  mapping (address => uint) private FileCount;
  
  function UploadFile(string fileHash, string token, uint role, bytes32 data, uint8 v, bytes32 r, bytes32 s) public
  {
    address userId = msg.sender;
    if (ecrecover(data, v, r, s) != userId)
    {
      return;
    }

    FileInfo storage fileInfo = UserInfo[userId];
    if (fileInfo.present == false)
    {
      fileInfo.present = true;
      fileInfo.info[fileHash] = AccessInfo(true, token, role);
    }
    else
    {
      fileInfo.info[fileHash] = AccessInfo(true, token, role);
    }

    UserInfo[userId] = fileInfo;
    FileList[userId].push(fileHash);
    FileCount[userId]++;
  }

  function AmendAccess(string fileHash, address userId, string token, uint role, bool isGrant, bytes32 data, uint8 v, bytes32 r, bytes32 s) public
  {
    address senderId = msg.sender;
    if (ecrecover(data, v, r, s) != senderId)
    {
      return;
    }

    FileInfo storage fileInfo = UserInfo[senderId];
    if (fileInfo.present == true)
    {
      AccessInfo storage accessInfo = fileInfo.info[fileHash];
      if (accessInfo.present == true)
      {
        if (accessInfo.role & 0x2 != 0)
        {
          fileInfo = UserInfo[userId];
          if (fileInfo.present == false)
          {
            fileInfo.present = true;
            fileInfo.info[fileHash] = AccessInfo(true, token, role);
          }
          else
          {
            accessInfo = fileInfo.info[fileHash];
            if (accessInfo.present == true)
            {
              if (isGrant == true)
              {
                accessInfo.role = accessInfo.role | role;
              }
              else
              {
                accessInfo.role = accessInfo.role & ~role;
              }
            }
            else
            {
              fileInfo.info[fileHash] = AccessInfo(true, token, role);
              FileList[userId].push(fileHash);
              FileCount[userId]++;
            }
          }

          UserInfo[userId] = fileInfo;
        }
      }
    }
  }

  function DownloadFile(string fileHash, bytes32 data, uint8 v, bytes32 r, bytes32 s) public constant returns (bool)
  {
    address userId = msg.sender;
    if (ecrecover(data, v, r, s) != userId)
    {
      return;
    }

    FileInfo storage fileInfo = UserInfo[userId];
    if (fileInfo.present == true)
    {
      AccessInfo storage accessInfo = fileInfo.info[fileHash];
      if (accessInfo.present == true)
      {
        if (accessInfo.role & 0x1 != 0)
        {
          return true;
        }
      }
    }

    return false;
  }

  function GetFileCount(bytes32 data, uint8 v, bytes32 r, bytes32 s) public constant returns (uint)
  {
    address userId = msg.sender;
    if (ecrecover(data, v, r, s) != userId)
    {
      return;
    }

    return FileCount[userId];
  }

  function GetFileName(uint index, bytes32 data, uint8 v, bytes32 r, bytes32 s) public constant returns (string)
  {
    address userId = msg.sender;
    if (ecrecover(data, v, r, s) != userId)
    {
      return;
    }

    return FileList[userId][index];
  }

  function GetToken(string fileHash, bytes32 data, uint8 v, bytes32 r, bytes32 s) public constant returns (string)
  {
    address userId = msg.sender;
    if (ecrecover(data, v, r, s) != userId)
    {
      return;
    }

    return UserInfo[userId].info[fileHash].token;
  }
}
