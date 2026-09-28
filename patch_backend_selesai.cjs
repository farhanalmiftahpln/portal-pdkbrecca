const fs = require('fs');
let code = fs.readFileSync('gas-backend.js', 'utf8');

const targetBlock = `    } catch(err) {
      console.log("Gagal simpan foto grid ke WORK PLAN: " + err.message);
    }

    return { success: true, message: "Berhasil menyelesaikan pekerjaan", fotoGridUrl };`;

const replacementBlock = `    } catch(err) {
      console.log("Gagal simpan foto grid ke WORK PLAN: " + err.message);
    }

    // Auto-create NOTIFICATIONS sheet and append notif for PREPARATOR
    try {
      const authSS = SpreadsheetApp.openById(SPREADSHEETS.AUTH);
      let notifSheet = authSS.getSheetByName("NOTIFICATIONS");
      if (!notifSheet) {
        notifSheet = authSS.insertSheet("NOTIFICATIONS");
        notifSheet.appendRow(["Timestamp", "No WO", "Target Role", "Pesan", "Status"]);
      }
      notifSheet.appendRow([
        new Date(),
        noWo,
        "PREPARATOR",
        "Pekerjaan " + noWo + " telah selesai dikerjakan. Silakan periksa hasil evaluasi.",
        "UNREAD"
      ]);
    } catch (e) {
      console.log("Gagal membuat notifikasi: " + e.message);
    }

    return { success: true, message: "Berhasil menyelesaikan pekerjaan", fotoGridUrl };`;

if (code.includes(targetBlock)) {
  code = code.replace(targetBlock, replacementBlock);
  fs.writeFileSync('gas-backend.js', code);
  console.log("Successfully patched backend selesaikanPekerjaan with notifications.");
} else {
  console.log("Target block not found.");
}
