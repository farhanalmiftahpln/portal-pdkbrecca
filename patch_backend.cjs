const fs = require('fs');
let code = fs.readFileSync('gas-backend.js', 'utf8');

const newAction = `
      case "uploadEvidenPelaksanaan":
        result = uploadEvidenPelaksanaan(payload);
        break;`;

if (!code.includes('case "uploadEvidenPelaksanaan":')) {
  code = code.replace(/case "updateProfile":\s*result = updateProfile\(payload\);\s*break;/g, (match) => {
    return match + newAction;
  });
}

const newFunction = `
function uploadEvidenPelaksanaan(payload) {
  var folderId = "1NiuBymtsoIy5_4PzPRbENXEIsVLY_GEV";
  var sheetName = "CL_PELAKSANAAN";
  
  try {
    var folder = DriveApp.getFolderById(folderId);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(["Timestamp", "NO WO", "URL Foto Sebelum", "URL Foto Proses 1", "URL Foto Proses 2"]);
    }
    
    var noWo = payload.noWo || "UNKNOWN_WO";
    
    function uploadFoto(base64Data, mimeType, namaFile) {
      if (!base64Data) return "";
      var base64String = base64Data.split(",")[1];
      var blob = Utilities.newBlob(Utilities.base64Decode(base64String), mimeType || "image/jpeg", namaFile);
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return file.getUrl();
    }
    
    var urlSebelum = uploadFoto(payload.fotoSebelumBase64, payload.fotoSebelumMime, noWo + "-FOTO SEBELUM");
    var urlProses1 = uploadFoto(payload.fotoProses1Base64, payload.fotoProses1Mime, noWo + "-FOTO PROSES 1");
    var urlProses2 = uploadFoto(payload.fotoProses2Base64, payload.fotoProses2Mime, noWo + "-FOTO PROSES 2");
    
    var rowData = [
      new Date(),
      noWo,
      urlSebelum,
      urlProses1,
      urlProses2
    ];
    sheet.appendRow(rowData);
    
    return {
      success: true,
      message: "Eviden berhasil diupload dan disimpan ke Drive & Sheet."
    };
    
  } catch (e) {
    return {
      success: false,
      message: e.toString()
    };
  }
}
`;

if (!code.includes('function uploadEvidenPelaksanaan')) {
  code += newFunction;
}

fs.writeFileSync('gas-backend.js', code);
