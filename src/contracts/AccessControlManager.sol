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

  mapping (string => FileInfo) private UserInfo;
  mapping (string => string[]) private FileList;
  mapping (string => uint) private FileCount;
  
  function UploadFile(string fileHash, string userId, string token, uint role, string signature) public
  {
    // Check signature

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

  function AmendAccess(string fileHash, string senderId, string userId, string token, uint role, bool isGrant, string signature) public
  {
    // Check signature

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

  function DownloadFile(string fileHash, string userId, string signature) public constant returns (bool)
  {
    // Check signature

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

  function GetFileCount(string userId, string signature) public constant returns (uint)
  {
    // Check signature

    return FileCount[userId];
  }

  function GetFileName(string userId, uint index, string signature) public constant returns (string)
  {
    // Check signature

    return FileList[userId][index];
  }

  function GetToken(string fileHash, string userId, string signature) public constant returns (string)
  {
    // Check signature

    return UserInfo[userId].info[fileHash].token;
  }
}
