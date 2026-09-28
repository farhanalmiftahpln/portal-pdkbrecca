const fs = require('fs');
let code = fs.readFileSync('gas-backend.js', 'utf8');

const targetBlock2 = `      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (e) {}
      return file.getUrl();`;

const replacementBlock2 = `      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (e) {}
      return "https://lh3.googleusercontent.com/d/" + file.getId();`;

if (code.includes(targetBlock2)) {
  code = code.replace(targetBlock2, replacementBlock2);
  fs.writeFileSync('gas-backend.js', code);
  console.log("Successfully patched uploadEvidenPelaksanaan url format");
} else {
  console.log("Target block 2 not found");
}
