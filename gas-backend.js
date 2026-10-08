// Konfigurasi ID Spreadsheet & Drive
const SPREADSHEETS = {
  DASHBOARD: "1YXFGPcpoK-mcpcQNyg1BeupyVeIql9z3L8byvtLCFws",
  AUTH: "1ABW-W002ORX84DDiyZG24PJW_ySBi9pro4EZOW2WXds",
  USERS: "1ABW-W002ORX84DDiyZG24PJW_ySBi9pro4EZOW2WXds", // Menggunakan ID Auth sesuai penyesuaian sebelumnya
  PDKB: "1I3hKc0KrOf2fzLaYop_vZeR9gRHIz8iHwrdc_WlqibU",
  WORK_ORDER: "1fUObst8eBt6fD_Wzx6SyOZQk4lXiALnLBsqjDfDK5-Q",
  REVIEW_WO: "1NiF4tkUju938gkSWur2-iMCKXCrIVS4g6fCCR32l70c",
  WORK_PLAN: "1eoSyAIbBasHw-cWYkGuLnSt3pg2W3cKk-TkY06Njv_Y",
  TRACKING_EVIDENCES: "1NiuBymtsoIy5_4PzPRbENXEIsVLY_GEV",
  BERKAS_PEKERJAAN: "12OkHyPXqR33PBA_J-vOua_OVPRY7twdvcirlSbwEQvQ",
  LIST_REALISASI: "1YXFGPcpoK-mcpcQNyg1BeupyVeIql9z3L8byvtLCFws",
  WAREHOUSE: "18H_YobVPBWgRkJEFyL7GzvR9XiR1DQdfk-LhJOces6I",
  WAREHOUSE_EVIDENCES: "1RGBgOmBHQ6ZgPilbgAdG1Bl0o8TL9183",
};

// Folder ID untuk menyimpan foto evidance & file dokumen
const DRIVE_FOLDERS = {
  WO: "1B3mfOYm1gfznoDlPhZ1SiPQDuGdEukqG",
  AREA: "1YL7u1HiwgTIhYcaVRwIuqOsAGNFJm1Ie",
  KONSTRUKSI: "1GQ243ksFCRiGeMEV3fZoQjKjq2dYsIEN",
  HAZARD: "1aIchwEl_8uHm11p-pLNCNd5e6MFjQwQs",
  PDKB_RECCA_EXPORT: "1urqblbRHzJroJ5i8VjCIpb0iDkBrQNF6", // Folder PDKB Recca Export
};

/**
 * FUNGSI SETUP IZIN (WAJIB DIJALANKAN SEKALI)
 * Pilih fungsi ini di dropdown menu atas Apps Script dan klik Run/Jalankan
 * agar script mendapatkan izin untuk menulis ke Google Drive.
 */
function setupPermissions() {
  try {
    const folder = DriveApp.getFolderById(DRIVE_FOLDERS.WO);
    const exportFolder = DriveApp.getFolderById(DRIVE_FOLDERS.PDKB_RECCA_EXPORT);
    console.log(
      "Izin Google Drive berhasil diberikan. Folder WO: " + folder.getName() + " | Folder PDKB Recca: " + exportFolder.getName(),
    );
  } catch (e) {
    console.error(
      "Gagal! Pastikan Folder ID benar dan Anda sudah memberikan izin.",
      e,
    );
  }
}

/**
 * Endpoint utama yang menerima HTTP POST request dari aplikasi React
 */

function doPost(e) {
  try {
    if (e.postData === undefined) {
      return createJsonResponse({
        success: false,
        message: "Invalid request: No payload data.",
      });
    }

    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    const payload = requestData.payload || {};

    let result = {};

    switch (action) {
      case "login":
        result = handleLogin(payload);
        break;
      case "logActivity":
        result = handleLogActivity(payload);
        break;
      case "getDashboardStats":
        result = handleGetDashboardStats(payload);
        break;
      case "getDumpOverview":
        result = handleDumpOverview();
        break;
      case "getWorkOrders":
        result = handleGetWorkOrders();
        break;
      case "getWorkOrdersHeaders":
        result = handleGetWorkOrdersHeaders();
        break;
      case "submitWorkOrder":
        result = handleSubmitWorkOrder(payload);
        break;
      case "deleteWorkOrders":
        result = handleDeleteWorkOrders(payload);
        break;
      case "getOptions":
        result = handleGetOptions();
        break;
      case "updateLlcStatus":
        result = handleUpdateLlcStatus(payload);
        break;
      case "getLlcList":
        result = handleGetLlcList();
        break;
      case "getReviewedWOs":
        result = handleGetReviewedWOs();
        break;
      case "getReviewDetail":
        result = handleGetReviewDetail(payload);
        break;
      case "updateApproval":
        result = handleUpdateApproval(payload);
        break;
      case "submitReviewForm":
        result = handleSubmitReviewForm(payload);
        break;
      case "updateSecurity":
        result = handleUpdateSecurity(payload);
        break;
      case "getWorkPlans":
        result = handleGetWorkPlans();
        break;
      case "getWorkPlanDetail":
        result = handleGetWorkPlanDetail(payload);
        break;
      case "getTracking":
        result = handleGetTracking(payload);
        break;
      case "getTrackingOptions":
        result = handleGetTrackingOptions();
        break;
      case "updateTracking":
        result = handleUpdateTracking(payload);
        break;
      case "submitSWA":
        result = handleSubmitSWA(payload);
        break;
      case "clearSWA":
        result = handleClearSWA(payload);
        break;
      case "updateBerkasAction":
        result = handleUpdateBerkasAction(payload);
        break;
      case "getBerkasActions":
        result = handleGetBerkasActions(payload);
        break;
      case "getRealisasiList":
        result = handleGetRealisasiList(payload);
        break;
      case "getAllPersonil":
        result = handleGetAllPersonil(payload);
        break;
      case "getWarehouseData":
        result = handleGetWarehouseData(payload);
        break;
      case "updateWarehouseData":
        result = handleUpdateWarehouseData(payload);
        break;
      case "getPersonilDetail":
        result = handleGetPersonilDetail(payload);
        break;
      case "getKesehatanForm":
        result = handleGetKesehatanForm(payload);
        break;
      case "submitKesehatan":
        result = handleSubmitKesehatan(payload);
        break;
      case "getLogKesehatan":
        result = handleGetLogKesehatan(payload);
        break;
      case "getKesehatanOverview":
        result = handleGetKesehatanOverview(payload);
        break;
      case "getRealisasiDetail":
        result = handleGetRealisasiDetail(payload);
        break;
      case "updateRealisasiStatus":
        result = handleUpdateRealisasiStatus(payload);
        break;
      case "selesaikanPekerjaan":
        result = handleSelesaikanPekerjaan(payload);
        break;
      case "saveDataJumat":
        result = handleSaveDataJumat(payload);
        break;
      case "generateSlideJumat":
        result = handleGenerateSlideJumat(payload);
        break;
      case "requestAkun":
        result = handleRequestAkun(payload);
        break;
      case "getKesehatanChartData":
        result = handleGetKesehatanChartData(payload);
        break;
      case "uploadEvidenPelaksanaan":
        result = uploadEvidenPelaksanaan(payload);
        break;
      case "uploadFileToDrive":
      case "exportWarehousePdf":
        result = handleUploadFileToDrive(payload);
        break;
      case "getExportTemplateData":
        result = handleGetExportTemplateData(payload);
        break;
      case "getPersonilReadyCount":
        result = handleGetPersonilReadyCount(payload);
        break;
      case "exportWorkOrderDocument":
        result = handleExportWorkOrderDocument(payload);
        break;
      case "exportSp2bSp3bDocument":
        result = handleExportSp2bSp3bDocument(payload);
        break;
      case "exportFromGoogleDocTemplate":
        result = handleExportFromGoogleDocTemplate(payload);
        break;
      default:
        result = { success: false, error: "Action tidak dikenal: " + action };
    }

    return createJsonResponse(result);
  } catch (error) {
    return createJsonResponse({
      success: false,
      error: error.toString(),
      stack: error.stack,
    });
  }
}

/**
 * Handle HTTP GET request (untuk testing ping/status)
 */
function doGet(e) {
  return ContentService.createTextOutput(
    "API Portal PDKB API is running. Tahap 2 deployed.",
  ).setMimeType(ContentService.MimeType.TEXT);
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function formatDateToID(val) {
  if (!val) return "";
  if (val instanceof Date) {
    return Utilities.formatDate(val, "Asia/Jakarta", "dd/MM/yyyy");
  }
  const str = String(val);
  const parts = str.split("-");
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return str;
}

/**
 * 1. LOGIN
 */
function handleLogin(payload) {
  const { nip, password } = payload;
  if (!nip || !password)
    return { success: false, message: "NIP dan Password tidak boleh kosong" };

  const authSS = SpreadsheetApp.openById(SPREADSHEETS.AUTH);
  const authSheet = authSS.getSheetByName("Auth");
  if (!authSheet)
    return { success: false, message: "Sheet Auth tidak ditemukan" };

  const authData = authSheet.getDataRange().getValues();
  const headers = authData.shift();

  const nipIndex = headers.findIndex((h) => {
    const val = String(h).trim().toLowerCase();
    return (
      val === "userid" ||
      val === "user id" ||
      val === "nip" ||
      val === "username"
    );
  });
  const passIndex = headers.findIndex((h) => {
    const val = String(h).trim().toLowerCase();
    return val === "password" || val === "pass" || val === "kata sandi";
  });

  if (nipIndex === -1 || passIndex === -1) {
    return {
      success: false,
      message: `Kolom UserID/Password tidak ada di Sheet. Header yg ada: ${headers.join(", ")}`,
    };
  }

  const userRecord = authData.find(
    (row) =>
      String(row[nipIndex]) === String(nip) &&
      String(row[passIndex]) === String(password),
  );
  if (!userRecord)
    return { success: false, message: "UserID atau Password salah" };

  const statusIndex = headers.findIndex(
    (h) => String(h).trim().toLowerCase() === "status",
  );
  if (statusIndex !== -1) {
    const statusVal = String(userRecord[statusIndex]).trim();
    if (statusVal.toLowerCase() !== "izinkan") {
      return {
        success: false,
        message: "Akun Anda belum diizinkan untuk login",
      };
    }
  }

  // Parse from Auth sheet based on new columns: UserID, UserName, UserRole, UserUNIT, UserBIDANG
  const getIndex = (possibleNames) =>
    headers.findIndex((h) => {
      const val = String(h).trim().toLowerCase();
      return possibleNames.some(
        (p) =>
          val === p.toLowerCase() || val === p.toLowerCase().replace(/\s/g, ""),
      );
    });

  const nameIndex = getIndex(["username", "nama", "name"]);
  const roleIndex = getIndex(["userrole", "role", "peran"]);
  const unitIndex = getIndex(["userunit", "unit"]);
  const bidangIndex = getIndex(["userbidang", "bidang"]);
  // Fallbacks if jabation or photo is needed but maybe not in Auth
  const jabatanIndex = getIndex(["jabatan"]);
  const photoIndex = getIndex(["photo", "foto", "photourl"]);

  let userData = {
    nip: String(nip),
    name: nameIndex !== -1 ? String(userRecord[nameIndex]) : "User " + nip,
    role:
      roleIndex !== -1 ? String(userRecord[roleIndex]).toUpperCase() : "USER",
    unit: unitIndex !== -1 ? String(userRecord[unitIndex]) : "",
    bidang: bidangIndex !== -1 ? String(userRecord[bidangIndex]) : "",
    jabatan: jabatanIndex !== -1 ? String(userRecord[jabatanIndex]) : "",
    photoUrl: photoIndex !== -1 ? String(userRecord[photoIndex]) : "",
  };

  return { success: true, data: userData };
}

/**
 * 2. LOG ACTIVITY
 */
function handleLogActivity(payload) {
  const { nip, action, module = "System", note = "" } = payload;
  const authSS = SpreadsheetApp.openById(SPREADSHEETS.AUTH);
  const logSheet = authSS.getSheetByName("log activity");
  if (logSheet) {
    logSheet.appendRow([new Date(), nip, action, module, note]);
    return { success: true };
  }
  return { success: false, message: "Sheet log activity tidak ditemukan" };
}

/**
 * 3. GET DASHBOARD STATS
 */
function handleDumpOverview() {
  const dashSS = SpreadsheetApp.openById(SPREADSHEETS.DASHBOARD);
  const overviewSheet = dashSS.getSheetByName("OVERVIEW");
  if (!overviewSheet)
    return { success: false, message: "Sheet OVERVIEW tidak ditemukan" };

  const data = overviewSheet.getDataRange().getValues();
  return { success: true, data };
}

function handleGetDashboardStats(payload) {
  const dashSS = SpreadsheetApp.openById(SPREADSHEETS.DASHBOARD);
  const realisasiSheet = dashSS.getSheetByName("LIST REALISASI");
  const filters = payload && payload.filters ? payload.filters : {};

  let realisasiTitik = 0;
  let savingKwh = 0;
  let savingRp = 0;
  let saidi = 0;
  let saifi = 0;
  let ulpMap = {};
  let ulpTrendMap = {}; // { 'Jan 2024': { 'name': 'Jan 2024', 'ULP A': 1, 'ULP B': 2 } }
  let ulpNames = new Set();
  let statusMap = {};
  let sopMap = {};
  let kategoriMap = {};
  let recentWOs = [];
  let filterOpts = {
    bulan: new Set(),
    tahun: new Set(),
    semester: new Set(),
    ulp: new Set(),
    gi: new Set(),
    penyulang: new Set(),
    sop: new Set(),
  };

  let targetTitik = 0;
  let targetKwh = 0;
  let targetRp = 0;

  const parseSafeNumber = (val) => {
    if (!val && val !== 0) return 0;
    if (typeof val === "number") return val;
    let str = String(val).trim();
    if (str === "-" || str === "") return 0;

    str = str.replace(/[^0-9.,-]/g, "");

    if (str.includes(",") && str.includes(".")) {
      if (str.lastIndexOf(",") > str.lastIndexOf(".")) {
        str = str.replace(/\./g, "").replace(",", ".");
      } else {
        str = str.replace(/,/g, "");
      }
    } else if (str.includes(",")) {
      if (str.match(/,\d{3}$/)) str = str.replace(",", "");
      else str = str.replace(",", ".");
    } else if (str.includes(".")) {
      if (str.split(".").length > 2 || str.match(/\.\d{3}$/)) {
        str = str.replace(/\./g, "");
      }
    }
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
  };

  const getMonthName = (m) => {
    const num = parseInt(m);
    if (isNaN(num)) return String(m).toUpperCase();
    const months = [
      "JANUARI",
      "FEBRUARI",
      "MARET",
      "APRIL",
      "MEI",
      "JUNI",
      "JULI",
      "AGUSTUS",
      "SEPTEMBER",
      "OKTOBER",
      "NOVEMBER",
      "DESEMBER",
    ];
    return months[num - 1] || String(m);
  };

  const overviewSheet = dashSS.getSheetByName("OVERVIEW");
  if (overviewSheet) {
    const overviewData = overviewSheet.getDataRange().getValues();
    if (overviewData.length > 1) {
      const overviewHeaders = overviewData[0];
      overviewData.slice(1).forEach((row) => {
        const tTahun = String(row[0] || "").trim();
        const tBulan = String(row[1] || "").trim();

        if (!tTahun || !tBulan) return;

        const bIdx = parseInt(tBulan);
        const sem = bIdx > 6 ? 2 : 1;
        filterOpts.semester.add(`Semester ${sem}`);
        filterOpts.bulan.add(getMonthName(tBulan));
        filterOpts.tahun.add(tTahun);

        if (filters.tahun && filters.tahun !== "" && tTahun !== filters.tahun)
          return;
        if (filters.bulan && filters.bulan !== "") {
          const tBlnName = getMonthName(tBulan);
          const filterBlnName = getMonthName(filters.bulan);
          const tBlnNum = parseInt(tBulan, 10);
          const filterBlnNum = parseInt(filters.bulan, 10);

          const isMatch =
            tBlnName.toLowerCase() === filters.bulan.toLowerCase() ||
            tBlnName.toLowerCase() === filterBlnName.toLowerCase() ||
            (!isNaN(tBlnNum) && !isNaN(filterBlnNum) && tBlnNum === filterBlnNum);

          if (!isMatch) return;
        }
        if (filters.semester && filters.semester !== "") {
          const semFilter = filters.semester.toLowerCase();
          if (semFilter.includes("1") && bIdx > 6) return;
          if (semFilter.includes("2") && bIdx < 7) return;
        }

        targetTitik += parseSafeNumber(row[2]);
        targetKwh += parseSafeNumber(row[3]);
        targetRp += parseSafeNumber(row[4]);
      });
    }
  }

  if (realisasiSheet) {
    const data = realisasiSheet.getDataRange().getValues();
    if (data.length > 1) {
      const headers = data.shift();

      const getIndex = (keywords) =>
        headers.findIndex((h) =>
          keywords.some((kw) => String(h).toLowerCase().includes(kw)),
        );

      const kwhIdx = getIndex(["kwh diselamatkan", "saving kwh"]);
      const rpIdx = getIndex(["rupiah diselamatkan", "saving rp", "rupiah"]);
      const saidiIdx = getIndex(["saidi"]);
      const saifiIdx = getIndex(["saifi"]);
      const ulpIdx = getIndex(["ulp", "unit", "area"]);
      const penyulangIdx = getIndex(["penyulang"]);
      const sopIdx = getIndex(["sop", "jenis pekerjaan", "pekerjaan"]);
      const kategoriIdx = getIndex(["kategori"]);
      const giIdx = getIndex(["gi", "gardu induk"]);
      const tglIdx = getIndex(["tanggal", "tgl", "date"]);
      const blnIdx = getIndex(["bulan", "bln", "month"]);
      const thnIdx = getIndex(["tahun", "thn", "year"]);
      const konfIdx = getIndex(["konfirmasi"]); // Request 4
      const noWoIdx = getIndex(["no wo", "no. wo", "no.wo"]);
      const noWoToSopMap = {};

      let recentHeaders = headers.filter((_, i) => i !== 17 && i !== 18);
      let allRecentData = [];

      data.forEach((row, idx) => {
        if (row.join("").trim() === "") return;
        
        if (noWoIdx !== -1 && sopIdx !== -1 && row[noWoIdx] && row[sopIdx]) {
          noWoToSopMap[String(row[noWoIdx]).trim()] = String(row[sopIdx]).trim().toUpperCase();
        }

        // Request 4
        if (konfIdx !== -1 && String(row[konfIdx]).toUpperCase().trim() !== "APPROVE") return;

        let currentBln = blnIdx !== -1 ? String(row[blnIdx]).trim() : "";
        let currentThn = thnIdx !== -1 ? String(row[thnIdx]).trim() : "";

        if ((!currentBln || !currentThn) && tglIdx !== -1) {
          let rowTgl = row[tglIdx];
          if (rowTgl instanceof Date) {
            if (!currentThn) currentThn = String(rowTgl.getFullYear());
            if (!currentBln) currentBln = String(rowTgl.getMonth() + 1);
          } else if (typeof rowTgl === "string" && rowTgl.length > 5) {
            const parts = rowTgl.split(/[-/]/);
            if (parts.length >= 3) {
              if (parts[0].length === 4) {
                // yyyy-mm-dd
                if (!currentThn) currentThn = parts[0];
                if (!currentBln) currentBln = parseInt(parts[1], 10).toString();
              } else if (parts[2].length === 4) {
                // dd/mm/yyyy
                if (!currentThn) currentThn = parts[2];
                if (!currentBln) currentBln = parseInt(parts[1], 10).toString();
              }
            }
          }
        }

        // Collect filter options ignoring the selected filters
        if (currentBln) filterOpts.bulan.add(getMonthName(currentBln));
        if (currentThn) filterOpts.tahun.add(currentThn);
        if (ulpIdx !== -1) {
          const ulpVal = String(row[ulpIdx]).trim();
          if (ulpVal) filterOpts.ulp.add(ulpVal);
        }
        if (giIdx !== -1) {
          const giVal = String(row[giIdx]).trim();
          if (giVal) filterOpts.gi.add(giVal);
        }
        if (penyulangIdx !== -1) {
          const pyVal = String(row[penyulangIdx]).trim();
          if (pyVal) filterOpts.penyulang.add(pyVal);
        }
        if (sopIdx !== -1) {
          const sopVal = String(row[sopIdx]).trim();
          if (sopVal) filterOpts.sop.add(sopVal);
        }

        // Filter logic
        if (filters.tanggal && tglIdx !== -1) {
          let rowTgl = row[tglIdx];
          let formattedTgl = "";
          if (rowTgl instanceof Date) {
            const yyyy = rowTgl.getFullYear();
            const mm = String(rowTgl.getMonth() + 1).padStart(2, "0");
            const dd = String(rowTgl.getDate()).padStart(2, "0");
            formattedTgl = `${yyyy}-${mm}-${dd}`;
          } else {
            formattedTgl = String(rowTgl).trim();
          }
          if (
            formattedTgl.toLowerCase() !== filters.tanggal.toLowerCase() &&
            !formattedTgl.includes(filters.tanggal)
          )
            return;
        }
        if (filters.bulan && filters.bulan !== "") {
          const mappedBln = getMonthName(currentBln);
          const filterBlnName = getMonthName(filters.bulan);
          const currentBlnNum = parseInt(currentBln, 10);
          const filterBlnNum = parseInt(filters.bulan, 10);

          const isMatch =
            mappedBln.toLowerCase() === filters.bulan.toLowerCase() ||
            mappedBln.toLowerCase() === filterBlnName.toLowerCase() ||
            (!isNaN(currentBlnNum) && !isNaN(filterBlnNum) && currentBlnNum === filterBlnNum);

          if (!isMatch) return;
        }
        if (filters.tahun) {
          if (
            currentThn.toLowerCase() !== filters.tahun.toLowerCase() &&
            !currentThn.includes(filters.tahun)
          )
            return;
        }
        if (filters.ulp && ulpIdx !== -1) {
          const rowUlp = String(row[ulpIdx]).trim();
          if (
            rowUlp.toLowerCase() !== filters.ulp.toLowerCase() &&
            !rowUlp.toLowerCase().includes(filters.ulp.toLowerCase())
          )
            return;
        }
        if (filters.gi && giIdx !== -1) {
          const rowGi = String(row[giIdx]).trim();
          if (
            rowGi.toLowerCase() !== filters.gi.toLowerCase() &&
            !rowGi.toLowerCase().includes(filters.gi.toLowerCase())
          )
            return;
        }
        if (filters.penyulang && penyulangIdx !== -1) {
          const rowPenyulang = String(row[penyulangIdx]).trim();
          if (
            rowPenyulang.toLowerCase() !== filters.penyulang.toLowerCase() &&
            !rowPenyulang
              .toLowerCase()
              .includes(filters.penyulang.toLowerCase())
          )
            return;
        }
        if (filters.sop && sopIdx !== -1) {
          const rowSop = String(row[sopIdx]).trim();
          if (
            rowSop.toLowerCase() !== filters.sop.toLowerCase() &&
            !rowSop.toLowerCase().includes(filters.sop.toLowerCase())
          )
            return;
        }

        if (filters.semester && currentBln) {
          const rowBlnInt = parseInt(currentBln);
          const sem = filters.semester.toLowerCase();
          if (sem.includes("1") && rowBlnInt > 6) return;
          if (sem.includes("2") && rowBlnInt < 7) return;
        }

        realisasiTitik++;

        if (kwhIdx !== -1 && kwhIdx < row.length)
          savingKwh += parseSafeNumber(row[kwhIdx]);
        if (rpIdx !== -1 && rpIdx < row.length)
          savingRp += parseSafeNumber(row[rpIdx]);
        if (saidiIdx !== -1 && saidiIdx < row.length)
          saidi += parseSafeNumber(row[saidiIdx]);
        if (saifiIdx !== -1 && saifiIdx < row.length)
          saifi += parseSafeNumber(row[saifiIdx]);

        if (ulpIdx !== -1 && ulpIdx < row.length) {
          const ulp = String(row[ulpIdx]).trim();
          if (ulp && ulp !== "") {
            ulpMap[ulp] = (ulpMap[ulp] || 0) + 1;
            ulpNames.add(ulp);

            let monthName = "Unknown";
            if (currentBln && currentThn) {
              monthName = `${getMonthName(currentBln)} ${currentThn}`;
            }
            if (!ulpTrendMap[monthName])
              ulpTrendMap[monthName] = { name: monthName };
            ulpTrendMap[monthName][ulp] =
              (ulpTrendMap[monthName][ulp] || 0) + 1;
          }
        }

        if (penyulangIdx !== -1 && penyulangIdx < row.length) {
          const penyulang = String(row[penyulangIdx]).trim() || "Lainnya";
          statusMap[penyulang] = (statusMap[penyulang] || 0) + 1;
        }

        if (sopIdx !== -1 && sopIdx < row.length) {
          const sop = String(row[sopIdx]).trim() || "Lainnya";
          sopMap[sop] = (sopMap[sop] || 0) + 1;
        }

        if (kategoriIdx !== -1 && kategoriIdx < row.length) {
          const ktg = String(row[kategoriIdx]).trim() || "Kosong";
          if (ktg) {
             kategoriMap[ktg] = (kategoriMap[ktg] || 0) + 1;
          }
        }

        let filteredRow = row.filter((_, i) => i !== 17 && i !== 18);
        allRecentData.push(filteredRow);
      });

      recentWOs = { headers: recentHeaders, data: allRecentData.reverse() };
    }
  }

  const monthOrder = {
    JANUARI: 1,
    FEBRUARI: 2,
    MARET: 3,
    APRIL: 4,
    MEI: 5,
    JUNI: 6,
    JULI: 7,
    AGUSTUS: 8,
    SEPTEMBER: 9,
    OKTOBER: 10,
    NOVEMBER: 11,
    DESEMBER: 12,
  };

  const chartUlpTrend = Object.values(ulpTrendMap).sort((a, b) => {
    const partsA = a.name.split(" ");
    const partsB = b.name.split(" ");

    // Sort by Date if available
    const yearA = parseInt(partsA[1]) || 0;
    const yearB = parseInt(partsB[1]) || 0;

    if (yearA !== yearB) return yearA - yearB;

    const monthA = monthOrder[partsA[0]?.toUpperCase()] || 0;
    const monthB = monthOrder[partsB[0]?.toUpperCase()] || 0;

    return monthA - monthB;
  });

  let chartUlp = Object.keys(ulpMap).map((key) => ({
    name: key,
    value: ulpMap[key],
    realisasi: ulpMap[key],
    workOrder: 0,
    totalWo: ulpMap[key],
  }));
  const chartStatus = Object.keys(statusMap).map((key) => ({
    name: key,
    value: statusMap[key],
  }));
  let chartSop = Object.keys(sopMap).map((key) => ({
    name: key,
    value: sopMap[key],
    realisasi: sopMap[key],
    workOrder: 0,
    totalWo: sopMap[key],
  }));
  const chartKategori = Object.keys(kategoriMap).map((key) => ({
    name: key,
    value: kategoriMap[key],
  }));

  // Fetch and calculate data from sheet WORK PLAN in spreadsheet WORK_PLAN
  let rencanaHarian = {
    titik: 0,
    personil: 0,
    kwh: 0,
    rp: 0,
  };
  let workPlansList = [];
  const wpUlpMap = {};
  const wpSopMap = {};

  try {
    const wpSS = SpreadsheetApp.openById(SPREADSHEETS.WORK_PLAN);
    const wpSheet = wpSS ? wpSS.getSheetByName("WORK PLAN") : null;
    if (wpSheet) {
      const wpData = wpSheet.getDataRange().getValues();
      if (wpData.length > 1) {
        const wpH = wpData[0].map((h) => String(h).trim().toUpperCase());
        const noWoIdx = wpH.indexOf("NO. WO") !== -1 ? wpH.indexOf("NO. WO") : wpH.indexOf("NO WO");
        const tglRenIdx = wpH.indexOf("TANGGAL DIRENCANAKAN");
        const ulpWpIdx = wpH.indexOf("ULP");
        const giWpIdx = wpH.indexOf("GARDU INDUK");
        const pylWpIdx = wpH.indexOf("PENYULANG");
        const sopWpIdx = wpH.indexOf("SOP PEKERJAAN");
        const progWpIdx = wpH.indexOf("PROGRES");
        const konfWpIdx = wpH.indexOf("KONFIRMASI");
        const detWpIdx = wpH.indexOf("DETAIL PEKERJAAN");
        const temuanWpIdx = wpH.indexOf("TEMUAN");
        const coordWpIdx = wpH.indexOf("TITIK KOORDINAT");

        const wpRows = wpData.slice(1);
        const matchedWp = [];

        for (let r = 0; r < wpRows.length; r++) {
          const row = wpRows[r];
          if (!row[noWoIdx] && row.join("").trim() === "") continue;

          let rowTgl = tglRenIdx !== -1 ? row[tglRenIdx] : "";
          let currentBln = "";
          let currentThn = "";

          if (rowTgl instanceof Date) {
            const witaDate = new Date(rowTgl.getTime() + 8 * 3600 * 1000);
            currentThn = String(witaDate.getUTCFullYear());
            currentBln = String(witaDate.getUTCMonth() + 1);
          } else if (typeof rowTgl === "string" && rowTgl.length > 5) {
            const parts = rowTgl.split(/[-/]/);
            if (parts.length >= 3) {
              if (parts[0].length === 4) {
                currentThn = parts[0];
                currentBln = parseInt(parts[1], 10).toString();
              } else if (parts[2].length === 4) {
                currentThn = parts[2];
                currentBln = parseInt(parts[1], 10).toString();
              }
            }
          }

          // Apply filters to WORK PLAN
          if (filters.tanggal && tglRenIdx !== -1) {
            let formattedTgl = "";
            if (rowTgl instanceof Date) {
              const w = new Date(rowTgl.getTime() + 8 * 3600 * 1000);
              const yyyy = w.getUTCFullYear();
              const mm = String(w.getUTCMonth() + 1).padStart(2, "0");
              const dd = String(w.getUTCDate()).padStart(2, "0");
              formattedTgl = `${yyyy}-${mm}-${dd}`;
            } else {
              formattedTgl = String(rowTgl).trim();
            }
            if (
              formattedTgl.toLowerCase() !== filters.tanggal.toLowerCase() &&
              !formattedTgl.includes(filters.tanggal)
            ) {
              continue;
            }
          }
          if (filters.bulan && currentBln) {
            const mappedBln = getMonthName(currentBln);
            if (
              mappedBln.toLowerCase() !== filters.bulan.toLowerCase() &&
              !mappedBln.toLowerCase().includes(filters.bulan.toLowerCase())
            ) {
              continue;
            }
          }
          if (filters.tahun && currentThn) {
            if (
              currentThn.toLowerCase() !== filters.tahun.toLowerCase() &&
              !currentThn.includes(filters.tahun)
            ) {
              continue;
            }
          }
          if (filters.ulp && ulpWpIdx !== -1) {
            const rowUlp = String(row[ulpWpIdx] || "").trim();
            if (
              rowUlp.toLowerCase() !== filters.ulp.toLowerCase() &&
              !rowUlp.toLowerCase().includes(filters.ulp.toLowerCase())
            ) {
              continue;
            }
          }
          if (filters.gi && giWpIdx !== -1) {
            const rowGi = String(row[giWpIdx] || "").trim();
            if (
              rowGi.toLowerCase() !== filters.gi.toLowerCase() &&
              !rowGi.toLowerCase().includes(filters.gi.toLowerCase())
            ) {
              continue;
            }
          }
          if (filters.penyulang && pylWpIdx !== -1) {
            const rowPyl = String(row[pylWpIdx] || "").trim();
            if (
              rowPyl.toLowerCase() !== filters.penyulang.toLowerCase() &&
              !rowPyl.toLowerCase().includes(filters.penyulang.toLowerCase())
            ) {
              continue;
            }
          }
          if (filters.sop && sopWpIdx !== -1) {
            const rowSop = String(row[sopWpIdx] || "").trim();
            if (
              rowSop.toLowerCase() !== filters.sop.toLowerCase() &&
              !rowSop.toLowerCase().includes(filters.sop.toLowerCase())
            ) {
              continue;
            }
          }
          if (filters.semester && currentBln) {
            const rowBlnInt = parseInt(currentBln, 10);
            const sem = filters.semester.toLowerCase();
            if (sem.includes("1") && rowBlnInt > 6) continue;
            if (sem.includes("2") && rowBlnInt < 7) continue;
          }

          const wpObj = {
            "NO. WO": row[noWoIdx] || "",
            "TANGGAL DIRENCANAKAN": rowTgl
              ? rowTgl instanceof Date
                ? (() => {
                    const w = new Date(rowTgl.getTime() + 8 * 3600 * 1000);
                    const y = w.getUTCFullYear();
                    const m = String(w.getUTCMonth() + 1).padStart(2, "0");
                    const d = String(w.getUTCDate()).padStart(2, "0");
                    return `${y}-${m}-${d}`;
                  })()
                : String(rowTgl)
              : "",
            "ULP": ulpWpIdx !== -1 ? String(row[ulpWpIdx] || "") : "",
            "GARDU INDUK": giWpIdx !== -1 ? String(row[giWpIdx] || "") : "",
            "PENYULANG": pylWpIdx !== -1 ? String(row[pylWpIdx] || "") : "",
            "SOP PEKERJAAN": sopWpIdx !== -1 ? String(row[sopWpIdx] || "") : "",
            "PROGRES": progWpIdx !== -1 ? String(row[progWpIdx] || "") : "",
            "KONFIRMASI": konfWpIdx !== -1 ? String(row[konfWpIdx] || "") : "",
            "DETAIL PEKERJAAN":
              detWpIdx !== -1 && row[detWpIdx]
                ? String(row[detWpIdx])
                : temuanWpIdx !== -1 && row[temuanWpIdx]
                ? String(row[temuanWpIdx])
                : "",
            "TITIK KOORDINAT": coordWpIdx !== -1 ? String(row[coordWpIdx] || "") : "",
          };
          matchedWp.push(wpObj);

          if (wpObj.ULP) {
            const uKey = wpObj.ULP.trim().toUpperCase();
            wpUlpMap[uKey] = (wpUlpMap[uKey] || 0) + 1;
          }
          if (wpObj["SOP PEKERJAAN"]) {
            const sKey = wpObj["SOP PEKERJAAN"].trim().toUpperCase();
            wpSopMap[sKey] = (wpSopMap[sKey] || 0) + 1;
          }
        }

        workPlansList = matchedWp.reverse();
        rencanaHarian.titik = matchedWp.length;
        rencanaHarian.personil = matchedWp.length > 0 ? (matchedWp.length > 5 ? 16 : 8) : 0;
        rencanaHarian.kwh = Math.round(matchedWp.length * 1400);
        rencanaHarian.rp = Math.round(matchedWp.length * 1530000);
      }
    }
  } catch (err) {
    console.error("Gagal membaca SPREADSHEETS.WORK_PLAN: " + err.message);
  }

  // Fetch Work Orders from sheet WorkOrders in spreadsheet WORK_ORDER
  const woUlpMap = {};
  const woSopMap = {};

  try {
    const woSS = SpreadsheetApp.openById(SPREADSHEETS.WORK_ORDER);
    const woSheet = woSS ? woSS.getSheetByName("WorkOrders") : null;
    if (woSheet) {
      const woData = woSheet.getDataRange().getValues();
      if (woData.length > 1) {
        const woH = woData[0].map((h) => String(h).trim().toUpperCase());
        const noWoCol = woH.indexOf("NO. WO") !== -1 ? woH.indexOf("NO. WO") : 0;
        const tglCol = woH.indexOf("TANGGAL SURVEI") !== -1 ? woH.indexOf("TANGGAL SURVEI") : 1;
        const ulpCol = woH.indexOf("ULP") !== -1 ? woH.indexOf("ULP") : 3;
        const giCol = woH.indexOf("GARDU INDUK") !== -1 ? woH.indexOf("GARDU INDUK") : 4;
        const pylCol = woH.indexOf("PENYULANG") !== -1 ? woH.indexOf("PENYULANG") : 5;
        const temuanCol = woH.indexOf("TEMUAN") !== -1 ? woH.indexOf("TEMUAN") : 7;
        const katCol = woH.indexOf("KATEGORI") !== -1 ? woH.indexOf("KATEGORI") : 9;

        const getSopFromText = (txt) => {
          const t = String(txt || "").toUpperCase();
          if (t.includes("ISOLATOR")) return "ISOLATOR";
          if (t.includes("JUMPER")) return "JUMPER";
          if (t.includes("GARDU") || t.includes("TRAFO")) return "GARDU";
          if (t.includes("TIANG")) return "TIANG";
          if (
            t.includes("FCO") ||
            t.includes("LBS") ||
            t.includes("RECLOSER") ||
            t.includes("PROTEKSI") ||
            t.includes("SWITCHING") ||
            t.includes("ARRESTER") ||
            t.includes("FUSE")
          )
            return "SWITCHING & PROTEKSI";
          if (
            t.includes("KONDUKTOR") ||
            t.includes("FASA") ||
            t.includes("POHON") ||
            t.includes("ANDONGAN") ||
            t.includes("SUTM") ||
            t.includes("KAWAT") ||
            t.includes("TALI")
          )
            return "KONDUKTOR";
          return "";
        };

        const woRows = woData.slice(1);
        for (let r = 0; r < woRows.length; r++) {
          const row = woRows[r];
          if (!row[noWoCol] && row.join("").trim() === "") continue;

          let rowTgl = tglCol !== -1 ? row[tglCol] : "";
          let currentBln = "";
          let currentThn = "";

          if (rowTgl instanceof Date) {
            currentThn = String(rowTgl.getFullYear());
            currentBln = String(rowTgl.getMonth() + 1);
          } else if (typeof rowTgl === "string" && rowTgl.length > 5) {
            const parts = rowTgl.split(/[-/]/);
            if (parts.length >= 3) {
              if (parts[0].length === 4) {
                currentThn = parts[0];
                currentBln = parseInt(parts[1], 10).toString();
              } else if (parts[2].length === 4) {
                currentThn = parts[2];
                currentBln = parseInt(parts[1], 10).toString();
              }
            }
          }

          // Work Order filtering: strictly by target Year only (extracted from filters.tahun, filters.tanggal, or default current year)
          let targetWoYear = filters.tahun ? String(filters.tahun) : "";
          if (!targetWoYear && filters.tanggal) {
            const parts = String(filters.tanggal).split(/[-/]/);
            if (parts.length >= 3) {
              targetWoYear = parts[0].length === 4 ? parts[0] : parts[2];
            }
          }
          if (!targetWoYear) {
            targetWoYear = new Date().getFullYear().toString();
          }

          if (targetWoYear && currentThn && currentThn !== targetWoYear) continue;
          // Note: Work Order is NOT filtered by filters.bulan, filters.tanggal, or filters.semester as instructed
          if (filters.ulp && ulpCol !== -1) {
            const u = String(row[ulpCol] || "").trim().toLowerCase();
            if (!u.includes(filters.ulp.toLowerCase())) continue;
          }
          if (filters.gi && giCol !== -1) {
            const g = String(row[giCol] || "").trim().toLowerCase();
            if (!g.includes(filters.gi.toLowerCase())) continue;
          }
          if (filters.penyulang && pylCol !== -1) {
            const p = String(row[pylCol] || "").trim().toLowerCase();
            if (!p.includes(filters.penyulang.toLowerCase())) continue;
          }

          const nwKey = String(row[noWoCol] || "").trim();
          const ulpVal = ulpCol !== -1 ? String(row[ulpCol] || "").trim().toUpperCase() : "";
          if (ulpVal) {
            woUlpMap[ulpVal] = (woUlpMap[ulpVal] || 0) + 1;
          }

          let sopVal = "";
          if (noWoToSopMap[nwKey]) {
            sopVal = noWoToSopMap[nwKey];
          } else {
            const temuanTxt = temuanCol !== -1 ? row[temuanCol] : "";
            const katTxt = katCol !== -1 ? row[katCol] : "";
            sopVal = getSopFromText(katTxt) || getSopFromText(temuanTxt);
          }

          if (filters.sop && sopVal) {
            if (!sopVal.toLowerCase().includes(filters.sop.toLowerCase())) continue;
          }

          if (sopVal) {
            const sKey = sopVal.trim().toUpperCase();
            woSopMap[sKey] = (woSopMap[sKey] || 0) + 1;
          }
        }
      }
    }
  } catch (err) {
    console.error("Gagal membaca SPREADSHEETS.WORK_ORDER: " + err.message);
  }

  // Build Stacked Bar Chart data for ULP and SOP using WorkOrders data
  const allUlpKeys = Array.from(new Set([...Object.keys(ulpMap), ...Object.keys(woUlpMap)]));
  if (allUlpKeys.length > 0) {
    chartUlp = allUlpKeys.map((key) => {
      const real = ulpMap[key] || 0;
      const total = woUlpMap[key] !== undefined ? Math.max(woUlpMap[key], real) : real;
      const woRemaining = Math.max(0, total - real);
      return {
        name: key,
        value: real,
        realisasi: real,
        workOrder: woRemaining,
        totalWo: total,
      };
    });
  }

  const allSopKeys = Array.from(new Set([...Object.keys(sopMap), ...Object.keys(woSopMap)]));
  if (allSopKeys.length > 0) {
    chartSop = allSopKeys.map((key) => {
      const real = sopMap[key] || 0;
      const total = woSopMap[key] !== undefined ? Math.max(woSopMap[key], real) : real;
      const woRemaining = Math.max(0, total - real);
      return {
        name: key,
        value: real,
        realisasi: real,
        workOrder: woRemaining,
        totalWo: total,
      };
    });
  }

  return {
    success: true,
    data: {
      realisasiTitik,
      targetTitik,
      savingKwh,
      targetKwh,
      savingRp,
      targetRp,
      saidi,
      saifi,
      chartUlpTrend,
      ulpNames: Array.from(ulpNames),
      chartUlp:
        chartUlp.length > 0 ? chartUlp : [{ name: "Belum Ada Data", value: 0 }],
      chartStatus:
        chartStatus.length > 0 ? chartStatus : [{ name: "Kosong", value: 1 }],
      chartSop: chartSop.length > 0 ? chartSop : [{ name: "Kosong", value: 1 }],
      chartKategori: chartKategori.length > 0 ? chartKategori : [{ name: "Kosong", value: 1 }],
      recentWOs: recentWOs,
      rencanaHarian: rencanaHarian,
      workPlans: workPlansList,
      filterOptions: filterOpts
        ? {
            semester: Array.from(filterOpts.semester).sort(),
            bulan: Array.from(filterOpts.bulan).sort(
              (a, b) => (monthOrder[a] || 0) - (monthOrder[b] || 0),
            ),
            tahun: Array.from(filterOpts.tahun).sort(),
            ulp: Array.from(filterOpts.ulp).sort(),
            gi: Array.from(filterOpts.gi).sort(),
            penyulang: Array.from(filterOpts.penyulang).sort(),
            sop: Array.from(filterOpts.sop).sort(),
          }
        : null,
    },
  };
}

function handleGetWorkOrdersHeaders() {
  const woSS = SpreadsheetApp.openById(SPREADSHEETS.WORK_ORDER);
  const woSheet = woSS.getSheetByName("WorkOrders");
  if (!woSheet)
    return { success: false, message: "Sheet WorkOrders tidak ditemukan" };

  const data = woSheet.getDataRange().getValues();
  const headers = data.shift();
  return { success: true, originalHeaders: headers };
}

/**
 * 4. GET WORK ORDERS
 */
function handleGetWorkOrders() {
  const woSS = SpreadsheetApp.openById(SPREADSHEETS.WORK_ORDER);
  const woSheet = woSS.getSheetByName("WorkOrders");
  if (!woSheet)
    return { success: false, message: "Sheet WorkOrders tidak ditemukan" };

  const data = woSheet.getDataRange().getValues();
  const headers = data.shift();

  const headersStr = headers.map((h) => String(h).toLowerCase().trim());
  const getIndex = (possibleNames) => {
    for (let name of possibleNames) {
      const idx = headersStr.findIndex((h) => h.includes(name));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const colTanggal = getIndex(["tanggal", "tgl"]);
  const colSurveyor = getIndex(["surveyor", "asisten"]);
  const colUlp = getIndex(["ulp", "unit", "area"]);
  const colGi = getIndex(["gardu induk", "gi"]);
  const colPenyulang = getIndex(["penyulang", "feeder"]);
  const colSegmen = getIndex(["segmen", "uraian"]);
  const colTemuan = getIndex(["temuan", "deskripsi"]);
  const colStatus = getIndex(["status"]);
  const colAlamat = getIndex(["alamat", "lokasi"]);
  const colKoordinat = getIndex(["koordinat"]);
  const colSkalaPrioritas = getIndex(["skala proritas", "skala prioritas"]);
  const colJenisTiang = getIndex(["jenis tiang"]);
  const colUkuranTiang = getIndex(["ukuran tiang"]);
  const colJenisKonduktor = getIndex(["jenis konduktor"]);
  const colUkuranKonduktor = getIndex(["ukuran konduktor"]);
  const colKeypoint = getIndex(["keypoint"]);
  const colKeterangan = getIndex(["keterangan", "ket"]);
  const colFoto = getIndex([
    "foto thumbnail",
    "foto gdrive",
    "foto url",
    "foto",
  ]);

  const colAppAsman = getIndex(["approval asman", "app asman"]);
  const colKetAsman = getIndex(["ket asman", "keterangan asman"]);

  // Need to be careful with TL vs Preparator vs Asman so string match is distinct
  const colAppTl = headersStr.findIndex(
    (h) => (h.includes("approval") || h.includes("app")) && h.includes("tl"),
  );
  const colKetTl = headersStr.findIndex(
    (h) => (h.includes("ket") || h.includes("keterangan")) && h.includes("tl"),
  );

  const colAppPrep = headersStr.findIndex(
    (h) => (h.includes("approval") || h.includes("app")) && h.includes("prep"),
  );
  const colKetPrep = headersStr.findIndex(
    (h) =>
      (h.includes("ket") || h.includes("keterangan")) && h.includes("prep"),
  );

  const wos = data
    .map((row, index) => {
      return {
        id: "WO-" + (index + 1),
        rowIndex: index + 2, // 1-based + 1 header = index+2
        noWo: row[0] || "",
        tanggal:
          colTanggal !== -1 && row[colTanggal]
            ? row[colTanggal] instanceof Date
              ? row[colTanggal].toLocaleDateString("id-ID")
              : String(row[colTanggal])
            : "",
        surveyor: colSurveyor !== -1 ? row[colSurveyor] : row[2] || "",
        ulp: colUlp !== -1 ? row[colUlp] : row[3] || "",
        garduInduk: colGi !== -1 ? row[colGi] : row[4] || "",
        penyulang: colPenyulang !== -1 ? row[colPenyulang] : row[5] || "",
        segmen: colSegmen !== -1 ? row[colSegmen] : row[6] || "",
        temuan: colTemuan !== -1 ? row[colTemuan] : row[7] || "",
        status:
          colStatus !== -1 ? row[colStatus] : row[8] || "Menunggu Approval",
        alamat: colAlamat !== -1 ? row[colAlamat] : "",
        koordinat: colKoordinat !== -1 ? row[colKoordinat] : "",
        skalaPrioritas: colSkalaPrioritas !== -1 ? row[colSkalaPrioritas] : "",
        jenisTiang: colJenisTiang !== -1 ? row[colJenisTiang] : "",
        ukuranTiang: colUkuranTiang !== -1 ? row[colUkuranTiang] : "",
        jenisKonduktor: colJenisKonduktor !== -1 ? row[colJenisKonduktor] : "",
        ukuranKonduktor:
          colUkuranKonduktor !== -1 ? row[colUkuranKonduktor] : "",
        keypoint: colKeypoint !== -1 ? row[colKeypoint] : "",
        keterangan: colKeterangan !== -1 ? row[colKeterangan] : "",
        foto: colFoto !== -1 ? row[colFoto] : row[17] || "",
        approvalAsman: colAppAsman !== -1 ? row[colAppAsman] : "",
        ketAsman: colKetAsman !== -1 ? row[colKetAsman] : "",
        approvalTl: colAppTl !== -1 ? row[colAppTl] : "",
        ketTl: colKetTl !== -1 ? row[colKetTl] : "",
        approvalPreparator: colAppPrep !== -1 ? row[colAppPrep] : "",
        ketPreparator: colKetPrep !== -1 ? row[colKetPrep] : "",
      };
    })
    .filter((wo) => wo.noWo !== "");

  return { success: true, data: wos.reverse() };
}

/**
 * 5. GET OPTIONS (Dropdown lists)
 */
function handleGetOptions() {
  const woSS = SpreadsheetApp.openById(SPREADSHEETS.WORK_ORDER);

  let unitJar = [];
  const unitSheet = woSS.getSheetByName("UNIT JAR");
  if (unitSheet) {
    const data = unitSheet.getDataRange().getValues();
    data.shift();
    unitJar = data
      .map((r) => ({ ulp: r[0], gi: r[1], penyulang: r[2], segmen: r[3] }))
      .filter((x) => x.ulp);
  }

  let spekJtm = {};
  const spekSheet = woSS.getSheetByName("SPEK JTM");
  if (spekSheet) {
    const data = spekSheet.getDataRange().getValues();
    if (data.length > 0) {
      const headers = data.shift();
      headers.forEach((h) => (spekJtm[h] = []));
      data.forEach((row) => {
        headers.forEach((h, i) => {
          if (row[i] !== "" && row[i] !== null && row[i] !== undefined)
            spekJtm[h].push(row[i]);
        });
      });
    }
  }

  let approvalOpts = [];
  const appSheet = woSS.getSheetByName("DROPDOWN APPROVAL WO");
  if (appSheet) {
    const data = appSheet.getDataRange().getValues();
    data.shift();
    approvalOpts = data.map((r) => r[0]).filter(Boolean);
  }

  let dropdownData = {};
  let dropdownRaw = [];
  const reviewWoSS = SpreadsheetApp.openById(SPREADSHEETS.REVIEW_WO);
  const dropdownSheet = reviewWoSS.getSheetByName("DROPDOWN");
  if (dropdownSheet) {
    const data = dropdownSheet.getDataRange().getValues();
    if (data.length > 0) {
      const headers = data.shift();
      headers.forEach((h) => {
        if (h) dropdownData[h] = [];
      });
      data.forEach((row) => {
        let rowObj = {};
        headers.forEach((h, i) => {
          if (h) {
            rowObj[h] = row[i];
            if (row[i] !== "" && row[i] !== null && row[i] !== undefined)
              dropdownData[h].push(row[i]);
          }
        });
        dropdownRaw.push(rowObj);
      });
    }
  }

  return {
    success: true,
    data: {
      unitJar,
      spekJtm,
      approvalOptions: approvalOpts,
      dropdownData,
      dropdownRaw,
    },
  };
}

/**
 * Helper: UPLOAD BASE64 TO GDRIVE
 */
function uploadBase64ToDrive(base64Str, filename, folderIdStr) {
  try {
    if (!base64Str || !base64Str.includes("base64,")) return "";
    const folderId = folderIdStr || DRIVE_FOLDERS.WO;
    const folder = DriveApp.getFolderById(folderId);

    const parts = base64Str.split("base64,");
    const data = parts[1];

    let mimeType = "image/jpeg";
    if (parts[0].includes("image/png")) mimeType = "image/png";
    else if (parts[0].includes("image/webp")) mimeType = "image/webp";

    if (mimeType === "image/png" && !filename.includes(".png"))
      filename = filename.replace(".jpg", ".png");

    const blob = Utilities.newBlob(
      Utilities.base64Decode(data),
      mimeType,
      filename,
    );
    const file = folder.createFile(blob);

    try {
      file.setSharing(
        DriveApp.Access.ANYONE_WITH_LINK,
        DriveApp.Permission.VIEW,
      );
    } catch (shareErr) {
      // Ignored for Workspace accounts that disable "anyone with link" sharing
    }

    return { url: file.getUrl(), id: file.getId() };
  } catch (e) {
    console.error("Drive Upload Error", e);
    return null;
  }
}

/**
 * 6. SUBMIT WORK ORDER BARU
 */
function handleSubmitWorkOrder(payload) {
  const woSS = SpreadsheetApp.openById(SPREADSHEETS.WORK_ORDER);
  const woSheet = woSS.getSheetByName("WorkOrders");
  if (!woSheet)
    return { success: false, message: "Sheet WorkOrders tidak ditemukan" };

  const data = woSheet.getDataRange().getValues();
  const headers = data[0];
  const headersStr = headers.map((h) => String(h).toLowerCase().trim());

  const getIndex = (possibleNames) => {
    for (let name of possibleNames) {
      const idx = headersStr.findIndex((h) => h.includes(name));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  let actualLastRow = 1;
  const noWOIndex = getIndex(["no. wo", "no wo"]);
  let maxWO = 0;

  if (noWOIndex !== -1) {
    for (let i = data.length - 1; i >= 0; i--) {
      if (String(data[i][noWOIndex]).trim() !== "") {
        actualLastRow = i + 1;
        break;
      }
    }
    // Cari nilai WO tertinggi untuk menentukan nomor urut berikutnya secara andal
    for (let i = 1; i < data.length; i++) {
      const valStr = String(data[i][noWOIndex]).trim();
      const val = parseInt(valStr, 10);
      if (!isNaN(val) && val > maxWO) {
        maxWO = val;
      }
    }
  } else {
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i].join("").trim() !== "") {
        actualLastRow = i + 1;
        break;
      }
    }
  }

  // Gunakan maxWO + 1 jika ditemukan, jika tidak, gunakan baris terakhir + 1
  const autoGeneratedNo = maxWO > 0 ? String(maxWO + 1) : String(actualLastRow);

  let fotoUrl = "";
  let fotoId = "";
  if (payload.fotoBase64) {
    const uploadRes = uploadBase64ToDrive(
      payload.fotoBase64,
      autoGeneratedNo + ".jpg",
    );
    if (uploadRes) {
      fotoUrl = uploadRes.url;
      fotoId = uploadRes.id;
    }
  }

  const updates = [];

  const setVal = (possibleNames, val) => {
    const idx = getIndex(possibleNames);
    if (idx !== -1) updates.push({ col: idx + 1, val });
  };

  setVal(["no. wo", "no wo"], autoGeneratedNo);
  setVal(["tanggal survey", "tanggal", "tgl survey", "tgl"], formatDateToID(new Date()));
  setVal(["surveyor"], payload.surveyor || "");
  setVal(["kategori"], payload.kategori || "");
  setVal(["ulp", "unit"], payload.ulp || "");
  setVal(["gardu induk", "gi"], payload.garduInduk || "");
  setVal(["penyulang", "feeder"], payload.penyulang || "");
  setVal(["segmen", "uraian"], payload.segmen || "");
  setVal(["temuan", "deskripsi"], payload.temuan || "");
  setVal(["alamat", "lokasi"], payload.alamat || "");
  setVal(["koordinat", "titik koordinat"], payload.koordinat || "");
  setVal(["skala proritas", "skala prioritas"], payload.skalaPrioritas || "");
  setVal(["jenis tiang"], payload.jenisTiang || "");
  setVal(["ukuran tiang"], payload.ukuranTiang || "");
  setVal(["jenis konduktor"], payload.jenisKonduktor || "");
  setVal(["ukuran konduktor"], payload.ukuranKonduktor || "");
  setVal(["keypoint"], payload.keypoint || "");
  setVal(["keterangan", "ket"], payload.keterangan || "");
  setVal(
    ["foto thumbnail"],
    fotoId ? "https://lh3.googleusercontent.com/d/" + fotoId : "",
  );
  setVal(["foto gdrive", "foto url", "foto", "eviden"], fotoUrl); // Make sure "foto gdrive" matches first if possible or just foto

  if (updates.length === 0) {
    return {
      success: false,
      message: "Format header spreadsheet tidak valid.",
    };
  }

  updates.forEach(u => {
    woSheet.getRange(actualLastRow + 1, u.col).setValue(u.val);
  });

  return {
    success: true,
    message: "Work Order berhasil ditambahkan",
    data: { noWo: autoGeneratedNo, status: "Menunggu Approval" },
  };
}

/**
 * DELETE WORK ORDERS (Utility)
 */
function handleDeleteWorkOrders(payload) {
  const { nos } = payload; // Array of noWo to delete
  if (!nos || !Array.isArray(nos))
    return { success: false, message: "nos array required" };

  const woSS = SpreadsheetApp.openById(SPREADSHEETS.WORK_ORDER);
  const woSheet = woSS.getSheetByName("WorkOrders");
  if (!woSheet)
    return { success: false, message: "Sheet WorkOrders tidak ditemukan" };

  const data = woSheet.getDataRange().getValues();
  // Iterate backwards so deleting rows doesn't mess up indices
  let deletedCount = 0;
  for (let i = data.length - 1; i >= 1; i--) {
    const rowNo = String(data[i][0]).trim();
    if (nos.some((n) => String(n).trim() === rowNo)) {
      woSheet.deleteRow(i + 1); // +1 because array is 0-indexed, rows are 1-indexed
      deletedCount++;
    }
  }

  return { success: true, message: `Berhasil menghapus ${deletedCount} baris` };
}

/**
 * 7. UPDATE APPROVAL WO
 */
function handleUpdateApproval(payload) {
  const { rowIndex, role, status, keterangan } = payload;
  if (!rowIndex || !role)
    return { success: false, message: "Row Index dan Role wajib diisi" };

  const woSS = SpreadsheetApp.openById(SPREADSHEETS.WORK_ORDER);
  const woSheet = woSS.getSheetByName("WorkOrders");

  let targetCol, targetKetCol;
  if (role.toUpperCase().includes("ASMAN")) {
    targetCol = 11;
    targetKetCol = 12;
  } // K, L
  else if (role.toUpperCase().includes("TL PDKB")) {
    targetCol = 13;
    targetKetCol = 14;
  } // M, N
  else if (role.toUpperCase().includes("PREPARATOR")) {
    targetCol = 15;
    targetKetCol = 16;
  } // O, P
  else return { success: false, message: "Role tidak valid untuk approval" };

  woSheet.getRange(rowIndex, targetCol).setValue(status);
  if (keterangan) woSheet.getRange(rowIndex, targetKetCol).setValue(keterangan);

  // Update Status Gabungan (I) otomatis sesuai alur
  let newGlobalStatus = status;
  if (status.toLowerCase().includes("disetujui")) {
    if (role.toUpperCase().includes("ASMAN"))
      newGlobalStatus = "Menunggu Approval TL PDKB";
    else if (role.toUpperCase().includes("TL PDKB"))
      newGlobalStatus = "Menunggu Approval PREPARATOR";
  }
  woSheet.getRange(rowIndex, 9).setValue(newGlobalStatus);

  return {
    success: true,
    message: `Approval ${role} berhasil diperbarui`,
    data: { globalStatus: newGlobalStatus },
  };
}

function deleteRowsByNoWo(sheet, noWo) {
  if (!sheet) return;
  const data = sheet.getDataRange().getValues();
  // Go backwards to not mess up indices when deleting
  for (let i = data.length - 1; i >= 1; i--) {
    // skip header
    if (String(data[i][0]).trim() === String(noWo).trim()) {
      sheet.deleteRow(i + 1);
    }
  }
}

/**
 * 8. UPDATE SECURITY
 */
function handleSubmitReviewForm(payload) {
  const {
    rowIndex,
    noWo,
    pekerjaan,
    materials,
    area,
    konstruksi,
    hazards,
    approval,
  } = payload;

  const reviewWoSS = SpreadsheetApp.openById(SPREADSHEETS.REVIEW_WO);

  // 1. Update Preparator Approval in WorkOrders is deliberately skipped so it only updates APPROVAL REVIEW sheet.
  // Code block removed as per user request.

  // Helper untuk mencari baris berdasarkan NO. WO
  function findRowIndexByNoWo(sheet, targetNoWo) {
    if (!sheet || !targetNoWo) return -1;
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return -1;
    const headers = data[0].map(h => h ? h.toString().toUpperCase().trim() : "");
    let noWoColIdx = headers.indexOf("NO. WO");
    if (noWoColIdx === -1) noWoColIdx = 0; // Default kolom A
    
    const target = String(targetNoWo).trim().toLowerCase();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][noWoColIdx]).trim().toLowerCase() === target) {
        return i + 1; // 1-based index untuk Google Sheets Range
      }
    }
    return -1;
  }

  // Helper untuk memastikan NO. WO tersimpan ke dalam kolom NO. WO pada suatu sheet tanpa duplikasi
  function ensureNoWoInSheet(sheet, targetNoWo) {
    if (!sheet || !targetNoWo) return;
    try {
      const data = sheet.getDataRange().getValues();
      let noWoColIdx = 0;
      if (data.length > 0) {
        const headers = data[0].map(h => h ? h.toString().toUpperCase().trim() : "");
        const idx = headers.indexOf("NO. WO");
        if (idx > -1) noWoColIdx = idx;
      }
      const targetStr = String(targetNoWo).trim().toLowerCase();
      let exists = false;
      let targetRow = data.length + 1;
      for (let i = 1; i < data.length; i++) {
        const val = String(data[i][noWoColIdx]).trim().toLowerCase();
        if (val === targetStr) {
          exists = true;
          break;
        }
        if (!val && targetRow === data.length + 1) {
          targetRow = i + 1;
        }
      }
      if (!exists) {
        sheet.getRange(targetRow, noWoColIdx + 1).setValue(targetNoWo);
      }
    } catch (err) {
      console.warn("ensureNoWoInSheet warning:", err);
    }
  }

  // 1.5. Clean up existing rows HANYA untuk sheet list berulang (MATERIAL dan HAZARD)
  // Sheet KON_SEKITAR, KON_KONSTRUKSI, dan PEKERJAAN TIDAK DIHAPUS agar rumus/formula di kolom NO. WO tetap utuh
  deleteRowsByNoWo(reviewWoSS.getSheetByName("MATERIAL"), noWo);
  deleteRowsByNoWo(reviewWoSS.getSheetByName("HAZARD"), noWo);

  // 2. Upload Images for Area
  let urlFotoArea = area ? area.fotoAreaBase64 || "" : "";
  if (urlFotoArea && urlFotoArea.includes("base64,")) {
    const res = uploadBase64ToDrive(
      urlFotoArea,
      noWo + "-AREA.jpg",
      DRIVE_FOLDERS.AREA,
    );
    urlFotoArea = res ? "https://lh3.googleusercontent.com/d/" + res.id : "";
  }
  let urlFotoTanah = area ? area.fotoTanahBase64 || "" : "";
  if (urlFotoTanah && urlFotoTanah.includes("base64,")) {
    const res = uploadBase64ToDrive(
      urlFotoTanah,
      noWo + "-TANAH.jpg",
      DRIVE_FOLDERS.AREA,
    );
    urlFotoTanah = res ? "https://lh3.googleusercontent.com/d/" + res.id : "";
  }

  // 3. Save to KON_SEKITAR: Cari NO. WO lalu isi kolom lainnya tanpa menimpa NO. WO
  const sheetSekitar = reviewWoSS.getSheetByName("KON_SEKITAR");
  if (sheetSekitar && area) {
    const rIdx = findRowIndexByNoWo(sheetSekitar, noWo);
    const dataSekitar = sheetSekitar.getDataRange().getValues();
    const headersSekitar = (dataSekitar[0] || []).map(h => h ? h.toString().toUpperCase().trim() : "");
    const noWoCol = headersSekitar.indexOf("NO. WO") > -1 ? headersSekitar.indexOf("NO. WO") + 1 : 1;
    const colArea = headersSekitar.indexOf("AREA PEKERJAAN") > -1 ? headersSekitar.indexOf("AREA PEKERJAAN") + 1 : 2;
    const colFotoArea = headersSekitar.indexOf("FOTO AREA") > -1 ? headersSekitar.indexOf("FOTO AREA") + 1 : 3;
    const colTanah = headersSekitar.indexOf("KONDISI TANAH") > -1 ? headersSekitar.indexOf("KONDISI TANAH") + 1 : 4;
    const colFotoTanah = headersSekitar.indexOf("FOTO TANAH") > -1 ? headersSekitar.indexOf("FOTO TANAH") + 1 : 5;
    const colJarak = headersSekitar.indexOf("JARAK LOKASI-JALAN RAYA") > -1 ? headersSekitar.indexOf("JARAK LOKASI-JALAN RAYA") + 1 : (headersSekitar.indexOf("JARAK") > -1 ? headersSekitar.indexOf("JARAK") + 1 : 6);

    if (rIdx > -1) {
      // Baris ditemukan: isi kolom data lainnya tanpa menyentuh kolom NO. WO
      if (colArea > 0 && colArea !== noWoCol) sheetSekitar.getRange(rIdx, colArea).setValue(area.areaPekerjaan || "");
      if (colFotoArea > 0 && colFotoArea !== noWoCol) sheetSekitar.getRange(rIdx, colFotoArea).setValue(urlFotoArea || "");
      if (colTanah > 0 && colTanah !== noWoCol) sheetSekitar.getRange(rIdx, colTanah).setValue(area.kondisiTanah || "");
      if (colFotoTanah > 0 && colFotoTanah !== noWoCol) sheetSekitar.getRange(rIdx, colFotoTanah).setValue(urlFotoTanah || "");
      if (colJarak > 0 && colJarak !== noWoCol) sheetSekitar.getRange(rIdx, colJarak).setValue(area.jarakJalanRaya || "");
    } else {
      // Jika baris belum ada di sheet, baru tambahkan
      sheetSekitar.appendRow([
        noWo,
        area.areaPekerjaan || "",
        urlFotoArea,
        area.kondisiTanah || "",
        urlFotoTanah,
        area.jarakJalanRaya || "",
      ]);
    }
  }

  // 4. Upload Images for Konstruksi
  let urlFotoSutm = konstruksi ? konstruksi.fotoSutmBase64 || "" : "";
  if (urlFotoSutm && urlFotoSutm.includes("base64,")) {
    const res = uploadBase64ToDrive(
      urlFotoSutm,
      noWo + "-SUTM.jpg",
      DRIVE_FOLDERS.KONSTRUKSI,
    );
    urlFotoSutm = res ? "https://lh3.googleusercontent.com/d/" + res.id : "";
  }
  let urlFotoTiang = konstruksi ? konstruksi.fotoTiangBase64 || "" : "";
  if (urlFotoTiang && urlFotoTiang.includes("base64,")) {
    const res = uploadBase64ToDrive(
      urlFotoTiang,
      noWo + "-TIANG.jpg",
      DRIVE_FOLDERS.KONSTRUKSI,
    );
    urlFotoTiang = res ? "https://lh3.googleusercontent.com/d/" + res.id : "";
  }
  let urlFotoLanjut = konstruksi ? konstruksi.fotoKonstruksiBase64 || "" : "";
  if (urlFotoLanjut && urlFotoLanjut.includes("base64,")) {
    const res = uploadBase64ToDrive(
      urlFotoLanjut,
      noWo + "-KONSTRUKSI_LANJUT.jpg",
      DRIVE_FOLDERS.KONSTRUKSI,
    );
    urlFotoLanjut = res ? "https://lh3.googleusercontent.com/d/" + res.id : "";
  }

  // 5. Save to KON_KONSTRUKSI: Cari NO. WO lalu isi kolom lainnya tanpa menimpa NO. WO
  const sheetKonstruksi = reviewWoSS.getSheetByName("KON_KONSTRUKSI");
  if (sheetKonstruksi && konstruksi) {
    const rIdx = findRowIndexByNoWo(sheetKonstruksi, noWo);
    const dataKon = sheetKonstruksi.getDataRange().getValues();
    const headersKon = (dataKon[0] || []).map(h => h ? h.toString().toUpperCase().trim() : "");
    const noWoCol = headersKon.indexOf("NO. WO") > -1 ? headersKon.indexOf("NO. WO") + 1 : 1;
    const colSutm = headersKon.indexOf("SUTM") > -1 ? headersKon.indexOf("SUTM") + 1 : 2;
    const colFotoSutm = headersKon.indexOf("FOTO SUTM") > -1 ? headersKon.indexOf("FOTO SUTM") + 1 : 3;
    const colKonstruksi = headersKon.indexOf("KONSTRUKSI") > -1 ? headersKon.indexOf("KONSTRUKSI") + 1 : 4;
    const colFotoKonstruksi = headersKon.indexOf("FOTO KONSTRUKSI") > -1 ? headersKon.indexOf("FOTO KONSTRUKSI") + 1 : 5;
    const colTiang = headersKon.indexOf("TIANG") > -1 ? headersKon.indexOf("TIANG") + 1 : 6;
    const colFotoTiang = headersKon.indexOf("FOTO TIANG") > -1 ? headersKon.indexOf("FOTO TIANG") + 1 : 7;

    if (rIdx > -1) {
      // Baris ditemukan: isi kolom data lainnya tanpa menyentuh kolom NO. WO
      if (colSutm > 0 && colSutm !== noWoCol) sheetKonstruksi.getRange(rIdx, colSutm).setValue(konstruksi.konstruksi1 || "");
      if (colFotoSutm > 0 && colFotoSutm !== noWoCol) sheetKonstruksi.getRange(rIdx, colFotoSutm).setValue(urlFotoSutm || "");
      if (colKonstruksi > 0 && colKonstruksi !== noWoCol) sheetKonstruksi.getRange(rIdx, colKonstruksi).setValue(konstruksi.konstruksi3 || "");
      if (colFotoKonstruksi > 0 && colFotoKonstruksi !== noWoCol) sheetKonstruksi.getRange(rIdx, colFotoKonstruksi).setValue(urlFotoLanjut || "");
      if (colTiang > 0 && colTiang !== noWoCol) sheetKonstruksi.getRange(rIdx, colTiang).setValue(konstruksi.konstruksi2 || "");
      if (colFotoTiang > 0 && colFotoTiang !== noWoCol) sheetKonstruksi.getRange(rIdx, colFotoTiang).setValue(urlFotoTiang || "");
    } else {
      sheetKonstruksi.appendRow([
        noWo,
        konstruksi.konstruksi1 || "",
        urlFotoSutm,
        konstruksi.konstruksi3 || "",
        urlFotoLanjut,
        konstruksi.konstruksi2 || "",
        urlFotoTiang,
      ]);
    }
  }

  // 6. Save to PEKERJAAN: Cari NO. WO lalu isi kolom lainnya tanpa menimpa NO. WO
  const sheetPekerjaan = reviewWoSS.getSheetByName("PEKERJAAN");
  if (sheetPekerjaan && pekerjaan) {
    const rIdx = findRowIndexByNoWo(sheetPekerjaan, noWo);
    const dataPek = sheetPekerjaan.getDataRange().getValues();
    const headersPek = (dataPek[0] || []).map(h => h ? h.toString().toUpperCase().trim() : "");
    const noWoCol = headersPek.indexOf("NO. WO") > -1 ? headersPek.indexOf("NO. WO") + 1 : 1;
    const colSop = headersPek.indexOf("SOP PEKERJAAN") > -1 ? headersPek.indexOf("SOP PEKERJAAN") + 1 : (headersPek.indexOf("SOP") > -1 ? headersPek.indexOf("SOP") + 1 : 2);
    const colIk = headersPek.indexOf("INSTRUKSI KERJA") > -1 ? headersPek.indexOf("INSTRUKSI KERJA") + 1 : (headersPek.indexOf("INSTRUKSI") > -1 ? headersPek.indexOf("INSTRUKSI") + 1 : 3);
    const colDetail = headersPek.indexOf("DETAIL PEKERJAAN") > -1 ? headersPek.indexOf("DETAIL PEKERJAAN") + 1 : (headersPek.indexOf("DETAIL") > -1 ? headersPek.indexOf("DETAIL") + 1 : 4);

    if (rIdx > -1) {
      // Baris ditemukan: isi kolom data lainnya tanpa menyentuh kolom NO. WO
      if (colSop > 0 && colSop !== noWoCol) sheetPekerjaan.getRange(rIdx, colSop).setValue(pekerjaan.sop || "");
      if (colIk > 0 && colIk !== noWoCol) sheetPekerjaan.getRange(rIdx, colIk).setValue(pekerjaan.instruksi || "");
      if (colDetail > 0 && colDetail !== noWoCol) sheetPekerjaan.getRange(rIdx, colDetail).setValue(pekerjaan.detail || "");
    } else {
      sheetPekerjaan.appendRow([
        noWo,
        pekerjaan.sop || "",
        pekerjaan.instruksi || "",
        pekerjaan.detail || "",
      ]);
    }
  }

  // 7. Save Material List
  if (materials && materials.length > 0) {
    const sheetMaterials = reviewWoSS.getSheetByName("MATERIAL");
    const newMats = [];

    materials.forEach((mat) => {
      if (mat.nama || mat.spesifikasi || mat.volume || mat.keterangan) {
        if (sheetMaterials) {
          newMats.push([
            noWo,
            mat.nama || "",
            mat.spesifikasi || "",
            mat.volume || "",
            mat.keterangan || "",
          ]);
        }
        // UPDATE WAREHOUSE KELUAR DIPINDAH / DIHAPUS (sesuai request)
      }
    });

    if (sheetMaterials && newMats.length > 0) {
      sheetMaterials.getRange(sheetMaterials.getLastRow() + 1, 1, newMats.length, 5).setValues(newMats);
    }
  }

  // 8. Save Hazards List
  if (hazards && hazards.length > 0) {
    const sheetHazards = reviewWoSS.getSheetByName("HAZARD");
    const newHazs = [];
    if (sheetHazards) {
      hazards.forEach((haz, index) => {
        if (
          haz.nama ||
          haz.keterangan ||
          haz.potensi ||
          haz.risiko ||
          haz.mitigasi ||
          haz.foto
        ) {
          let urlFotoHaz = haz.foto || "";
          if (urlFotoHaz && urlFotoHaz.includes("base64,")) {
            const res = uploadBase64ToDrive(
              urlFotoHaz,
              noWo + "-HAZARD-" + (index + 1) + ".jpg",
              DRIVE_FOLDERS.HAZARD,
            );
            urlFotoHaz = res
              ? "https://lh3.googleusercontent.com/d/" + res.id
              : "";
          }
          newHazs.push([
            noWo,
            index + 1, // NO. HAZARD
            haz.nama || "",
            haz.keterangan || "", // KETERANGAN
            haz.potensi || "",
            haz.risiko || "",
            haz.mitigasi || "",
            urlFotoHaz,
          ]);
        }
      });
      if (newHazs.length > 0) {
        sheetHazards.getRange(sheetHazards.getLastRow() + 1, 1, newHazs.length, 8).setValues(newHazs);
      }
    }
  }

  // 9. Save Approval Review Details
  const sheetApprovalReview = reviewWoSS.getSheetByName("APPROVAL REVIEW");
  if (sheetApprovalReview && approval) {
    let data = sheetApprovalReview.getDataRange().getValues();
    if (data.length === 0) {
       // Initialize headers if empty
       sheetApprovalReview.appendRow([
         "NO. WO", "APPROVAL PREPARATOR", "KET PREPARATOR", "APPROVAL SPV", "KET SPV", "TANGGAL DIRENCANAKAN"
       ]);
       data = sheetApprovalReview.getDataRange().getValues();
    }
    const headers = data[0].map(h => h ? h.toString().toUpperCase().trim() : "");
    const noWoColIdx = headers.indexOf("NO. WO") > -1 ? headers.indexOf("NO. WO") + 1 : 1;
    const prefStatusColIdx = headers.indexOf("APPROVAL PREPARATOR") > -1 ? headers.indexOf("APPROVAL PREPARATOR") + 1 : 2;
    const prefKetColIdx = headers.indexOf("KET PREPARATOR") > -1 ? headers.indexOf("KET PREPARATOR") + 1 : 3;
    const pelaksanaIdx = headers.indexOf("PELAKSANA PDKB") > -1 ? headers.indexOf("PELAKSANA PDKB") + 1 : 5;
    const picUnitIdx = headers.indexOf("PIC UNIT") > -1 ? headers.indexOf("PIC UNIT") + 1 : 6;
    const tanggalColIdx = headers.indexOf("TANGGAL DIRENCANAKAN") > -1 ? headers.indexOf("TANGGAL DIRENCANAKAN") + 1 : 7;

    const rowIndex = findRowIndexByNoWo(sheetApprovalReview, noWo);
    const tglRen = formatDateToID(approval.tanggalRencana) || "";
    
    if (rowIndex > -1) {
       // Update existing row independently to preserve formulas in other columns like NO. WO
       if (prefStatusColIdx > 0 && prefStatusColIdx !== noWoColIdx) sheetApprovalReview.getRange(rowIndex, prefStatusColIdx).setValue(approval.status || "");
       if (prefKetColIdx > 0 && prefKetColIdx !== noWoColIdx) sheetApprovalReview.getRange(rowIndex, prefKetColIdx).setValue(approval.keterangan || "");
       if (pelaksanaIdx > 0 && pelaksanaIdx !== noWoColIdx) sheetApprovalReview.getRange(rowIndex, pelaksanaIdx).setValue(approval.pelaksanaPdkb || "");
       if (picUnitIdx > 0 && picUnitIdx !== noWoColIdx) sheetApprovalReview.getRange(rowIndex, picUnitIdx).setValue(approval.picUnit || "");
       if (tanggalColIdx > 0 && tanggalColIdx !== noWoColIdx) sheetApprovalReview.getRange(rowIndex, tanggalColIdx).setValue(tglRen);
    }
  }

  // 10. Update TRACKING sheet dan WORK PLAN sheet pada spreadsheet WORK_PLAN (setiap submit review WO)
  try {
    const wpSS = SpreadsheetApp.openById(SPREADSHEETS.WORK_PLAN);
    
    // Pastikan NO. WO tersimpan di sheet TRACKING
    const sheetTracking = wpSS.getSheetByName("TRACKING");
    if (sheetTracking) {
      ensureNoWoInSheet(sheetTracking, noWo);
    }

    // Pastikan NO. WO tersimpan di sheet WORK PLAN
    const sheetWorkPlan = wpSS.getSheetByName("WORK PLAN");
    if (sheetWorkPlan) {
      ensureNoWoInSheet(sheetWorkPlan, noWo);
    }
  } catch (e) {
    console.error("Error updating TRACKING or WORK PLAN sheet in WORK_PLAN spreadsheet:", e);
  }

  // 11. Pastikan NO. WO tersimpan ke sheet PEKERJAAN, MATERIAL, KON_SEKITAR, KON_KONSTRUKSI, dan HAZARD
  try {
    const targetSheets = [
      reviewWoSS.getSheetByName("PEKERJAAN") || reviewWoSS.getSheetByName("PEKERJAN"),
      reviewWoSS.getSheetByName("MATERIAL"),
      reviewWoSS.getSheetByName("KON_SEKITAR"),
      reviewWoSS.getSheetByName("KON_KONSTRUKSI"),
      reviewWoSS.getSheetByName("HAZARD")
    ];
    targetSheets.forEach(function(s) {
      if (s) ensureNoWoInSheet(s, noWo);
    });

    // Cek juga jika ada spreadsheet TRACKING_EVIDENCES terpisah yang merupakan Google Spreadsheet
    if (SPREADSHEETS.TRACKING_EVIDENCES && SPREADSHEETS.TRACKING_EVIDENCES !== SPREADSHEETS.REVIEW_WO) {
      try {
        const teSS = SpreadsheetApp.openById(SPREADSHEETS.TRACKING_EVIDENCES);
        if (teSS) {
          const teSheetNames = ["PEKERJAAN", "PEKERJAN", "MATERIAL", "KON_SEKITAR", "KON_KONSTRUKSI", "HAZARD"];
          teSheetNames.forEach(function(name) {
            const ts = teSS.getSheetByName(name);
            if (ts) ensureNoWoInSheet(ts, noWo);
          });
        }
      } catch (errTe) {
        // Abaikan jika TRACKING_EVIDENCES adalah folder Google Drive
      }
    }
  } catch (errEnsure) {
    console.error("Error ensuring NO. WO in evidence sheets:", errEnsure);
  }

  return {
    success: true,
    message: "Form Review WO berhasil disimpan dan approval diperbarui",
  };
}

/**
 * 9. GET REVIEWED WOs
 */
function handleGetReviewedWOs() {
  const reviewWoSS = SpreadsheetApp.openById(SPREADSHEETS.REVIEW_WO);
  const sheetApproval = reviewWoSS.getSheetByName("APPROVAL REVIEW");
  if (!sheetApproval)
    return { success: false, message: "Sheet APPROVAL REVIEW tidak ditemukan" };

  const data = sheetApproval.getDataRange().getValues();
  const headers = data.shift();
  const hApproval = headers.map(h => h ? h.toString().toUpperCase().trim() : "");
  const cNoWo = hApproval.indexOf("NO. WO") > -1 ? hApproval.indexOf("NO. WO") : 0;
  const cApprPrep = hApproval.indexOf("APPROVAL PREPARATOR") > -1 ? hApproval.indexOf("APPROVAL PREPARATOR") : 1;
  const cKetPrep = hApproval.indexOf("KET PREPARATOR") > -1 ? hApproval.indexOf("KET PREPARATOR") : 2;
  const cTgl = hApproval.indexOf("TANGGAL DIRENCANAKAN") > -1 ? hApproval.indexOf("TANGGAL DIRENCANAKAN") : 5;

  const woSS = SpreadsheetApp.openById(SPREADSHEETS.WORK_ORDER);
  const woSheet = woSS.getSheetByName("WorkOrders");
  const woData = woSheet ? woSheet.getDataRange().getValues() : [];
  const woHeaders = woData.length > 0 ? woData.shift() : [];

  const woHeadersStr = woHeaders.map((h) => h?.toString().toLowerCase().trim());
  const colTemuan = woHeadersStr.findIndex((h) => h?.includes("temuan") || h?.includes("deskripsi"));
  const colStatus = woHeadersStr.findIndex((h) => h?.includes("status"));
  const colFoto = woHeadersStr.findIndex(
    (h) =>
      h?.includes("foto") ||
      h?.includes("thumbnail") ||
      h?.includes("gambar") ||
      h?.includes("eviden"),
  );
  
  const getIndex = (possibleNames) => {
    for (let name of possibleNames) {
      const idx = woHeadersStr.findIndex((h) => h.includes(name));
      if (idx !== -1) return idx;
    }
    return -1;
  };
  const colUlp = getIndex(["ulp", "unit", "area"]);
  const colGi = getIndex(["gardu induk", "gi"]);
  const colPenyulang = getIndex(["penyulang", "feeder"]);
  const colSegmen = getIndex(["segmen", "uraian"]);
  const colAlamat = getIndex(["alamat", "lokasi"]);

  const results = data
    .map((row, idx) => {
      const noWo = row[cNoWo];
      const wd = woData.find((w) => w[0] === noWo);
      let tglRen = row[cTgl];
      if (tglRen instanceof Date) {
        try {
          tglRen = Utilities.formatDate(tglRen, "Asia/Makassar", "yyyy-MM-dd");
        } catch(e) {
          const w = new Date(tglRen.getTime() + 8 * 3600 * 1000);
          const y = w.getUTCFullYear();
          const m = String(w.getUTCMonth() + 1).padStart(2, "0");
          const d = String(w.getUTCDate()).padStart(2, "0");
          tglRen = `${y}-${m}-${d}`;
        }
      }
      return {
        noWo: noWo,
        approvalPreparator: row[cApprPrep],
        ketPreparator: row[cKetPrep],
        tanggalRencanakan: tglRen,
        ulp: wd && colUlp !== -1 ? wd[colUlp] : "",
        gi: wd && colGi !== -1 ? wd[colGi] : "",
        penyulang: wd && colPenyulang !== -1 ? wd[colPenyulang] : "",
        segmen: wd && colSegmen !== -1 ? wd[colSegmen] : "",
        alamat: wd && colAlamat !== -1 ? wd[colAlamat] : "",
        temuan: wd && colTemuan !== -1 ? wd[colTemuan] : "",
        statusWo: wd && colStatus !== -1 ? wd[colStatus] : "",
        foto: wd && colFoto !== -1 ? wd[colFoto] : "",
        rowIndex: wd ? woData.indexOf(wd) + 2 : null,
      };
    })
    .filter((r) => r.noWo);

  results.sort((a, b) =>
    String(b.noWo).localeCompare(String(a.noWo), undefined, { numeric: true }),
  );
  return { success: true, data: results };
}

/**
 * 10. GET REVIEW DETAIL
 */
function handleGetReviewDetail(payload) {
  const { noWo } = payload;
  if (!noWo) return { success: false, message: "noWo wajib diisi" };

  const reviewWoSS = SpreadsheetApp.openById(SPREADSHEETS.REVIEW_WO);

  const getSheetData = (sheetName) => {
    const sheet = reviewWoSS.getSheetByName(sheetName);
    if (!sheet) return [];
    const data = sheet.getDataRange().getValues();
    const headers = data.shift() || [];
    return data
      .map((r) => {
        let obj = {};
        headers.forEach((h, i) => {
          let v = r[i];
          if (v instanceof Date) {
            try {
              v = Utilities.formatDate(v, "Asia/Makassar", "yyyy-MM-dd");
            } catch(e) {}
          }
          obj[h] = v;
        });
        return obj;
      })
      .filter((r) => String(r["NO. WO"]).trim() === String(noWo).trim());
  };

  const pekerjaan = getSheetData("PEKERJAAN")[0] || {};
  const materials = getSheetData("MATERIAL");
  const area = getSheetData("KON_SEKITAR")[0] || {};
  const konstruksi = getSheetData("KON_KONSTRUKSI")[0] || {};
  const hazards = getSheetData("HAZARD");
  const approval = getSheetData("APPROVAL REVIEW")[0] || {};

  // Get full WO data
  const woSS = SpreadsheetApp.openById(SPREADSHEETS.WORK_ORDER);
  const woSheet = woSS.getSheetByName("WorkOrders");
  let workOrder = {};
  if (woSheet) {
    const woData = woSheet.getDataRange().getValues();
    if (woData.length > 0) {
      const woHeaders = woData.shift();
      const matchedRow = woData.find(
        (r) => String(r[0]).trim() === String(noWo).trim(),
      );
      if (matchedRow) {
        woHeaders.forEach((h, i) => {
          if (h) {
            let v = matchedRow[i];
            if (v instanceof Date) {
              try {
                v = Utilities.formatDate(v, "Asia/Makassar", "yyyy-MM-dd");
              } catch(e) {}
            }
            workOrder[h] = v;
          }
        });
      }
    }
  }

  return {
    success: true,
    data: {
      workOrder,
      pekerjaan,
      materials,
      area,
      konstruksi,
      hazards,
      approval,
    },
  };
}

function handleUpdateSecurity(payload) {
  const { nip, password, pin, emailIam, passwordIam } = payload;
  if (!nip) return { success: false, message: "NIP wajib diisi" };

  const authSS = SpreadsheetApp.openById(SPREADSHEETS.AUTH);
  const authSheet = authSS.getSheetByName("Auth");
  
  if (authSheet) {
    const authData = authSheet.getDataRange().getValues();
    const headers = authData.shift();

    const getIndex = (possibleNames) =>
      headers.findIndex((h) => {
        const val = String(h).trim().toLowerCase();
        return possibleNames.some(
          (p) =>
            val === p.toLowerCase() || val === p.toLowerCase().replace(/\s/g, ""),
        );
      });

    const nipIndex = getIndex(["userid", "user id", "nip", "username"]);
    const passIndex = getIndex(["userpassword", "password"]);
    const pinIndex = getIndex(["userpin", "pin"]);

    if (nipIndex !== -1) {
      const rowIndex = authData.findIndex(
        (row) => String(row[nipIndex]) === String(nip),
      );
      if (rowIndex !== -1) {
        const actualRow = rowIndex + 2;

        if (password && passIndex !== -1) {
          authSheet.getRange(actualRow, passIndex + 1).setValue(password);
        }
        if (pin && pinIndex !== -1) {
          authSheet.getRange(actualRow, pinIndex + 1).setValue(pin);
        }
      }
    }
  }

  // Update Personil Sheet for emailIam and passwordIam
  if (emailIam || passwordIam) {
    let personilSheet = null;
    const spreadsheedIds = [
      SPREADSHEETS.PDKB,
      SPREADSHEETS.AUTH,
      SPREADSHEETS.USERS,
      SPREADSHEETS.BERKAS_PEKERJAAN,
    ];
    for (const ssid of spreadsheedIds) {
      try {
        const ss = SpreadsheetApp.openById(ssid);
        personilSheet = ss.getSheetByName("Personil");
        if (personilSheet) break;
      } catch (e) {}
    }

    if (personilSheet) {
      const pData = personilSheet.getDataRange().getValues();
      if (pData.length > 1) {
        const pHeaders = pData[0];
        const pNipIndex = pHeaders.findIndex((h) => {
          const val = String(h).trim().toLowerCase();
          return val === "nip" || val === "user id" || val === "userid";
        });
        
        const pEmailIndex = pHeaders.findIndex((h) => String(h).trim().toLowerCase() === "email");
        const pPasswordIndex = pHeaders.findIndex((h) => String(h).trim().toLowerCase() === "password");

        if (pNipIndex !== -1) {
          const pRowIndex = pData.findIndex(
            (row, index) => index > 0 && String(row[pNipIndex]).trim() === String(nip).trim()
          );

          if (pRowIndex !== -1) {
            if (emailIam && pEmailIndex !== -1) {
               personilSheet.getRange(pRowIndex + 1, pEmailIndex + 1).setValue(emailIam);
            }
            if (passwordIam && pPasswordIndex !== -1) {
               personilSheet.getRange(pRowIndex + 1, pPasswordIndex + 1).setValue(passwordIam);
            }
          }
        }
      }
    }
  }

  return { success: true, message: "Security data berhasil diupdate" };
}

/**
 * 11. GET WORK PLANS
 */
function handleGetWorkPlans() {
  const wpSS = SpreadsheetApp.openById(SPREADSHEETS.WORK_PLAN);
  const wpSheet = wpSS.getSheetByName("WORK PLAN");
  if (!wpSheet)
    return { success: false, message: "Sheet WORK PLAN tidak ditemukan" };

  const data = wpSheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [] };

  const headers = data.shift();

  const results = data
    .map((row, idx) => {
      let obj = {};
      headers.forEach((h, i) => {
        const key = h?.toString().trim();
        let val = row[i];
        if (val instanceof Date) {
          try {
            val = Utilities.formatDate(val, "Asia/Makassar", "yyyy-MM-dd");
          } catch(e) {
            const w = new Date(val.getTime() + 8 * 3600 * 1000);
            const y = w.getUTCFullYear();
            const m = String(w.getUTCMonth() + 1).padStart(2, "0");
            const d = String(w.getUTCDate()).padStart(2, "0");
            val = `${y}-${m}-${d}`;
          }
        }
        obj[key] = val;
      });
      return obj;
    })
    .filter((r) => r && r["NO. WO"]); 

  // Grab KONFIRMASI from LIST REALISASI
  try {
    const listSS = SpreadsheetApp.openById(SPREADSHEETS.LIST_REALISASI);
    const listSheet = listSS.getSheetByName("LIST REALISASI");
    if (listSheet) {
      const listData = listSheet.getDataRange().getValues();
      const listHeaders = listData[0];
      const noWoIdx = listHeaders.findIndex(h => String(h).trim().toUpperCase() === "NO WO" || String(h).trim().toUpperCase() === "NO. WO" || String(h).trim().toUpperCase() === "NO.WO");
      const konfIdx = listHeaders.findIndex(h => String(h).trim().toUpperCase() === "KONFIRMASI");
      
      if (noWoIdx !== -1 && konfIdx !== -1) {
        const konfMap = {};
        for(let i=1; i<listData.length; i++) {
           const wo = String(listData[i][noWoIdx]).trim();
           if (wo) {
              konfMap[wo] = String(listData[i][konfIdx]).trim();
           }
        }
        results.forEach(r => {
           let wo = String(r["NO. WO"] || r["NO WO"] || "").trim();
           if (konfMap[wo]) {
              r["KONFIRMASI"] = konfMap[wo];
           }
        });
      }
    }
  } catch(e) {
    // Ignore error
  }

  return { success: true, data: results };
}

/**
 * 12. GET WORK PLAN DETAIL
 */
function handleGetWorkPlanDetail(payload) {
  const { noWo } = payload;
  if (!noWo) return { success: false, message: "noWo wajib diisi" };

  const wpSS = SpreadsheetApp.openById(SPREADSHEETS.WORK_PLAN);
  const wpSheet = wpSS.getSheetByName("WORK PLAN");
  if (!wpSheet)
    return { success: false, message: "Sheet WORK PLAN tidak ditemukan" };

  const data = wpSheet.getDataRange().getValues();
  if (data.length <= 1) return { success: false, message: "Data kosong" };

  const headers = data.shift();

  const detail = data.find((row) => {
    const woIdx = headers.findIndex(
      (h) =>
        h?.toString().trim().toUpperCase() === "NO. WO" ||
        h?.toString().trim().toUpperCase() === "NO WO",
    );
    return woIdx > -1 && String(row[woIdx]).trim() === String(noWo).trim();
  });

  if (!detail) return { success: false, message: "Detail tidak ditemukan" };

  let resultObj = {};
  headers.forEach((h, i) => {
    if (h && detail[i] !== undefined && detail[i] !== "") {
      resultObj[h.toString().trim()] = detail[i];
    }
  });

  try {
    const listSS = SpreadsheetApp.openById(SPREADSHEETS.LIST_REALISASI);
    const listSheet = listSS.getSheetByName("LIST REALISASI");
    if (listSheet) {
      const listData = listSheet.getDataRange().getValues();
      const listHeaders = listData[0];
      const noWoIdx = listHeaders.findIndex(h => String(h).trim().toUpperCase() === "NO WO" || String(h).trim().toUpperCase() === "NO. WO" || String(h).trim().toUpperCase() === "NO.WO");
      const konfIdx = listHeaders.findIndex(h => String(h).trim().toUpperCase() === "KONFIRMASI");
      
      if (noWoIdx !== -1 && konfIdx !== -1) {
        for(let i=1; i<listData.length; i++) {
           if (String(listData[i][noWoIdx]).trim() === String(noWo).trim()) {
              resultObj["KONFIRMASI"] = String(listData[i][konfIdx]).trim();
              break;
           }
        }
      }
    }
  } catch(e) {
    // Ignore error
  }

  return { success: true, data: resultObj };
}

/**
 * 13. GET TRACKING DETAIL
 */
function handleGetTracking(payload) {
  const { noWo } = payload;
  if (!noWo) return { success: false, message: "noWo wajib diisi" };

  const wpSS = SpreadsheetApp.openById(SPREADSHEETS.WORK_PLAN);
  const trackSheet = wpSS.getSheetByName("TRACKING");
  if (!trackSheet)
    return { success: false, message: "Sheet TRACKING tidak ditemukan" };

  const data = trackSheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: null };
  const headers = data.shift();

  const detail = data.find(
    (row) => String(row[0]).trim() === String(noWo).trim(),
  );
  if (!detail) return { success: true, data: null };

  let resultObj = {};
  headers.forEach((h, i) => {
    if (h) resultObj[h.toString().trim()] = detail[i] || "";
  });

  try {
    const clSheets = ["CL_START", "CL_PERSIAPAN", "CL_PELAKSANAAN"];
    resultObj.lampiranSteps = {};
    clSheets.forEach((sheetName) => {
      const cls = wpSS.getSheetByName(sheetName);
      if (cls) {
        const clData = cls.getDataRange().getValues();
        const clHeaders = clData[0];
        const clDetail = clData.find(
          (row) => String(row[0]).trim() === String(noWo).trim(),
        );
        if (clDetail) {
          let stepFotos = {};
          clHeaders.forEach((h, idx) => {
            if (h && clDetail[idx]) {
              stepFotos[String(h).trim()] = clDetail[idx];
            }
          });
          resultObj.lampiranSteps[sheetName] = stepFotos;
        }
      }
    });

    // Compatibility for existing code
    const clPelaksanaanSheet = wpSS.getSheetByName("CL_PELAKSANAAN");
    if (clPelaksanaanSheet) {
      const clData = clPelaksanaanSheet.getDataRange().getValues();
      const clHeaders = clData[0];
      const clDetail = clData.find(
        (row) => String(row[0]).trim() === String(noWo).trim(),
      );
      if (clDetail) {
        let fotos = {};
        const beforeIdx = clHeaders.findIndex(
          (h) => h && String(h).trim().toUpperCase() === "FOTO SEBELUM",
        );
        const p1Idx = clHeaders.findIndex(
          (h) => h && String(h).trim().toUpperCase() === "FOTO PROSES 1",
        );
        const p2Idx = clHeaders.findIndex(
          (h) => h && String(h).trim().toUpperCase() === "FOTO PROSES 2",
        );
        if (beforeIdx > -1) fotos.fotoSebelum = clDetail[beforeIdx] || "";
        if (p1Idx > -1) fotos.fotoProses1 = clDetail[p1Idx] || "";
        if (p2Idx > -1) fotos.fotoProses2 = clDetail[p2Idx] || "";
        resultObj.lampiranPelaksanaan = fotos;
      }
    }
  } catch (e) {
    // optional catch
  }

  return { success: true, data: resultObj };
}

/**
 * 14. UPDATE TRACKING
 */
function handleUpdateTracking(payload) {
  function getJakartaTime() {
    const d = new Date();
    const localTime = d.getTime();
    const localOffset = d.getTimezoneOffset() * 60000;
    const utc = localTime + localOffset;
    const offset = 7; // WIB (UTC+7)
    return new Date(utc + 3600000 * offset);
  }

  const {
    noWo,
    stepName,
    stepValue,
    keterangan,
    fotoBase64,
    fotoMime,
    fotoName,
    fotoSebelumBase64,
    fotoSebelumName,
    fotoProses1Base64,
    fotoProses1Name,
    fotoProses2Base64,
    fotoProses2Name,
  } = payload;
  if (!noWo || !stepName || !stepValue)
    return { success: false, message: "Data tidak lengkap" };

  const wpSS = SpreadsheetApp.openById(SPREADSHEETS.WORK_PLAN);

  const uploadPhoto = (base64, name, suffix) => {
    if (!base64) return "";
    try {
      const folder = DriveApp.getFolderById(SPREADSHEETS.TRACKING_EVIDENCES);
      const decodedFile = Utilities.base64Decode(base64);
      let ext = ".jpg";
      if (name && name.lastIndexOf(".") !== -1) {
        ext = name.substring(name.lastIndexOf("."));
      }
      let fName =
        String(noWo).replace(/\//g, "-") +
        "-" +
        stepName +
        (suffix ? "-" + suffix : "-" + stepValue) +
        ext;
      const file = folder.createFile(
        Utilities.newBlob(decodedFile, fotoMime || "image/jpeg", fName),
      );
      try {
        file.setSharing(
          DriveApp.Access.ANYONE_WITH_LINK,
          DriveApp.Permission.VIEW,
        );
      } catch (shareErr) {
        console.log("Gagal setSharing: " + shareErr.message);
      }
      return "https://lh3.googleusercontent.com/d/" + file.getId();
    } catch (e) {
      console.log("Upload foto gagal: " + e.message);
      return "";
    }
  };

  let fotoUrl = uploadPhoto(fotoBase64, fotoName, "");
  let fotoSebelumUrl = uploadPhoto(
    fotoSebelumBase64,
    fotoSebelumName,
    "FOTO SEBELUM",
  );
  let fotoProses1Url = uploadPhoto(
    fotoProses1Base64,
    fotoProses1Name,
    "FOTO PROSES 1",
  );
  let fotoProses2Url = uploadPhoto(
    fotoProses2Base64,
    fotoProses2Name,
    "FOTO PROSES 2",
  );

  // Handle CL_ Sheets (untuk START, PERSIAPAN dan PELAKSANAAN)
  let sheetNameCL = "";
  if (stepName === "START") sheetNameCL = "CL_START";
  if (stepName === "PERSIAPAN") sheetNameCL = "CL_PERSIAPAN";
  if (stepName === "PELAKSANAAN") sheetNameCL = "CL_PELAKSANAAN";

  if (sheetNameCL) {
    const clSheet = wpSS.getSheetByName(sheetNameCL);
    if (clSheet) {
      const clData = clSheet.getDataRange().getValues();
      const clHeaders = clData[0];

      let clRowIndex = -1;
      for (let i = 1; i < clData.length; i++) {
        if (String(clData[i][0]).trim() === String(noWo).trim()) {
          clRowIndex = i + 1;
          break;
        }
      }

      if (clRowIndex === -1) {
        // Find the first empty row in Column A
        for (let i = 1; i < clData.length; i++) {
          if (String(clData[i][0]).trim() === "") {
            clRowIndex = i + 1;
            break;
          }
        }
        if (clRowIndex === -1) {
          clRowIndex = clData.length + 1;
        }
        clSheet.getRange(clRowIndex, 1).setValue(noWo);
      }

      if (clRowIndex !== -1) {
        let targetColName = stepValue.toUpperCase();
        if (sheetNameCL === "CL_PELAKSANAAN" && (stepValue.toUpperCase() === "PEKERJAAN SELESAI" || stepValue.toUpperCase() === "SELESAI")) {
          targetColName = "FOTO SELESAI";
        }
        
        const valColIdx = clHeaders.findIndex(
          (h) =>
            h && String(h).trim().toUpperCase() === targetColName.toUpperCase(),
        );
        if (valColIdx > -1 && fotoUrl) {
          clSheet.getRange(clRowIndex, valColIdx + 1).setValue(fotoUrl);
        }

        const getColIdx = (headerName) =>
          clHeaders.findIndex(
            (h) =>
              h &&
              String(h).trim().replace(/\s+/g, " ").toUpperCase() ===
                headerName.trim().toUpperCase(),
          );

        if (fotoSebelumUrl) {
          const idx = getColIdx("Foto Sebelum");
          if (idx > -1) {
            clSheet.getRange(clRowIndex, idx + 1).setValue(fotoSebelumUrl);
          } else {
            console.log(
              "Kolom 'Foto Sebelum' tidak ditemukan di baris 1 sheet " +
                sheetNameCL,
            );
          }
        }
        if (fotoProses1Url) {
          const idx = getColIdx("Foto Proses 1");
          if (idx > -1) {
            clSheet.getRange(clRowIndex, idx + 1).setValue(fotoProses1Url);
          } else {
            console.log("Kolom 'Foto Proses 1' tidak ditemukan di baris 1");
          }
        }
        if (fotoProses2Url) {
          const idx = getColIdx("Foto Proses 2");
          if (idx > -1) {
            clSheet.getRange(clRowIndex, idx + 1).setValue(fotoProses2Url);
          } else {
            console.log("Kolom 'Foto Proses 2' tidak ditemukan di baris 1");
          }
        }

        if (keterangan) {
          const ketHeader = "Ket. " + stepValue;
          const ketColIdx = clHeaders.findIndex(
            (h) =>
              h && String(h).trim().toUpperCase() === ketHeader.toUpperCase(),
          );
          if (ketColIdx > -1) {
            clSheet.getRange(clRowIndex, ketColIdx + 1).setValue(keterangan);
          }
        }
      } else {
        console.log(
          "No WO " + noWo + " tidak ditemukan di sheet " + sheetNameCL,
        );
      }
    }
  }

  // Update TRACKING Sheet
  const trackSheet = wpSS.getSheetByName("TRACKING");
  if (trackSheet) {
    const data = trackSheet.getDataRange().getValues();
    const headers = data[0];

    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(noWo).trim()) {
        rowIndex = i + 1;
        break;
      }
    }

    let updates = {};
    updates[stepName] = stepValue;

    // Auto-complete if flow finished or aborted
    // We intentionally DO NOT update 'PROGRES' since it's driven by formula in sheet.
    if (
      stepValue.toUpperCase() === "DIBATALKAN" ||
      stepValue.toUpperCase() === "PEKERJAAN DIHENTIKAN"
    ) {
      updates["CLOSING"] = "Selesai";
    }

    // Record timestamps

    const currentTimeStr = Utilities.formatDate(
      getJakartaTime(),
      "GMT+7",
      "dd/MM/yyyy HH:mm",
    );

    let isCurrentlyEmpty = true;
    if (rowIndex !== -1) {
      const stepIdx = headers.findIndex(
        (h) => h && String(h).trim().toUpperCase() === stepName.toUpperCase(),
      );
      if (stepIdx > -1 && data[rowIndex - 1][stepIdx]) {
        isCurrentlyEmpty = false;
      }
    }

    // If it's the first time being updated, set START time
    if (isCurrentlyEmpty) {
      updates[stepName + "_START_TIME"] = currentTimeStr;
    }

    // Save custom timestamp TS_[Status Pekerjaan] to TRACKING sheet
    const tsColName = "TS_" + stepValue.toUpperCase();
    const tsColIdx = headers.findIndex((h) => h && String(h).trim().toUpperCase() === tsColName.toUpperCase());
    if (tsColIdx > -1) {
      if (rowIndex !== -1) {
        trackSheet.getRange(rowIndex, tsColIdx + 1).setValue(currentTimeStr);
      } else {
        updates[tsColName] = currentTimeStr;
      }
    } else {
      console.log("Kolom '" + tsColName + "' tidak ditemukan di sheet TRACKING");
    }

    // If it's completed, set END time
    const isCompleted = [
      "ON SITE",
      "TIBA DI LOKASI",
      "SIAP DIMULAI",
      "GELAR PERALATAN & BRIEFING",
      "PEKERJAAN SELESAI",
      "SELESAI",
      "DIBATALKAN",
      "PEKERJAAN DIHENTIKAN",
    ].includes(stepValue.toUpperCase().trim());
    if (isCompleted) {
      updates[stepName + "_END_TIME"] = currentTimeStr;
      
      // Request 1: when "CLOSING" step is finished, update TANGGAL REALISASI in WORK PLAN sheet
      if (stepName === "CLOSING") {
        const wpSheet = wpSS.getSheetByName("WORK PLAN");
        if (wpSheet) {
          const wpData = wpSheet.getDataRange().getValues();
          const wpHeaders = wpData[0];
          let wpRowIndex = -1;
          for (let i = 1; i < wpData.length; i++) {
            if (String(wpData[i][0]).trim() === String(noWo).trim()) {
              wpRowIndex = i + 1;
              break;
            }
          }
          if (wpRowIndex !== -1) {
            const trColIdx = wpHeaders.findIndex(
              (h) => h && String(h).trim().toUpperCase() === "TANGGAL REALISASI"
            );
            if (trColIdx > -1) {
              const currentDateStr = Utilities.formatDate(getJakartaTime(), "GMT+7", "dd/MM/yyyy");
              wpSheet.getRange(wpRowIndex, trColIdx + 1).setValue(currentDateStr);
            }
          }
        }
      }
    }

    if (rowIndex === -1) {
      // Append row
      rowIndex = trackSheet.getLastRow() + 1;
      let newRow = new Array(headers.length).fill("");
      newRow[0] = noWo;
      trackSheet.appendRow(newRow);
    }

    // Process updates
    Object.keys(updates).forEach((k) => {
      let colIdx = headers.findIndex(
        (h) => h && String(h).trim().toUpperCase() === String(k).toUpperCase(),
      );
      if (colIdx === -1) {
        // Create new header
        colIdx = headers.length;
        headers.push(k);
        trackSheet.getRange(1, colIdx + 1).setValue(k);
      }
      trackSheet.getRange(rowIndex, colIdx + 1).setValue(updates[k]);
    });
  }

  return { success: true, message: "Tracking berhasil diupdate" };
}

/**
 * 15. GET TRACKING OPTIONS
 */
function handleGetTrackingOptions() {
  const wpSS = SpreadsheetApp.openById(SPREADSHEETS.WORK_PLAN);
  const trackSheet = wpSS.getSheetByName("DROPDOWN TRACKING");
  if (!trackSheet)
    return {
      success: false,
      message: "Sheet DROPDOWN TRACKING tidak ditemukan",
    };

  const data = trackSheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: {} };

  const headers = data.shift();
  let options = {};
  headers.forEach((h, i) => {
    if (h) {
      options[h.toString().trim()] = data
        .map((r) => r[i])
        .filter(Boolean)
        .map((v) => v.toString().trim());
    }
  });

  return { success: true, data: options };
}

function handleUpdateBerkasAction(payload) {
  const { noWo, type, action } = payload;
  if (!noWo || !type || !action)
    return { success: false, message: "Data tidak lengkap" };

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEETS.BERKAS_PEKERJAAN);
    // Find sheet by type (e.g. WP, IBPPR, etc.)
    const sheet = ss.getSheetByName(type);
    if (!sheet)
      return { success: false, message: "Sheet " + type + " tidak ditemukan" };

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1)
      return { success: false, message: "Data kosong di sheet " + type };

    const headers = data[0];
    const noWoIndex = headers.findIndex(
      (h) =>
        String(h).trim().toUpperCase() === "NO WO" ||
        String(h).trim().toUpperCase() === "NO. WO",
    );
    const actionIndex = headers.findIndex(
      (h) => String(h).trim().toUpperCase() === "ACTION",
    );

    if (noWoIndex === -1 || actionIndex === -1) {
      return {
        success: false,
        message: "Kolom NO WO atau ACTION tidak ditemukan di sheet " + type,
      };
    }

    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][noWoIndex]).trim() === String(noWo).trim()) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) {
      return {
        success: false,
        message: "Data WO tidak ditemukan di sheet " + type,
      };
    }

    sheet.getRange(rowIndex, actionIndex + 1).setValue(action);
    return {
      success: true,
      message: "Action " + type + " berhasil diupdate menjadi " + action,
    };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function handleGetBerkasActions(payload) {
  const { noWo } = payload;
  if (!noWo) return { success: false, message: "Data tidak lengkap" };

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEETS.BERKAS_PEKERJAAN);
    const types = ["WP", "IBPPR", "JSA", "SP2B", "SP3B", "TAILGATE SESSION"];
    const result = {};

    types.forEach((type) => {
      const sheet = ss.getSheetByName(type);
      if (sheet) {
        const data = sheet.getDataRange().getValues();
        if (data.length > 1) {
          const headers = data[0];
          const noWoIndex = headers.findIndex(
            (h) =>
              String(h).trim().toUpperCase() === "NO WO" ||
              String(h).trim().toUpperCase() === "NO. WO",
          );
          const actionIndex = headers.findIndex(
            (h) => String(h).trim().toUpperCase() === "ACTION",
          );
          if (noWoIndex !== -1 && actionIndex !== -1) {
            const row = data.find(
              (r, i) =>
                i > 0 && String(r[noWoIndex]).trim() === String(noWo).trim(),
            );
            if (row) {
              result[type] = row[actionIndex] || "";
            }
          }
        }
      }
    });

    return { success: true, data: result };
  } catch (e) {
    return { success: false, message: e.message };
  }
}


function handleSubmitSWA(payload) {
  const { noWo, swaOption, keterangan, fotoBase64, fotoMime, fotoName } = payload;
  if (!noWo || !swaOption) return { success: false, message: "Data tidak lengkap" };

  let fotoUrl = "";
  if (fotoBase64) {
    try {
      const folder = DriveApp.getFolderById(SPREADSHEETS.TRACKING_EVIDENCES);
      const decodedFile = Utilities.base64Decode(fotoBase64);
      let ext = ".jpg";
      if (fotoName && fotoName.lastIndexOf(".") !== -1) {
        ext = fotoName.substring(fotoName.lastIndexOf("."));
      }
      let fName = String(noWo).replace(/\//g, "-") + "-SWA-" + swaOption + ext;
      const file = folder.createFile(Utilities.newBlob(decodedFile, fotoMime || "image/jpeg", fName));
      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch(e) {}
      fotoUrl = "https://lh3.googleusercontent.com/d/" + file.getId();
    } catch (e) {
      console.log("Upload SWA foto gagal: " + e.message);
    }
  }

  const wpSS = SpreadsheetApp.openById(SPREADSHEETS.WORK_PLAN);
  const swaSheet = wpSS.getSheetByName("SWA");
  if (!swaSheet) return { success: false, message: "Sheet SWA tidak ditemukan" };

  const data = swaSheet.getDataRange().getValues();
  let headers = data[0] || [];
  if (headers.length === 0) {
     headers = ["NO WO", swaOption, "Keterangan " + swaOption];
     swaSheet.appendRow(headers);
     data.push(headers);
  }

  const noWoCol = headers.findIndex(h => h && String(h).toUpperCase().replace(/\./g, "") === "NO WO");
  
  let rowIndex = -1;
  if (noWoCol !== -1) {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][noWoCol]).trim() === String(noWo).trim()) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  if (rowIndex === -1) {
    rowIndex = swaSheet.getLastRow() + 1;
    let newRow = new Array(headers.length).fill("");
    let useNoWoCol = noWoCol !== -1 ? noWoCol : 0;
    if (noWoCol === -1) {
      headers.push("NO WO");
      swaSheet.getRange(1, headers.length).setValue("NO WO");
      useNoWoCol = headers.length - 1;
    }
    newRow[useNoWoCol] = noWo;
    swaSheet.appendRow(newRow);
  }

  let updates = {};
  if (fotoUrl) updates[swaOption] = fotoUrl;
  if (keterangan) updates["Keterangan " + swaOption] = keterangan;

  Object.keys(updates).forEach((k) => {
    let colIdx = headers.findIndex(h => h && String(h).trim().toUpperCase() === String(k).toUpperCase());
    if (colIdx === -1) {
      colIdx = headers.length;
      headers.push(k);
      swaSheet.getRange(1, colIdx + 1).setValue(k);
    }
    swaSheet.getRange(rowIndex, colIdx + 1).setValue(updates[k]);
  });

  // update status in TRACKING PEKERJAAN
  const trackSheet = wpSS.getSheetByName("TRACKING");
  if (trackSheet) {
    const tData = trackSheet.getDataRange().getValues();
    const tHeaders = tData[0] || [];
    const tNoWoCol = tHeaders.findIndex(h => h && String(h).toUpperCase().replace(/\./g, "") === "NO WO");
    const tProgresCol = tHeaders.findIndex(h => h && String(h).toUpperCase() === "PROGRES");
    let tSwaCol = tHeaders.findIndex(h => h && String(h).toUpperCase() === "SWA");
    if (tSwaCol === -1) {
       tSwaCol = tHeaders.length;
       trackSheet.getRange(1, tSwaCol + 1).setValue("SWA");
    }
    if (tNoWoCol !== -1) {
      for (let i = 1; i < tData.length; i++) {
         if (String(tData[i][tNoWoCol]).trim() === String(noWo).trim()) {
            // if (tProgresCol !== -1) trackSheet.getRange(i + 1, tProgresCol + 1).setValue(swaOption);
            trackSheet.getRange(i + 1, tSwaCol + 1).setValue(swaOption);
            
            let tTsSwaCol = tHeaders.findIndex(h => h && String(h).toUpperCase() === "TS_SWA");
            if (tTsSwaCol > -1) {
              function getJakartaTime() {
                const d = new Date();
                const localTime = d.getTime();
                const localOffset = d.getTimezoneOffset() * 60000;
                const utc = localTime + localOffset;
                const offset = 7; // WIB (UTC+7)
                return new Date(utc + 3600000 * offset);
              }
              const swaTimeStr = Utilities.formatDate(getJakartaTime(), "GMT+7", "dd/MM/yyyy HH:mm");
              trackSheet.getRange(i + 1, tTsSwaCol + 1).setValue(swaTimeStr);
            }
            
            let tStatusSwaCol = tHeaders.findIndex(h => h && String(h).toUpperCase() === "STATUS SWA");
            if (tStatusSwaCol === -1) {
               tStatusSwaCol = tHeaders.length;
               trackSheet.getRange(1, tStatusSwaCol + 1).setValue("STATUS SWA");
               tHeaders.push("STATUS SWA");
            }
            trackSheet.getRange(i + 1, tStatusSwaCol + 1).setValue("AKTIF");
            break;
         }
      }
    }
  }

  return { success: true, message: "SWA berhasil disubmit" };
}


function handleClearSWA(payload) {
  const { noWo } = payload;
  if (!noWo) return { success: false, message: "NO WO tidak ditemukan" };
  
  const wpSS = SpreadsheetApp.openById(SPREADSHEETS.WORK_PLAN);
  const trackSheet = wpSS.getSheetByName("TRACKING");
  if (!trackSheet) return { success: false, message: "Sheet TRACKING PEKERJAAN tidak ditemukan" };
  
  const tData = trackSheet.getDataRange().getValues();
  const tHeaders = tData[0] || [];
  const tNoWoCol = tHeaders.findIndex(h => h && String(h).toUpperCase().replace(/\./g, "") === "NO WO");
  const tSwaCol = tHeaders.findIndex(h => h && String(h).toUpperCase() === "SWA");
  const tProgresCol = tHeaders.findIndex(h => h && String(h).toUpperCase() === "PROGRES");
  
  if (tNoWoCol !== -1 && tSwaCol !== -1) {
    for (let i = 1; i < tData.length; i++) {
      if (String(tData[i][tNoWoCol]).trim() === String(noWo).trim()) {
        let tStatusSwaCol = tHeaders.findIndex(h => h && String(h).toUpperCase() === "STATUS SWA");
        if (tStatusSwaCol === -1) {
           tStatusSwaCol = tHeaders.length;
           trackSheet.getRange(1, tStatusSwaCol + 1).setValue("STATUS SWA");
           tHeaders.push("STATUS SWA");
        }
        trackSheet.getRange(i + 1, tStatusSwaCol + 1).setValue("PEKERJAAN DILANJUTKAN");
        let tTsSwaClearedTimeCol = tHeaders.findIndex(h => h && String(h).toUpperCase() === "TS_SWA");
        if (tTsSwaClearedTimeCol === -1) {
           tTsSwaClearedTimeCol = tHeaders.length;
           trackSheet.getRange(1, tTsSwaClearedTimeCol + 1).setValue("TS_SWA");
           tHeaders.push("TS_SWA");
        }
        
        function getJakartaTime() {
          const d = new Date();
          const localTime = d.getTime();
          const localOffset = d.getTimezoneOffset() * 60000;
          const utc = localTime + localOffset;
          const offset = 7; // WIB (UTC+7)
          return new Date(utc + 3600000 * offset);
        }
        const clearedTimeStr = Utilities.formatDate(getJakartaTime(), "GMT+7", "dd/MM/yyyy HH:mm");
        
        trackSheet.getRange(i + 1, tTsSwaClearedTimeCol + 1).setValue(clearedTimeStr);
        break;
      }
    }
  }
  return { success: true, message: "Status SWA berhasil dihapus" };
}

function handleGetRealisasiList(payload) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEETS.LIST_REALISASI);
    const sheet = ss.getSheetByName("LIST REALISASI");
    if (!sheet)
      return {
        success: false,
        message: "Sheet LIST REALISASI tidak ditemukan",
      };

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, data: [] };

    const headers = data[0];
    const result = [];

    const wpSS = SpreadsheetApp.openById(SPREADSHEETS.WORK_PLAN);
    const wpSheet = wpSS.getSheetByName("WORK PLAN");
    let wpPhotos = {};
    if (wpSheet) {
        const wpData = wpSheet.getDataRange().getValues();
        const wpH = wpData[0];
        const woIdx = wpH.findIndex(h => String(h).trim().toUpperCase() === "NO WO" || String(h).trim().toUpperCase() === "NO. WO" || String(h).trim().toUpperCase() === "NO.WO");
        const fsIdx = wpH.findIndex(h => String(h).trim().toUpperCase() === "FOTO SEBELUM");
        const fp1Idx = wpH.findIndex(h => String(h).trim().toUpperCase() === "FOTO PROSES 1");
        const fp2Idx = wpH.findIndex(h => String(h).trim().toUpperCase() === "FOTO PROSES 2");
        const fsesIdx = wpH.findIndex(h => String(h).trim().toUpperCase() === "FOTO SESUDAH");
        
        if (woIdx !== -1) {
             for(let i=1; i<wpData.length; i++) {
                 let wo = String(wpData[i][woIdx]).trim();
                 if (!wo) continue;
                 wpPhotos[wo] = {};
                 if (fsIdx !== -1) wpPhotos[wo]["FOTO SEBELUM"] = wpData[i][fsIdx];
                 if (fp1Idx !== -1) wpPhotos[wo]["FOTO PROSES 1"] = wpData[i][fp1Idx];
                 if (fp2Idx !== -1) wpPhotos[wo]["FOTO PROSES 2"] = wpData[i][fp2Idx];
                 if (fsesIdx !== -1) wpPhotos[wo]["FOTO SESUDAH"] = wpData[i][fsesIdx];
             }
        }
    }


    // Reverse array to put latest first
    for (let i = data.length - 1; i > 0; i--) {
      let rowObj = {};
      let rowData = data[i];

      // Skip empty rows
      if (rowData.join("").trim() === "") continue;

      headers.forEach((h, colIdx) => {
        if (h) {
          let val = rowData[colIdx];
          // Convert Date objects to strings
          if (val instanceof Date) {
            const yyyy = val.getFullYear();
            const mm = String(val.getMonth() + 1).padStart(2, "0");
            const dd = String(val.getDate()).padStart(2, "0");
            val = `${yyyy}-${mm}-${dd}`;
          }
          rowObj[h.toString().trim()] = val;
        }
      });
      // Request 4: modified to include all data (user request)
      
      let wo = String(rowObj["NO WO"] || rowObj["NO. WO"] || rowObj["NO.WO"] || "").trim();
      if (wo && wpPhotos[wo]) {
          Object.assign(rowObj, wpPhotos[wo]);
      }
      result.push(rowObj);

    }
    return { success: true, data: result };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function handleGetRealisasiDetail(payload) {
  const { noWo } = payload;
  if (!noWo) return { success: false, message: "Data tidak lengkap" };

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEETS.LIST_REALISASI);
    const sheet = ss.getSheetByName("LIST REALISASI");
    if (!sheet)
      return {
        success: false,
        message: "Sheet LIST REALISASI tidak ditemukan",
      };

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: false, message: "Data kosong" };

    const headers = data[0];
    const noWoIndex = headers.findIndex(
      (h) =>
        String(h).trim().toUpperCase() === "NO WO" ||
        String(h).trim().toUpperCase() === "NO. WO" ||
        String(h).trim().toUpperCase() === "NO.WO",
    );
    if (noWoIndex === -1)
      return { success: false, message: "Kolom NO WO tidak ditemukan" };

    const row = data.find(
      (r, i) => i > 0 && String(r[noWoIndex]).trim() === String(noWo).trim(),
    );
    if (!row)
      return { success: false, message: "Data Realisasi tidak ditemukan" };

    const result = {};
    headers.forEach((h, i) => {
      if (h) result[h.toString().trim()] = row[i];
    });

    // Fetch Fotos from WORK PLAN
    try {
        const wpSS = SpreadsheetApp.openById(SPREADSHEETS.WORK_PLAN);
        const wpSheet = wpSS.getSheetByName("WORK PLAN");
        if (wpSheet) {
            const wpData = wpSheet.getDataRange().getValues();
            const wpH = wpData[0];
            const woIdx = wpH.findIndex(h => String(h).trim().toUpperCase() === "NO WO" || String(h).trim().toUpperCase() === "NO. WO" || String(h).trim().toUpperCase() === "NO.WO");
            const fsIdx = wpH.findIndex(h => String(h).trim().toUpperCase() === "FOTO SEBELUM");
            const fp1Idx = wpH.findIndex(h => String(h).trim().toUpperCase() === "FOTO PROSES 1");
            const fp2Idx = wpH.findIndex(h => String(h).trim().toUpperCase() === "FOTO PROSES 2");
            const fsesIdx = wpH.findIndex(h => String(h).trim().toUpperCase() === "FOTO SESUDAH");
            
            if (woIdx !== -1) {
                 for(let i=1; i<wpData.length; i++) {
                     let w = String(wpData[i][woIdx]).trim();
                     if (w === String(noWo).trim()) {
                         if (fsIdx !== -1 && wpData[i][fsIdx]) result["FOTO SEBELUM"] = wpData[i][fsIdx];
                         if (fp1Idx !== -1 && wpData[i][fp1Idx]) result["FOTO PROSES 1"] = wpData[i][fp1Idx];
                         if (fp2Idx !== -1 && wpData[i][fp2Idx]) result["FOTO PROSES 2"] = wpData[i][fp2Idx];
                         if (fsesIdx !== -1 && wpData[i][fsesIdx]) result["FOTO SESUDAH"] = wpData[i][fsesIdx];
                         break;
                     }
                 }
            }
        }
    } catch(e) {}

    // Also fetch materials from REVIEW_WO
    try {
       const revSS = SpreadsheetApp.openById(SPREADSHEETS.REVIEW_WO);
       const matSheet = revSS.getSheetByName("MATERIAL");
       if (matSheet) {
          const matData = matSheet.getDataRange().getValues();
          const matHeaders = matData[0];
          const noWoCol = matHeaders.findIndex(h => String(h).trim().toUpperCase() === "NO. WO" || String(h).trim().toUpperCase() === "NO WO");
          
          if (noWoCol !== -1) {
             const materials = [];
             for(let i=1; i<matData.length; i++) {
                if (String(matData[i][noWoCol]).trim() === String(noWo).trim()) {
                   let m = {};
                   matHeaders.forEach((mh, j) => {
                      m[mh] = matData[i][j];
                   });
                   materials.push(m);
                }
             }
             result.materials = materials;
          }
       }
    } catch(err) {
       console.log("Error fetching materials for realisasi: ", err);
    }

    return { success: true, data: result };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function handleUpdateRealisasiStatus(payload) {
  const { noWo, status, updates, materials } = payload;
  if (!noWo || !status)
    return { success: false, message: "Data tidak lengkap" };

  try {
    // A. Update Material used in WAREHOUSE
    if (materials && materials.length > 0) {
       const warehouseSS = SpreadsheetApp.openById(SPREADSHEETS.WAREHOUSE);
       const whSheet = warehouseSS.getSheetByName("MATERIAL");
       const mutSheet = warehouseSS.getSheetByName("MUTASI MATERIAL");
       if (whSheet && mutSheet) {
          const whData = whSheet.getDataRange().getValues();
          const whHeaders = whData[0];
          
          let nameIdx = whHeaders.findIndex(h => String(h).trim().toUpperCase().includes("NAMA"));
          let jenisIdx = whHeaders.findIndex(h => String(h).trim().toUpperCase().includes("JENIS"));
          let stokMobilIdx = whHeaders.findIndex(h => String(h).trim().toUpperCase() === "STOK MOBIL" || String(h).trim().toUpperCase() === "MOBIL");
          
          if (stokMobilIdx !== -1) {
             const mHeaders = mutSheet.getDataRange().getValues()[0];
             let maxNo = 0;
             const mData = mutSheet.getDataRange().getValues();
             for(let r=1; r<mData.length; r++) {
                let h0 = String(mHeaders[0]).trim().toUpperCase();
                if (h0 === "NO" || h0 === "NO.") {
                   let val = parseInt(mData[r][0], 10);
                   if (!isNaN(val) && val > maxNo) maxNo = val;
                }
             }
             let nowStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "dd/MM/yyyy - HH:mm");

             materials.forEach(mat => {
                const vol = parseFloat(mat.volume);
                if (!isNaN(vol) && vol > 0 && mat.nama) {
                   // Find material
                   let matName = mat.nama;
                   if (mat.spesifikasi) matName += " - " + mat.spesifikasi;
                   
                   for(let i=1; i<whData.length; i++) {
                      let n1 = nameIdx !== -1 ? whData[i][nameIdx] : "";
                      let n2 = jenisIdx !== -1 ? whData[i][jenisIdx] : "";
                      let rowName = n1;
                      if (n1 && n2) rowName += " - " + n2;
                      
                      const targetName1 = (mat.nama + ", " + (mat.spesifikasi||"")).toLowerCase();
                      const targetName2 = (mat.nama + " - " + (mat.spesifikasi||"")).toLowerCase();
                      const rc = String(rowName).toLowerCase();
                      
                      if (rc === targetName1 || rc === targetName2 || rc === mat.nama.toLowerCase() || rc.includes(mat.nama.toLowerCase())) {
                         let rowId = i + 1;
                         let cell = whSheet.getRange(rowId, stokMobilIdx + 1);
                         let curr = parseFloat(cell.getValue()) || 0;
                         cell.setValue(curr - vol);
                         
                         // Append Mutasi
                         let mRow = new Array(mHeaders.length).fill("");
                         for(let j=0; j<mHeaders.length; j++) {
                            let hName = String(mHeaders[j]).trim().toUpperCase();
                            if(hName === "NO" || hName === "NO.") {
                               maxNo++; mRow[j] = maxNo;
                            } else if (hName === "TANGGAL" || hName === "TGL") {
                               mRow[j] = nowStr;
                            } else if (hName === "MUTASI" || hName === "STATUS") {
                               mRow[j] = "KELUAR - MOBIL";
                            } else if (hName === "VOLUME" || hName === "VOL") {
                               mRow[j] = vol;
                            } else if (hName.includes("NAMA")) {
                               mRow[j] = rowName;
                            } else if (hName === "KETERANGAN" || hName === "KET") {
                               mRow[j] = "Terpakai di WO No. " + noWo;
                            } else {
                               // try to copy other properties if exist
                            }
                         }
                         mutSheet.appendRow(mRow);
                         break;
                      }
                   }
                }
             });
          }
       }
    }

    // 1. Update values in LIST REALISASI
    const rSS = SpreadsheetApp.openById(SPREADSHEETS.LIST_REALISASI);
    const sheetR = rSS.getSheetByName("LIST REALISASI");
    if (sheetR) {
      const dataR = sheetR.getDataRange().getValues();
      const headersR = dataR[0];
      const noWoIndexR = headersR.findIndex(
        (h) =>
          String(h).trim().toUpperCase() === "NO WO" ||
          String(h).trim().toUpperCase() === "NO. WO" ||
          String(h).trim().toUpperCase() === "NO.WO",
      );
      if (noWoIndexR !== -1) {
        let rowIdx = -1;
        for (let i = 1; i < dataR.length; i++) {
          if (String(dataR[i][noWoIndexR]).trim() === String(noWo).trim()) {
            rowIdx = i + 1;
            break;
          }
        }
        if (rowIdx !== -1) {
          if (updates) {
            Object.keys(updates).forEach((key) => {
              if (["BEBAN (A)", "PELANGGAN PADAM", "JUMLAH PELANGGAN", "DURASI"].includes(key.toUpperCase())) {
                const colIdx = headersR.findIndex(
                  (h) => h && String(h).trim().toUpperCase() === key.toUpperCase(),
                );
                if (colIdx !== -1) {
                  sheetR.getRange(rowIdx, colIdx + 1).setValue(updates[key]);
                }
              }
            });
          }

          // Request 3: Save APPROVE/DISAPPROVE to KONFIRMASI in LIST REALISASI
          let konfColIdxR = headersR.findIndex(
            (h) => h && String(h).trim().toUpperCase() === "KONFIRMASI"
          );
          if (konfColIdxR === -1) {
            konfColIdxR = headersR.length;
            sheetR.getRange(1, konfColIdxR + 1).setValue("KONFIRMASI");
          }
          sheetR.getRange(rowIdx, konfColIdxR + 1).setValue(status);
        }
      }
    }

    // 1.5 Update Material in REVIEW WO
    if (materials) {
      const reviewWoSS = SpreadsheetApp.openById(SPREADSHEETS.REVIEW_WO);
      const sheetMaterials = reviewWoSS.getSheetByName("MATERIAL");
      if (sheetMaterials) {
        // delete old materials for this WO
        const dataRWM = sheetMaterials.getDataRange().getValues();
        for (let i = dataRWM.length - 1; i >= 1; i--) {
          if (String(dataRWM[i][0]).trim() === String(noWo).trim()) {
            sheetMaterials.deleteRow(i + 1);
          }
        }
        // insert new materials
        const newRows = [];
        materials.forEach((mat) => {
          if (mat.nama || mat.spesifikasi || mat.volume || mat.keterangan) {
            newRows.push([
              noWo,
              mat.nama || "",
              mat.spesifikasi || "",
              mat.volume || "",
              mat.keterangan || "",
            ]);
          }
        });
        if (newRows.length > 0) {
          sheetMaterials.getRange(sheetMaterials.getLastRow() + 1, 1, newRows.length, 5).setValues(newRows);
        }
      }
    }



    return { success: true, message: "Berhasil konfirmasi realisasi WO" };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function handleGetPersonilDetail(payload) {
  const { nip } = payload;
  if (!nip) {
    return { success: false, message: "NIP tidak boleh kosong" };
  }

  let personilSheet = null;
  const spreadsheedIds = [
    SPREADSHEETS.PDKB,
    SPREADSHEETS.AUTH,
    SPREADSHEETS.USERS,
    SPREADSHEETS.BERKAS_PEKERJAAN,
  ];
  for (const ssid of spreadsheedIds) {
    try {
      const ss = SpreadsheetApp.openById(ssid);
      personilSheet = ss.getSheetByName("Personil");
      if (personilSheet) break;
    } catch (e) {}
  }

  if (!personilSheet) {
    return { success: false, message: "Sheet Personil tidak ditemukan" };
  }

  const data = personilSheet.getDataRange().getValues();
  if (data.length < 2) return { success: false, message: "Data kosong" };

  const headers = data[0];
  let nipIndex = headers.findIndex((h) => {
    const val = String(h).trim().toLowerCase();
    return val === "nip" || val === "user id" || val === "userid";
  });

  if (nipIndex === -1) nipIndex = 0;

  const row = data.find(
    (r) => String(r[nipIndex]).trim() === String(nip).trim(),
  );
  if (!row) {
    return { success: false, message: "Data personil tidak ditemukan" };
  }

  let resultObject = {};
  for (let i = 4; i <= 9; i++) {
    // Kolom E (4) to J (9)
    if (i < headers.length) {
      let val = row[i];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, "Asia/Jakarta", "dd/MM/yyyy");
      } else {
        val = val ? String(val) : "-";
      }
      resultObject[headers[i] || `Kolom ${i + 1}`] = val;
    }
  }

  return { success: true, data: resultObject };
}

function handleGetKesehatanForm(payload) {
  let sheet = null;
  const spreadsheedIds = [
    SPREADSHEETS.PDKB,
    SPREADSHEETS.AUTH,
    SPREADSHEETS.USERS,
    SPREADSHEETS.BERKAS_PEKERJAAN,
  ];
  for (const ssid of spreadsheedIds) {
    try {
      const ss = SpreadsheetApp.openById(ssid);
      sheet = ss.getSheetByName("Kesehatan");
      if (sheet) break;
    } catch (e) {}
  }

  if (!sheet) {
    return { success: false, message: "Sheet Kesehatan tidak ditemukan" };
  }

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { success: false, message: "Data kosong" };

  const items = [];
  const fisikItems = [];
  const mentalItems = [];
  for (let i = 1; i < data.length; i++) {
    const item = data[i][0];
    if (item) {
      const itemStr = String(item).trim();
      if (
        itemStr.toUpperCase() !== "FISIK" &&
        itemStr.toUpperCase() !== "MENTAL"
      ) {
        items.push(itemStr);
        if (i >= 1 && i <= 7) fisikItems.push(itemStr);
        else if (i >= 9 && i <= 15) mentalItems.push(itemStr);
      }
    }
  }

  // personil from B1 to I1 (index 1 to 8)
  const headers = data[0];
  const personil = [];
  for (let i = 1; i <= 8; i++) {
    if (headers[i]) personil.push(String(headers[i]));
  }

  return { success: true, data: { items, fisikItems, mentalItems, personil } };
}

function handleSubmitKesehatan(payload) {
  const { name, nama, nip, answers, statusFisik, statusMental, keterangan, sistole, diastole, nadi, suhu, tanggal } = payload;
  const personName = String(nama || name || "").trim();
  const personNip = String(nip || "").trim();

  if (!personName && !personNip) return { success: false, message: "Nama atau NIP personil dibutuhkan." };

  let pdkbSS = null;
  const spreadsheedIds = [
    SPREADSHEETS.PDKB,
    SPREADSHEETS.AUTH,
    SPREADSHEETS.USERS,
    SPREADSHEETS.BERKAS_PEKERJAAN,
  ];
  for (const ssid of spreadsheedIds) {
    try {
      const ss = SpreadsheetApp.openById(ssid);
      if (ss.getSheetByName("Personil") || ss.getSheetByName("PERSONIL")) {
        pdkbSS = ss;
        break;
      }
    } catch (e) {}
  }

  if (!pdkbSS) {
    try {
      pdkbSS = SpreadsheetApp.openById(SPREADSHEETS.PDKB);
    } catch(e) {}
  }

  if (!pdkbSS) {
    return { success: false, message: "Spreadsheet PDKB tidak ditemukan." };
  }

  // 1. Simpan ke sheet LOG KESEHATAN
  let logSheet = pdkbSS.getSheetByName("LOG KESEHATAN") || pdkbSS.getSheetByName("Log Kesehatan");
  if (!logSheet) {
    logSheet = pdkbSS.insertSheet("LOG KESEHATAN");
    logSheet.appendRow([
      "Timestamp",
      "Tanggal",
      "NIP",
      "Nama Personil",
      "Status Fisik",
      "Status Mental",
      "Catatan / Keterangan",
      "Sistole",
      "Diastole",
      "Nadi",
      "Suhu",
      "Detail Jawaban"
    ]);
  }

  const now = new Date();
  const tgl = tanggal || Utilities.formatDate(now, "Asia/Jakarta", "yyyy-MM-dd");
  const detailStr = answers ? JSON.stringify(answers) : "";

  logSheet.appendRow([
    Utilities.formatDate(now, "Asia/Jakarta", "dd/MM/yyyy HH:mm:ss"),
    tgl,
    personNip,
    personName,
    statusFisik || "SEHAT",
    statusMental || "SEHAT",
    keterangan || "-",
    sistole || "",
    diastole || "",
    nadi || "",
    suhu || "",
    detailStr
  ]);

  // 2. Perbarui kolom status kesehatan di sheet PERSONIL
  const personilSheet = pdkbSS.getSheetByName("PERSONIL") || pdkbSS.getSheetByName("Personil");
  if (personilSheet) {
    const pData = personilSheet.getDataRange().getValues();
    if (pData.length > 1) {
      const pHeaders = pData[0].map(h => String(h).trim().toLowerCase());
      const nipCol = pHeaders.findIndex(h => h === "nip" || h === "user id" || h === "userid");
      const namaCol = pHeaders.findIndex(h => h === "nama" || h === "nama personil");

      let fisikCol = pHeaders.findIndex(h => h.includes("kesehatan fisik") || h.includes("status fisik"));
      let mentalCol = pHeaders.findIndex(h => h.includes("kesehatan mental") || h.includes("status mental"));

      if (fisikCol === -1) {
        fisikCol = pHeaders.length;
        personilSheet.getRange(1, fisikCol + 1).setValue("Kesehatan Fisik");
      }
      if (mentalCol === -1) {
        mentalCol = pHeaders.length + 1;
        personilSheet.getRange(1, mentalCol + 1).setValue("Kesehatan Mental");
      }

      for (let r = 1; r < pData.length; r++) {
        const rowNip = nipCol !== -1 ? String(pData[r][nipCol]).trim() : "";
        const rowNama = namaCol !== -1 ? String(pData[r][namaCol]).trim().toLowerCase() : "";

        const matchNip = personNip && rowNip && rowNip.toLowerCase() === personNip.toLowerCase();
        const matchNama = personName && rowNama && (rowNama === personName.toLowerCase() || rowNama.includes(personName.toLowerCase()));

        if (matchNip || matchNama) {
          if (statusFisik) personilSheet.getRange(r + 1, fisikCol + 1).setValue(statusFisik);
          if (statusMental) personilSheet.getRange(r + 1, mentalCol + 1).setValue(statusMental);
          break;
        }
      }
    }
  }

  return { success: true, message: "Laporan kesehatan berhasil dicatat di sheet LOG KESEHATAN." };
}

function handleGetLogKesehatan(payload) {
  let pdkbSS = null;
  const spreadsheedIds = [
    SPREADSHEETS.PDKB,
    SPREADSHEETS.AUTH,
    SPREADSHEETS.USERS,
    SPREADSHEETS.BERKAS_PEKERJAAN,
  ];
  for (const ssid of spreadsheedIds) {
    try {
      const ss = SpreadsheetApp.openById(ssid);
      if (ss.getSheetByName("LOG KESEHATAN") || ss.getSheetByName("Log Kesehatan")) {
        pdkbSS = ss;
        break;
      }
    } catch (e) {}
  }

  if (!pdkbSS) {
    try {
      pdkbSS = SpreadsheetApp.openById(SPREADSHEETS.PDKB);
    } catch(e) {}
  }

  if (!pdkbSS) return { success: false, message: "Spreadsheet PDKB tidak ditemukan", data: [] };

  const sheet = pdkbSS.getSheetByName("LOG KESEHATAN") || pdkbSS.getSheetByName("Log Kesehatan");
  if (!sheet) return { success: true, data: [] };

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { success: true, data: [] };

  const headers = data[0].map(h => String(h).trim());
  const list = [];
  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    const item = {};
    for (let c = 0; c < headers.length; c++) {
      let val = row[c];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, "Asia/Jakarta", "dd/MM/yyyy HH:mm");
      } else {
        val = val !== null && val !== undefined ? String(val) : "";
      }
      item[headers[c] || `Kolom_${c + 1}`] = val;
    }
    list.push(item);
  }

  list.reverse();
  return { success: true, data: list };
}

function handleGetKesehatanOverview(payload) {
  const pResult = handleGetAllPersonil(payload);
  const overview = {
    fisik: { SEHAT: 0, KURANG_SEHAT: 0, TIDAK_SEHAT: 0 },
    mental: { SEHAT: 0, KURANG_SEHAT: 0, TIDAK_SEHAT: 0 },
    total: 0
  };

  if (pResult.success && Array.isArray(pResult.data)) {
    overview.total = pResult.data.length;
    pResult.data.forEach(p => {
      const f = String(p["Kesehatan Fisik"] || p["Status Fisik"] || "SEHAT").toUpperCase();
      const m = String(p["Kesehatan Mental"] || p["Status Mental"] || "SEHAT").toUpperCase();

      if (f.includes("KURANG")) overview.fisik.KURANG_SEHAT++;
      else if (f.includes("TIDAK") || f.includes("SAKIT")) overview.fisik.TIDAK_SEHAT++;
      else overview.fisik.SEHAT++;

      if (m.includes("KURANG") || m.includes("STRES")) overview.mental.KURANG_SEHAT++;
      else if (m.includes("TIDAK") || m.includes("DEPRESI")) overview.mental.TIDAK_SEHAT++;
      else overview.mental.SEHAT++;
    });
  }

  return { success: true, data: overview };
}

function handleGetAllPersonil(payload) {
  let sheet = null;
  const spreadsheedIds = [
    SPREADSHEETS.PDKB,
    SPREADSHEETS.AUTH,
    SPREADSHEETS.USERS,
    SPREADSHEETS.BERKAS_PEKERJAAN,
  ];
  for (const ssid of spreadsheedIds) {
    try {
      const ss = SpreadsheetApp.openById(ssid);
      sheet = ss.getSheetByName("Personil") || ss.getSheetByName("PERSONIL");
      if (sheet) break;
    } catch (e) {}
  }

  if (!sheet)
    return { success: false, message: "Sheet Personil/PERSONIL tidak ditemukan" };

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { success: false, message: "Data kosong" };

  const headers = data[0];
  const list = [];

  // also check if there is a 'Legalitas' sheet
  let legalitasSheet = null;
  let legalitasData = [];
  let legalitasHeaders = [];
  for (const ssid of spreadsheedIds) {
    try {
      const ss = SpreadsheetApp.openById(ssid);
      legalitasSheet = ss.getSheetByName("Legalitas");
      if (legalitasSheet) break;
    } catch (e) {}
  }

  if (legalitasSheet) {
    const lData = legalitasSheet.getDataRange().getValues();
    if (lData.length > 0) {
      legalitasHeaders = lData[0];
      legalitasData = lData.slice(1);
    }
  }

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      let val = row[j];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, "Asia/Jakarta", "dd/MM/yyyy");
      } else {
        val = val ? String(val) : "";
      }
      obj[headers[j] || `Kolom ${j + 1}`] = val;
    }

    // Merge with Legalitas if it exists
    if (legalitasData.length > 0) {
      const nipOrNama = String(
        obj["NIP"] || obj["NAMA"] || obj["Nama"] || obj["User ID"] || row[0],
      )
        .trim()
        .toLowerCase();
      const lRow = legalitasData.find(
        (lr) =>
          String(lr[0]).trim().toLowerCase() === nipOrNama ||
          String(lr[1]).trim().toLowerCase() === nipOrNama,
      );
      if (lRow) {
        for (let k = 0; k < legalitasHeaders.length; k++) {
          let val = lRow[k];
          if (val instanceof Date)
            val = Utilities.formatDate(val, "Asia/Jakarta", "dd/MM/yyyy");
          else val = val ? String(val) : "";
          obj["Legalitas_" + (legalitasHeaders[k] || `Kolom ${k + 1}`)] = val;
        }
      }
    }

    if (Object.values(obj).some((v) => v !== "")) {
      list.push(obj);
    }
  }

  return { success: true, data: list };
}

function handleGetWarehouseData(payload) {
  const { sheetName } = payload;
  if (!sheetName) return { success: false, message: "sheetName is required" };

  let sheet = null;
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEETS.WAREHOUSE);
    sheet = ss.getSheetByName(sheetName);
  } catch (e) {}

  if (!sheet)
    return {
      success: false,
      message: "Sheet " + sheetName + " tidak ditemukan",
    };

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { success: false, message: "Data kosong" };

  const headers = data[0];
  const list = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      let val = row[j];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, "Asia/Jakarta", "dd/MM/yyyy");
      } else {
        val = val ? String(val) : "";
      }
      obj[headers[j] || `Kolom${j + 1}`] = val;
    }
    // ensure row has some data
    if (Object.values(obj).join("").trim() !== "") {
      // add original row index for updating purpose later
      obj["_rowIndex"] = i + 1;
      list.push(obj);
    }
  }

  // Calculate overview counts (Specific requirement for 'PERALATAN KERJA')
  const overview = {
    baik: 0,
    rusak: 0,
    masuk: 0,
    keluar: 0,
  };

  list.forEach((item) => {
    let kondisi = String(
      item["KONDISI"] || item["Kondisi"] || "",
    ).toUpperCase();
    let status = String(item["STATUS"] || item["Status"] || "").toUpperCase();

    if (kondisi === "BAIK") overview.baik++;
    if (kondisi === "RUSAK") overview.rusak++;
    if (status === "MASUK" || status === "TERSEDIA" || status === "GUDANG")
      overview.masuk++;
    if (status === "KELUAR" || status === "DIPINJAM") overview.keluar++;
  });

  let mutasiData = [];
  try {
     let ss = SpreadsheetApp.openById(SPREADSHEETS.WAREHOUSE);
     let mutasiSheet = ss.getSheetByName("MUTASI " + sheetName);
     if (mutasiSheet) {
        let mData = mutasiSheet.getDataRange().getValues();
        if (mData.length > 1) {
           let mHeaders = mData[0];
           for(let i = mData.length - 1; i >= 1; i--) {
              let mRow = mData[i];
              let mObj = {};
              for(let j=0; j<mHeaders.length; j++) {
                 mObj[mHeaders[j]] = mRow[j];
              }
              if (Object.values(mObj).some(v => v !== "")) {
                 mutasiData.push(mObj);
              }
           }
        }
     }
  } catch(e) {}

  return { success: true, data: list, overview, mutasi: mutasiData };
}

function handleUpdateWarehouseData(payload) {
  const { sheetName, updates, isNew, fotoBase64, fotoName } = payload;
  if (!sheetName || !updates)
    return { success: false, message: "sheetName and updates are required" };

  let sheet = null;
  let ss = null;
  try {
    ss = SpreadsheetApp.openById(SPREADSHEETS.WAREHOUSE);
    sheet = ss.getSheetByName(sheetName);
  } catch (e) {}

  if (!sheet)
    return {
      success: false,
      message: "Sheet " + sheetName + " tidak ditemukan",
    };

  const data = sheet.getDataRange().getValues();
  if (data.length < 1) return { success: false, message: "Sheet kosong" };

  let fotoUrl = null;
  if (fotoBase64) {
    try {
      const folder = DriveApp.getFolderById(SPREADSHEETS.WAREHOUSE_EVIDENCES);
      const decodedFile = Utilities.base64Decode(fotoBase64);
      let ext = ".jpg";
      if (fotoName && fotoName.lastIndexOf(".") !== -1) {
        ext = fotoName.substring(fotoName.lastIndexOf("."));
      }

      let itemNama = "IMAGE";
      Object.keys(updates).forEach((k) => {
        if (
          k.toUpperCase().includes("NAMA ALAT") ||
          k.toUpperCase().includes("NAMA PERALATAN") ||
          k.toUpperCase() === "NAMA"
        ) {
          itemNama = updates[k];
        }
      });
      let fName =
        itemNama +
        "-" +
        Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyyMMddHHmmss") +
        ext;
      const blob = Utilities.newBlob(decodedFile, MimeType.JPEG, fName);
      const file = folder.createFile(blob);
      fotoUrl = file.getUrl();

      try {
        file.setSharing(
          DriveApp.Access.ANYONE_WITH_LINK,
          DriveApp.Permission.VIEW,
        );
      } catch (shareErr) {
        console.log("Ignored setSharing error: " + shareErr.toString());
      }

      let driveKey = Object.keys(updates).find(
        (k) =>
          k.trim().toUpperCase() === "LINK GDRIVE" ||
          k.trim().toUpperCase() === "LINK DRIVE",
      );
      if (driveKey) {
        updates[driveKey] = fotoUrl;
      } else {
        updates["LINK GDRIVE"] = fotoUrl;
      }
    } catch (e) {
      console.error("Error upload foto:", e);
    }
  }

  const headers = data[0];

  if (isNew) {
    let maxNo = 0;
    const noIdx = headers.findIndex(
      (h) =>
        String(h).trim().toUpperCase() === "NO" ||
        String(h).trim().toUpperCase() === "NO.",
    );

    let emptyRowIndex = -1;
    let nameIdx = headers.findIndex((h) => {
      let text = String(h).trim().toUpperCase();
      return (
        text.includes("NAMA PERALATAN") ||
        text.includes("NAMA KENDARAAN") ||
        text.includes("NAMA MATERIAL") ||
        (text.includes("NAMA") && text.includes("JENIS")) ||
        text === "NAMA" ||
        text.includes("INVENTARIS")
      );
    });

    if (nameIdx !== -1) {
      for (let i = 1; i < data.length; i++) {
        if (!data[i][nameIdx] || String(data[i][nameIdx]).trim() === "") {
          emptyRowIndex = i + 1; 
          break;
        }
      }
    }

    if (noIdx !== -1) {
      for (let i = 1; i < data.length; i++) {
        const val = parseInt(data[i][noIdx], 10);
        if (!isNaN(val) && val > maxNo) maxNo = val;
      }
      if (updates[headers[noIdx]] === undefined) {
        updates[headers[noIdx]] = maxNo + 1;
      }
    }

    if (emptyRowIndex !== -1) {
      Object.keys(updates).forEach((matchedKey) => {
        const colIdx = headers.findIndex(
          (h) =>
            String(h).trim().toUpperCase() === matchedKey.trim().toUpperCase(),
        );
        if (colIdx !== -1) {
          sheet.getRange(emptyRowIndex, colIdx + 1).setValue(updates[matchedKey]);
        }
      });
    } else {
      let newRow = [];
      for (let i = 0; i < headers.length; i++) {
        const hName = String(headers[i]);
        const matchedKey = Object.keys(updates).find(
          (k) => k.trim().toUpperCase() === hName.trim().toUpperCase(),
        );
        if (matchedKey) {
          newRow.push(updates[matchedKey]);
        } else {
          newRow.push("");
        }
      }
      sheet.appendRow(newRow);
    }

    try {
      let mutasiSheetName = "MUTASI " + sheetName;
      let mutasiSheet = ss.getSheetByName(mutasiSheetName);
      if (mutasiSheet) {
        let mValData = mutasiSheet.getDataRange().getValues();
        if (mValData.length > 0) {
          let mHeaders = mValData[0];
          
          let maxNo = 0;
          let noIdxM = -1;
          for(let i = 0; i < mHeaders.length; i++) {
             let hName = String(mHeaders[i]).trim().toUpperCase();
             if (hName === "NO" || hName === "NO.") noIdxM = i;
          }
          if (noIdxM !== -1) {
            for (let j = 1; j < mValData.length; j++) {
               let val = parseInt(mValData[j][noIdxM], 10);
               if (!isNaN(val) && val > maxNo) maxNo = val;
            }
          }
          let nowStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "dd/MM/yyyy - HH:mm");
          
          let generateMRow = (vol, typeLabel) => {
             let mRow = new Array(mHeaders.length).fill("");
             for(let i = 0; i < mHeaders.length; i++) {
                let hName = String(mHeaders[i]).trim().toUpperCase();
                if (hName === "NO" || hName === "NO.") {
                   maxNo++;
                   mRow[i] = maxNo;
                } else if (hName === "TANGGAL" || hName === "TGL") {
                   mRow[i] = nowStr;
                } else if (hName === "MUTASI" || hName === "STATUS") {
                   mRow[i] = typeLabel;
                } else if (hName === "VOLUME" || hName === "VOL") {
                   mRow[i] = vol;
                } else if (sheetName.toUpperCase() === "MATERIAL" && (hName.includes("NAMA") || hName === "NAMA MATERIAL")) {
                   let nameKey = Object.keys(updates).find(k => k.trim().toUpperCase().includes("NAMA"));
                   let jenisKey = Object.keys(updates).find(k => k.trim().toUpperCase().includes("JENIS"));
                   let nVal = nameKey ? updates[nameKey] : "";
                   let jVal = jenisKey ? updates[jenisKey] : "";
                   if (nVal && jVal) {
                       mRow[i] = nVal + " - " + jVal;
                   } else if (nVal) {
                       mRow[i] = nVal;
                   }
                } else {
                   let matchedKey = Object.keys(updates).find(k => k.trim().toUpperCase() === hName);
                   if (matchedKey) {
                     mRow[i] = updates[matchedKey];
                   } else if (hName.includes("NAMA")) {
                     let nameKey = Object.keys(updates).find(k => k.trim().toUpperCase().includes("NAMA"));
                     if (nameKey) mRow[i] = updates[nameKey];
                   }
                }
             }
             return mRow;
          };

          if (sheetName.toUpperCase() === "MATERIAL") {
             let masukVal = parseInt(updates["MASUK"] || updates["Masuk"], 10) || 0;
             let keluarVal = parseInt(updates["KELUAR"] || updates["Keluar"], 10) || 0;
             if (masukVal > 0) mutasiSheet.appendRow(generateMRow(masukVal, "MASUK"));
             if (keluarVal > 0) mutasiSheet.appendRow(generateMRow(keluarVal, "KELUAR"));
             if (masukVal === 0 && keluarVal === 0) mutasiSheet.appendRow(generateMRow("", "TAMBAH DATA"));
          } else {
             let statusVal = updates["STATUS"] || updates["Status"] || updates["KONDISI"] || updates["Kondisi"] || "TAMBAH DATA";
             mutasiSheet.appendRow(generateMRow("", statusVal));
          }
        }
      }
    } catch(e) {
      return { success: false, message: "Error Mutasi Add: " + e.message };
    }

    return { success: true, message: "Data berhasil ditambahkan", fotoUrl };
  } else {
    const rowIndex = payload.rowIndex;
    if (!rowIndex || rowIndex < 2)
      return {
        success: false,
        message: "rowIndex invalid untuk update, rowIndex=" + rowIndex,
      };

    const updateRange = sheet.getRange(rowIndex, 1, 1, headers.length);
    const rowValues = updateRange.getValues()[0];
    const rowFormulas = updateRange.getFormulas()[0];

    Object.keys(updates).forEach((matchedKey) => {
      // Find column index for this key
      const colIdx = headers.findIndex(
        (h) =>
          String(h).trim().toUpperCase() === matchedKey.trim().toUpperCase(),
      );
      if (colIdx !== -1) {
        if (sheetName.toUpperCase() === "MATERIAL") {
           // Skip these as we process them customly or they are formulas
           if (!["TOTAL STOK", "STOK", "MASUK", "KELUAR", "STOK GUDANG", "STOK MOBIL"].includes(matchedKey.toUpperCase())) {
             rowValues[colIdx] = updates[matchedKey];
           }
        } else {
          rowValues[colIdx] = updates[matchedKey];
        }
      }
    });

    if (sheetName.toUpperCase() === "MATERIAL") {
       let mGudangMasuk = parseInt(updates["gudangMasuk"], 10) || 0;
       let mGudangKeluar = parseInt(updates["gudangKeluar"], 10) || 0;
       let mMobilKeluar = parseInt(updates["mobilKeluar"], 10) || 0;

       let stokGudangIdx = headers.findIndex((h) => String(h).trim().toUpperCase() === "STOK GUDANG");
       let stokMobilIdx = headers.findIndex((h) => String(h).trim().toUpperCase() === "STOK MOBIL");

       if (stokGudangIdx !== -1) {
           let currentStokGudang = parseInt(rowValues[stokGudangIdx], 10) || 0;
           rowValues[stokGudangIdx] = currentStokGudang + mGudangMasuk - mGudangKeluar;
       }
       if (stokMobilIdx !== -1) {
           let currentStokMobil = parseInt(rowValues[stokMobilIdx], 10) || 0;
           // Hanya update jika bukan formula
           if (!rowFormulas[stokMobilIdx]) {
               rowValues[stokMobilIdx] = currentStokMobil + mGudangKeluar - mMobilKeluar;
           }
       }
       if (stokGudangIdx !== -1 && rowFormulas[stokGudangIdx]) {
           // Jika stok gudang formula, kembalikan ke formula
           rowValues[stokGudangIdx] = rowFormulas[stokGudangIdx];
       }
       if (stokMobilIdx !== -1 && rowFormulas[stokMobilIdx]) {
           // Jika stok mobil formula, kembalikan ke formula
           rowValues[stokMobilIdx] = rowFormulas[stokMobilIdx];
       }
    }
    
    // Kembalikan semua formula yang ada sebelumnya agar tidak tertimpa
    for (let i = 0; i < headers.length; i++) {
        if (rowFormulas[i]) {
            rowValues[i] = rowFormulas[i];
        }
    }

    try { sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowValues]); } catch (e) { return { success: false, message: "Gagal menyimpan ke sheet utama: " + e.message }; }

    try {
      let mutasiSheetName = "MUTASI " + sheetName;
      let mutasiSheet = ss.getSheetByName(mutasiSheetName);
      if (mutasiSheet) {
        let mValData = mutasiSheet.getDataRange().getValues();
        if (mValData.length > 0) {
          let mHeaders = mValData[0];
          
          let maxNo = 0;
          let noIdxM = -1;
          for(let i = 0; i < mHeaders.length; i++) {
             let hName = String(mHeaders[i]).trim().toUpperCase();
             if (hName === "NO" || hName === "NO.") noIdxM = i;
          }
          if (noIdxM !== -1) {
            for (let j = 1; j < mValData.length; j++) {
               let val = parseInt(mValData[j][noIdxM], 10);
               if (!isNaN(val) && val > maxNo) maxNo = val;
            }
          }
          let nowStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "dd/MM/yyyy - HH:mm");
          
          let generateMRow = (vol, typeLabel) => {
             let mRow = new Array(mHeaders.length).fill("");
             for(let i = 0; i < mHeaders.length; i++) {
                let hName = String(mHeaders[i]).trim().toUpperCase();
                if (hName === "NO" || hName === "NO.") {
                   maxNo++;
                   mRow[i] = maxNo;
                } else if (hName === "TANGGAL" || hName === "TGL") {
                   mRow[i] = nowStr;
                } else if (hName === "MUTASI" || hName === "STATUS") {
                   mRow[i] = typeLabel;
                } else if (hName === "VOLUME" || hName === "VOL") {
                   mRow[i] = vol;
                } else {
                   let matchedKey = Object.keys(updates).find(k => k.trim().toUpperCase() === hName);
                   if (matchedKey) {
                     mRow[i] = updates[matchedKey];
                   } else {
                     let oldValColIdx = headers.findIndex(h => String(h).trim().toUpperCase() === hName);
                     if (oldValColIdx !== -1) {
                       mRow[i] = sheet.getRange(rowIndex, oldValColIdx + 1).getValue();
                     } else if (hName.includes("NAMA")) {
                       let oldNameIdx = headers.findIndex(h => String(h).trim().toUpperCase().includes("NAMA"));
                       if (oldNameIdx !== -1) {
                         mRow[i] = sheet.getRange(rowIndex, oldNameIdx + 1).getValue();
                       }
                     }
                   }
                }
             }
             return mRow;
          };

          if (sheetName.toUpperCase() === "MATERIAL") {
             let mGudangMasuk = parseInt(updates["gudangMasuk"], 10) || 0;
             let mGudangKeluar = parseInt(updates["gudangKeluar"], 10) || 0;
             let mGudangKet = updates["gudangKet"] || "";
             let mMobilKeluar = parseInt(updates["mobilKeluar"], 10) || 0;
             let mMobilKet = updates["mobilKet"] || "";

             let materialName = "";
             let materialCode = "";

             let namaIdx = headers.findIndex(h => String(h).trim().toUpperCase().includes("NAMA"));
             let jenisIdx = headers.findIndex(h => String(h).trim().toUpperCase().includes("JENIS"));
             let kodeIdx = headers.findIndex(h => String(h).trim().toUpperCase().includes("KODE"));

             let nameKey = Object.keys(updates).find(k => k.trim().toUpperCase().includes("NAMA"));
             let jenisKey = Object.keys(updates).find(k => k.trim().toUpperCase().includes("JENIS"));
             let kodeKey = Object.keys(updates).find(k => k.trim().toUpperCase().includes("KODE"));

             let n1 = nameKey ? updates[nameKey] : (namaIdx !== -1 ? sheet.getRange(rowIndex, namaIdx + 1).getValue() : "");
             let n2 = jenisKey ? updates[jenisKey] : (jenisIdx !== -1 ? sheet.getRange(rowIndex, jenisIdx + 1).getValue() : "");
             
             if (n1 && n2) {
                 materialName = n1 + " - " + n2;
             } else if (n1) {
                 materialName = n1;
             }
             if (kodeIdx !== -1) {
                 materialCode = kodeKey ? updates[kodeKey] : sheet.getRange(rowIndex, kodeIdx + 1).getValue();
             }

             const customGenerateMRow = (vol, mutasi, ket) => {
                 let mRow = new Array(mHeaders.length).fill("");
                 for(let i = 0; i < mHeaders.length; i++) {
                    let hName = String(mHeaders[i]).trim().toUpperCase();
                    if (hName === "NO" || hName === "NO.") {
                       maxNo++;
                       mRow[i] = maxNo;
                    } else if (hName === "TANGGAL" || hName === "TGL") {
                       mRow[i] = nowStr;
                    } else if (hName === "MUTASI" || hName === "STATUS") {
                       mRow[i] = mutasi;
                    } else if (hName === "VOLUME" || hName === "VOL") {
                       mRow[i] = vol;
                    } else if (hName.includes("NAMA")) {
                       mRow[i] = materialName;
                    } else if (hName === "KODE") {
                       mRow[i] = materialCode;
                    } else if (hName === "KETERANGAN" || hName === "KET") {
                       mRow[i] = ket;
                    }
                 }
                 return mRow;
             };

             let addMutasi = false;
             try {
                 if (mGudangMasuk > 0) { mutasiSheet.appendRow(customGenerateMRow(mGudangMasuk, "MASUK - GUDANG", mGudangKet)); addMutasi = true; }
                 if (mGudangKeluar > 0) { mutasiSheet.appendRow(customGenerateMRow(mGudangKeluar, "KELUAR - GUDANG", mGudangKet)); addMutasi = true; }
                 if (mMobilKeluar > 0) { mutasiSheet.appendRow(customGenerateMRow(mMobilKeluar, "KELUAR - MOBIL", mMobilKet)); addMutasi = true; }
                 if (!addMutasi) mutasiSheet.appendRow(customGenerateMRow("", "UPDATE DATA", ""));
             } catch (mutasiErr) {
                 return { success: false, message: "Data utama tersimpan, namun gagal update Mutasi (Merge Cells?): " + mutasiErr.message };
             }
          } else {
             let statusVal = updates["STATUS"] || updates["Status"] || updates["KONDISI"] || updates["Kondisi"] || "UPDATE DATA";
             try {
                mutasiSheet.appendRow(generateMRow("", statusVal));
             } catch (mutasiErr) {
                return { success: false, message: "Data utama tersimpan, namun gagal update Mutasi (Merge Cells?): " + mutasiErr.message };
             }
          }
        }
      }
    } catch (e) {
      return { success: false, message: "Error Mutasi Update: " + e.message };
    }

    return { success: true, message: "Data berhasil diupdate", fotoUrl };
  }
}

function handleGenerateSlideJumat(payload) {
  const templateId = "1AuCEqo5mcNWTGgOQnHki-8lyScSfRPHaNJE9_QR29jU";
  
  try {
    const templateFile = DriveApp.getFileById(templateId);
    let targetFolder;
    try {
      targetFolder = DriveApp.getFolderById("1LBbtE9NrgCyoh1zuJ8vBAMybUto86a5E"); 
    } catch(e) {
      targetFolder = DriveApp.getRootFolder();
    }
    
    // Default name if not provided
    const newFileName = payload.newFileName || `KEGIATAN JUMAT PDKB WTP`;
    const copyFile = templateFile.makeCopy(newFileName, targetFolder);
    const presentationId = copyFile.getId();
    
    // Make anyone with link can view
    try {
      copyFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch(e) {
    }
    
    const presentation = SlidesApp.openById(presentationId);
    
    // 1. Ganti teks General
    presentation.replaceAllText("{{tanggal}}", String(payload.tanggal || ""));
    presentation.replaceAllText("{{namaTL}}", String(payload.namaTL || ""));
    presentation.replaceAllText("{{nipTL}}", String(payload.nipTL || ""));
    presentation.replaceAllText("{{jabatanTL}}", String(payload.jabatanTL || ""));
    
    // 2. Ganti teks SOP/IK
    presentation.replaceAllText("{{judulSOP}}", String(payload.judulSOP || ""));
    presentation.replaceAllText("{{judulIK}}", String(payload.judulIK || ""));
    
    // Helper untuk ganti foto pada tag tertentu dlm shape
    function replaceImageWithTag(tag, base64Str) {
      if (!base64Str || !base64Str.includes("base64,")) return;
      try {
        const parts = base64Str.split("base64,");
        const data = parts[1];
        let mimeType = "image/jpeg";
        if (parts[0].includes("image/png")) mimeType = "image/png";
        else if (parts[0].includes("image/webp")) mimeType = "image/webp";
        
        const blob = Utilities.newBlob(Utilities.base64Decode(data), mimeType, "image");
        
        const slides = presentation.getSlides();
        for(let s=0; s<slides.length; s++) {
          const shapes = slides[s].getShapes();
          for(let sh=0; sh<shapes.length; sh++) {
            let text = "";
            try { text = shapes[sh].getText().asString(); } catch(e){}
            if (text.includes(tag)) {
              shapes[sh].replaceWithImage(blob);
            }
          }
        }
      } catch(e) {
        console.error("Gagal ganti img untuk " + tag, e);
      }
    }
    
    // Replace all images
    replaceImageWithTag("{{mobilCrew}}", payload.mobilCrew);
    replaceImageWithTag("{{mobilAlat}}", payload.mobilAlat);
    replaceImageWithTag("{{alat1}}", payload.alat1);
    replaceImageWithTag("{{alat2}}", payload.alat2);
    replaceImageWithTag("{{alat3}}", payload.alat3);
    replaceImageWithTag("{{alat4}}", payload.alat4);
    replaceImageWithTag("{{olahraga1}}", payload.olahraga1);
    replaceImageWithTag("{{olahraga2}}", payload.olahraga2);
    replaceImageWithTag("{{review1}}", payload.review1);
    replaceImageWithTag("{{review2}}", payload.review2);
    replaceImageWithTag("{{ssReview}}", payload.ssReview);
    replaceImageWithTag("{{absenReview}}", payload.absenReview);
    
    presentation.saveAndClose();
    
    return { success: true, url: copyFile.getUrl() };
  } catch(err) {
    return { success: false, error: err.toString() };
  }
}

function handleSaveDataJumat(payload) {
  try {
    var getFormattedTanggalJumat = function(tanggalRaw) {
      if (!tanggalRaw) return "DATE";
      try {
        var parts = tanggalRaw.split("-");
        if (parts.length === 3) {
          var day = parseInt(parts[2], 10);
          var year = parseInt(parts[0], 10);
          var monthsId = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];
          var monthIndex = parseInt(parts[1], 10) - 1;
          return day + " " + monthsId[monthIndex] + " " + year;
        }
      } catch(e) {}
      return "DATE";
    };

    var formattedTanggal = getFormattedTanggalJumat(payload.tanggalRaw);
    var photoFolderId = "1yrGvyW2qkk_WvHGR1hrAOktA-2TECiLP";
    var absenUrl = "";
    var evidenUrl = "";

    var photosToUpload = [
      { key: "mobilCrew", section: "PEMBERSIHAN KENDARAAN OPERASIONAL", name: "MOBIL CREW" },
      { key: "mobilAlat", section: "PEMBERSIHAN KENDARAAN OPERASIONAL", name: "MOBIL PERALATAN" },
      { key: "alat1", section: "PEMBERSIHAN PERALATAN", name: "PEMBERSIHAN ALAT 1" },
      { key: "alat2", section: "PEMBERSIHAN PERALATAN", name: "PEMBERSIHAN ALAT 2" },
      { key: "alat3", section: "PEMBERSIHAN PERALATAN", name: "PEMBERSIHAN ALAT 3" },
      { key: "alat4", section: "PEMBERSIHAN PERALATAN", name: "PEMBERSIHAN ALAT 4" },
      { key: "olahraga1", section: "OLAHRAGA", name: "OLAHRAGA 1" },
      { key: "olahraga2", section: "OLAHRAGA", name: "OLAHRAGA 2" },
      { key: "review1", section: "REVIEW SOP IK", name: "EVIDEN 1" },
      { key: "review2", section: "REVIEW SOP IK", name: "EVIDEN 2" },
      { key: "ssReview", section: "REVIEW SOP IK", name: "SS SHEET" },
      { key: "absenReview", section: "REVIEW SOP IK", name: "DAFTAR HADIR" }
    ];

    for (var pIdx = 0; pIdx < photosToUpload.length; pIdx++) {
      var item = photosToUpload[pIdx];
      var base64Data = payload[item.key];
      if (base64Data && base64Data.indexOf("base64,") !== -1) {
        var customFileName = "REVIEW IK-" + formattedTanggal + "-" + item.section + "-" + item.name + ".jpg";
        var uploadRes = uploadBase64ToDrive(base64Data, customFileName, photoFolderId);
        if (uploadRes && uploadRes.id) {
          var uploadedUrl = "https://lh3.googleusercontent.com/d/" + uploadRes.id;
          if (item.key === "absenReview") {
            absenUrl = uploadedUrl;
          } else if (item.key === "review1") {
            evidenUrl = uploadedUrl;
          }
        }
      }
    }

    const jumatSS = SpreadsheetApp.openById("1iAnM-ZRPjsgezBv12zUoxL7k68ihon-ssF_egMNPuO4");
    const sheets = jumatSS.getSheets();
    let sheetJumat = null;
    
    let targetYear = "";
    if (payload.tanggalRaw) {
      const p = payload.tanggalRaw.split("-");
      if (p.length === 3) {
        targetYear = String(p[0]).trim();
      }
    }

    if (targetYear) {
      sheetJumat = jumatSS.getSheetByName(targetYear);
    }

    if (!sheetJumat) {
      for (let i = 0; i < sheets.length; i++) {
        if (String(sheets[i].getSheetId()) === "1068513273") {
          sheetJumat = sheets[i];
          break;
        }
      }
    }

    if (!sheetJumat) {
      sheetJumat = sheets[0];
    }

    if (sheetJumat) {
      const jData = sheetJumat.getDataRange().getValues();
      const jHeaders = jData[0];
      const jHeadersStr = jHeaders.map(function(h) { return String(h || "").trim().toUpperCase(); });

      const colNoIdx = jHeadersStr.indexOf("NO");
      const colTanggalIdx = jHeadersStr.indexOf("TANGGAL");
      const colJudulIkIdx = jHeadersStr.indexOf("JUDUL IK");
      const colKetIkIdx = jHeadersStr.indexOf("KETERANGAN IK");
      const colAbsenIdx = jHeadersStr.indexOf("ABSENSI");
      const colEvidenIdx = jHeadersStr.indexOf("EVIDEN");

      // Cari atau hitung NO otomatis berurut dari nomor sebelumnya
      let maxNo = 0;
      if (colNoIdx !== -1) {
        for (let i = 1; i < jData.length; i++) {
          const valNo = parseInt(String(jData[i][colNoIdx]).trim(), 10);
          if (!isNaN(valNo) && valNo > maxNo) {
            maxNo = valNo;
          }
        }
      }
      const nextNo = maxNo + 1;

      // Construct raw Date safely
      let rawDate = null;
      if (payload.tanggalRaw) {
        const p = payload.tanggalRaw.split("-");
        if (p.length === 3) {
          rawDate = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
        }
      }

      // Tentukan baris baru
      const nextRow = sheetJumat.getLastRow() + 1;

      // Set values
      if (colNoIdx !== -1) {
        sheetJumat.getRange(nextRow, colNoIdx + 1).setValue(nextNo);
      }
      if (colTanggalIdx !== -1) {
        const dateCell = sheetJumat.getRange(nextRow, colTanggalIdx + 1);
        if (rawDate) {
          dateCell.setValue(rawDate);
          dateCell.setNumberFormat('[$-id-ID]dddd, dd mmmm yyyy');
        } else {
          dateCell.setValue(payload.tanggal || "");
        }
      }
      if (colJudulIkIdx !== -1) {
        sheetJumat.getRange(nextRow, colJudulIkIdx + 1).setValue(payload.judulIK || "");
      }
      if (colKetIkIdx !== -1) {
        sheetJumat.getRange(nextRow, colKetIkIdx + 1).setValue("REVIEW IK");
      }

      // Simpan gambar Absensi
      if (colAbsenIdx !== -1 && absenUrl) {
        const cellAbsen = sheetJumat.getRange(nextRow, colAbsenIdx + 1);
        try {
          const imgObj = SpreadsheetApp.newCellImage().setSourceUrl(absenUrl).build();
          cellAbsen.setValue(imgObj);
        } catch(err) {
          cellAbsen.setFormula('=IMAGE("' + absenUrl + '")');
        }
      }

      // Simpan gambar Eviden
      if (colEvidenIdx !== -1 && evidenUrl) {
        const cellEviden = sheetJumat.getRange(nextRow, colEvidenIdx + 1);
        try {
          const imgObj = SpreadsheetApp.newCellImage().setSourceUrl(evidenUrl).build();
          cellEviden.setValue(imgObj);
        } catch(err) {
          cellEviden.setFormula('=IMAGE("' + evidenUrl + '")');
        }
      }
    }
    
    return { success: true, message: "Data berhasil disimpan di Spreadsheet" };
  } catch(sheetErr) {
    console.error("Gagal menyimpan ke Spreadsheet Laporan Jumat: " + sheetErr.toString());
    return { success: false, error: sheetErr.toString() };
  }
}

function handleSelesaikanPekerjaan(payload) {
  const { noWo, isCanceled } = payload;
  if (!noWo) {
    return { success: false, message: "NO. WO tidak disertakan" };
  }

  if (isCanceled) {
    return { success: true, message: "Berhasil menyelesaikan pekerjaan (dibatalkan/dihentikan)" };
  }

  try {
    const listSS = SpreadsheetApp.openById(SPREADSHEETS.LIST_REALISASI);
    const sheetR = listSS.getSheetByName("LIST REALISASI");
    
    if (!sheetR) {
      return { success: false, message: "Sheet LIST REALISASI tidak ditemukan" };
    }

    const data = sheetR.getDataRange().getValues();
    const headers = data[0];
    const noWoColIdx = headers.findIndex((h) => {
      const hn = String(h).trim().toUpperCase();
      return hn === "NO WO" || hn === "NO. WO" || hn === "NO.WO";
    });

    if (noWoColIdx === -1) {
      return { success: false, message: "Kolom NO. WO pada LIST REALISASI tidak ditemukan" };
    }

    // Find the first empty row for NO. WO column
    let emptyRow = -1;
    for (let r = 1; r < data.length; r++) { // Skip header
      if (!String(data[r][noWoColIdx]).trim()) {
        emptyRow = r + 1; // 1-based index
        break;
      }
    }

    // If no empty row found, use the row after the last data row
    if (emptyRow === -1) {
      emptyRow = sheetR.getLastRow() + 1;
    }

    sheetR.getRange(emptyRow, noWoColIdx + 1).setValue(noWo);

    let fotoGridUrl = "";
    if (payload.collageBase64) {
      const resDrive = uploadBase64ToDrive(
        payload.collageBase64,
        payload.collageName || noWo + " - REALISASI.jpg",
        "1ohUKW4PqwA5ANj2RLrvlkeHtHlHuET0Q"
      );
      if (resDrive) {
        fotoGridUrl = "https://lh3.googleusercontent.com/d/" + resDrive.id;
      }
    }

    // Save fotoGridUrl to CL_PELAKSANAAN -> FOTO REALISASI
    try {
      if (fotoGridUrl) {
        const wpSS = SpreadsheetApp.openById(SPREADSHEETS.WORK_PLAN);
        const wpSheet = wpSS.getSheetByName("CL_PELAKSANAAN");
        if (wpSheet) {
          const wpData = wpSheet.getDataRange().getValues();
          const wpH = wpData[0];
          const wpWoIdx = wpH.findIndex(h => String(h).trim().toUpperCase() === "NO WO" || String(h).trim().toUpperCase() === "NO. WO" || String(h).trim().toUpperCase() === "NO.WO");
          const fsIdx = wpH.findIndex(h => String(h).trim().toUpperCase() === "FOTO REALISASI");
          
          if (wpWoIdx !== -1 && fsIdx !== -1) {
            for (let i = 1; i < wpData.length; i++) {
              if (String(wpData[i][wpWoIdx]).trim() === String(noWo).trim()) {
                wpSheet.getRange(i + 1, fsIdx + 1).setValue(fotoGridUrl);
                break;
              }
            }
          }
        }
      }
    } catch(err) {
      console.log("Gagal simpan foto grid ke CL_PELAKSANAAN: " + err.message);
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

    return { success: true, message: "Berhasil menyelesaikan pekerjaan", fotoGridUrl };

  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function handleRequestAkun(payload) {
  try {
    const { nip, nama, password, pin, unit } = payload;
    if (!nip || !nama) {
      return { success: false, message: "NIP dan Nama tidak boleh kosong" };
    }

    const authSS = SpreadsheetApp.openById(SPREADSHEETS.AUTH);
    const authSheet = authSS.getSheetByName("Auth");
    if (!authSheet) {
      return { success: false, message: "Sheet Auth tidak ditemukan" };
    }

    const data = authSheet.getDataRange().getValues();
    const headers = data[0];

    const colUserID = headers.findIndex((h) => h === "UserID");
    const colUserName = headers.findIndex((h) => h === "UserName");
    const colPassword = headers.findIndex((h) => h === "Password");
    const colUserPin = headers.findIndex((h) => h === "UserPin");
    const colUserUnit = headers.findIndex((h) => h === "UserUNIT");

    if (colUserID === -1 || colUserName === -1 || colPassword === -1 || colUserPin === -1) {
      return { success: false, message: "Kolom pada sheet Auth tidak lengkap" };
    }

    // Append new row
    const newRow = new Array(headers.length).fill("");
    newRow[colUserID] = nip;
    newRow[colUserName] = nama;
    newRow[colPassword] = password;
    newRow[colUserPin] = pin;
    if (colUserUnit !== -1 && unit) {
      newRow[colUserUnit] = unit;
    }

    authSheet.appendRow(newRow);

    return { success: true, message: "Akun berhasil direquest" };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function handleGetKesehatanChartData(payload) {
  const { nama } = payload;
  if (!nama) return { success: false, message: "Nama personil diperlukan" };

  try {
    let sheet = null;
    const spreadsheedIds = [
      SPREADSHEETS.PDKB,
      SPREADSHEETS.AUTH,
      SPREADSHEETS.USERS,
      SPREADSHEETS.BERKAS_PEKERJAAN,
    ];
    for (const ssid of spreadsheedIds) {
      try {
        const ss = SpreadsheetApp.openById(ssid);
        sheet = ss.getSheetByName("DATA CHART");
        if (sheet) break;
      } catch (e) {}
    }

    if (!sheet) {
      return { success: false, message: "Sheet DATA CHART tidak ditemukan" };
    }

    const data = sheet.getDataRange().getValues();
    if (data.length < 15) {
      return { success: false, message: "Data pada sheet DATA CHART tidak lengkap" };
    }

    const headers = data[0];
    const targetName = String(nama).trim().toUpperCase();
    const colIndex = headers.findIndex(h => String(h).trim().toUpperCase() === targetName);

    if (colIndex === -1) {
      return { success: false, message: "Data chart untuk personil tersebut tidak ditemukan" };
    }

    const fisikLabels = [];
    const fisikData = [];
    for (let i = 1; i <= 7; i++) {
      fisikLabels.push(String(data[i][0]).trim());
      fisikData.push(Number(data[i][colIndex]) || 0);
    }

    const mentalLabels = [];
    const mentalData = [];
    for (let i = 8; i <= 14; i++) {
      mentalLabels.push(String(data[i][0]).trim());
      mentalData.push(Number(data[i][colIndex]) || 0);
    }

    return {
      success: true,
      data: {
        fisik: {
          labels: fisikLabels,
          values: fisikData
        },
        mental: {
          labels: mentalLabels,
          values: mentalData
        }
      }
    };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// --- GET LLC LIST ---
function handleGetLlcList() {
  try {
    const llcSSId = "1laMd_noHiogta5tGnAW6PIN51Md2zwMWC6H0vu9u0zA";
    const llcSS = SpreadsheetApp.openById(llcSSId);
    const sheet = llcSS.getSheetByName("LIST LLC");
    
    if (!sheet) {
      return { success: false, message: "Sheet LIST LLC tidak ditemukan" };
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return { success: true, data: [] };
    
    const headers = data[0].map(h => String(h).trim().toUpperCase());
    const rows = data.slice(1);
    
    const result = rows.map((row, rIdx) => {
      let obj = { _rowIndex: rIdx + 2 };
      headers.forEach((header, idx) => {
        if (header) {
          obj[header] = row[idx];
        }
      });
      return obj;
    });
    
    return { success: true, data: result };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// --- UPDATE LLC STATUS ---
function handleUpdateLlcStatus(payload) {
  try {
    const { rowIndex, status } = payload;
    if (!rowIndex) return { success: false, message: "Row index not provided" };
    
    const llcSSId = "1laMd_noHiogta5tGnAW6PIN51Md2zwMWC6H0vu9u0zA";
    const llcSS = SpreadsheetApp.openById(llcSSId);
    const sheet = llcSS.getSheetByName("LIST LLC");
    
    if (!sheet) return { success: false, message: "Sheet LIST LLC tidak ditemukan" };
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const statusColIdx = headers.findIndex(h => h && h.toString().trim().toUpperCase() === "STATUS PEMELIHARAAN");
    
    if (statusColIdx > -1) {
      sheet.getRange(rowIndex, statusColIdx + 1).setValue(status);
      return { success: true, message: "Status LLC diupdate" };
    }
    return { success: false, message: "Kolom STATUS PEMELIHARAAN tidak ditemukan" };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

function uploadEvidenPelaksanaan(payload) {
  var folderId = "1NiuBymtsoIy5_4PzPRbENXEIsVLY_GEV"; // Direktori Track Evidences
  var sheetName = "CL_PELAKSANAAN";
  
  try {
    var folder = DriveApp.getFolderById(folderId);
    var ss = SpreadsheetApp.openById(SPREADSHEETS.WORK_PLAN);
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(["NO WO", "URL Foto Sebelum", "URL Foto Proses 1", "URL Foto Proses 2"]);
    }
    
    var noWo = payload.noWo || "UNKNOWN_WO";
    
    function uploadFoto(base64Data, mimeType, namaFile) {
      if (!base64Data) return "";
      var base64String = base64Data.split(",")[1];
      var blob = Utilities.newBlob(Utilities.base64Decode(base64String), mimeType || "image/jpeg", namaFile);
      var file = folder.createFile(blob);
      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (e) {}
      return "https://lh3.googleusercontent.com/d/" + file.getId();
    }
    
    var urlSebelum = uploadFoto(payload.fotoSebelumBase64, payload.fotoSebelumMime, noWo + "-FOTO SEBELUM");
    var urlProses1 = uploadFoto(payload.fotoProses1Base64, payload.fotoProses1Mime, noWo + "-FOTO PROSES 1");
    var urlProses2 = uploadFoto(payload.fotoProses2Base64, payload.fotoProses2Mime, noWo + "-FOTO PROSES 2");
    
    // Cari baris berdasarkan NO WO (Update jika sudah ada)
    var data = sheet.getDataRange().getValues();
    var foundRowIndex = -1;
    
    // Asumsi baris 1 adalah header (index 0)
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(noWo).trim()) {
        foundRowIndex = i + 1; // getRange menggunakan 1-based index
        break;
      }
    }
    
    if (foundRowIndex !== -1) {
      // Jika ditemukan, perbarui cell HANYA jika ada URL baru yang diunggah
      if (urlSebelum) sheet.getRange(foundRowIndex, 2).setValue(urlSebelum);
      if (urlProses1) sheet.getRange(foundRowIndex, 3).setValue(urlProses1);
      if (urlProses2) sheet.getRange(foundRowIndex, 4).setValue(urlProses2);
    } else {
      // Jika tidak ditemukan, buat baris baru
      var rowData = [
        noWo,
        urlSebelum,
        urlProses1,
        urlProses2
      ];
      sheet.appendRow(rowData);
    }
    
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

/**
 * Handler untuk mengunggah file (PDF / Gambar / Dokumen) ke Google Drive
 * Digunakan oleh modul Warehouse (Export Laporan PDF ke Folder PDKB Recca) maupun modul lainnya.
 */
function handleUploadFileToDrive(payload) {
  try {
    var folderId = payload.folderId || DRIVE_FOLDERS.PDKB_RECCA_EXPORT || "1U_qfbDAqLyttt7rflyi1XIpflktcPDhC";
    var fileName = payload.fileName || ("LAPORAN_GUDANG_PDKB_RECCA_" + Utilities.formatDate(new Date(), "Asia/Makassar", "yyyyMMdd_HHmmss") + ".pdf");
    var mimeType = payload.mimeType || "application/pdf";
    var fileBase64 = payload.fileBase64;

    if (!fileBase64) {
      return {
        success: false,
        error: "Data fileBase64 tidak ditemukan dalam payload"
      };
    }

    // Bersihkan header prefix data:...;base64, jika ada
    var base64Clean = fileBase64;
    if (base64Clean.indexOf(",") > -1) {
      base64Clean = base64Clean.split(",")[1];
    }

    var decodedBytes = Utilities.base64Decode(base64Clean);
    var blob = Utilities.newBlob(decodedBytes, mimeType, fileName);

    var folder = DriveApp.getFolderById(folderId);
    var file = folder.createFile(blob);

    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (shareErr) {
      console.warn("Sharing permission warning: " + shareErr.toString());
    }

    var fileUrl = file.getUrl();
    var downloadUrl = file.getDownloadUrl() || ("https://drive.google.com/uc?id=" + file.getId() + "&export=download");

    return {
      success: true,
      message: "File " + fileName + " berhasil disimpan di Google Drive folder PDKB Recca.",
      fileId: file.getId(),
      fileName: fileName,
      fileUrl: fileUrl,
      downloadUrl: downloadUrl
    };
  } catch (err) {
    return {
      success: false,
      error: "Gagal menyimpan file ke Google Drive: " + err.toString()
    };
  }
}

/**
 * =========================================================================
 * FITUR EKSPORT TEMPLATE WORK ORDER, SP2B & SP3B (SIMPDKB UP3 WATAMPONE)
 * =========================================================================
 */

/**
 * Helper Konversi Angka Bulan ke Romawi (I s/d XII)
 */
function getRomanMonthBackend(monthIndex) {
  var romanMap = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  var m = typeof monthIndex === 'number' ? monthIndex : (new Date().getMonth() + 1);
  var idx = Math.max(1, Math.min(12, m)) - 1;
  return romanMap[idx] || 'IX';
}

/**
 * Mengambil nama pejabat PREPARATOR dan ASMAN untuk pengesahan template
 */
function handleGetExportTemplateData(payload) {
  try {
    var preparatorName = "AKMAL FADIL";
    var asmanName = "BAKHTIAR";
    var asmanBidang = "ASMAN JARINGAN DAN KONSTRUKSI";

    // Cari dari SPREADSHEETS.USERS / AUTH
    var userSheet = null;
    var spreadsheedIds = [SPREADSHEETS.USERS, SPREADSHEETS.AUTH, SPREADSHEETS.PDKB];
    for (var i = 0; i < spreadsheedIds.length; i++) {
      try {
        var ss = SpreadsheetApp.openById(spreadsheedIds[i]);
        userSheet = ss.getSheetByName("Users") || ss.getSheetByName("USERS") || ss.getSheetByName("app_user");
        if (userSheet) break;
      } catch (e) {}
    }

    if (userSheet) {
      var data = userSheet.getDataRange().getValues();
      if (data.length > 1) {
        var headers = data[0].map(function(h) { return String(h).trim().toLowerCase(); });
        var roleIdx = headers.findIndex(function(h) { return h === 'role' || h === 'user_role'; });
        var nameIdx = headers.findIndex(function(h) { return h === 'name' || h === 'user_name' || h === 'nama'; });
        var bidangIdx = headers.findIndex(function(h) { return h === 'bidang' || h === 'user_bidang' || h === 'jabatan'; });

        if (roleIdx !== -1 && nameIdx !== -1) {
          for (var r = 1; r < data.length; r++) {
            var rowRole = String(data[r][roleIdx] || '').trim().toUpperCase();
            var rowName = String(data[r][nameIdx] || '').trim();
            var rowBidang = bidangIdx !== -1 ? String(data[r][bidangIdx] || '').trim() : '';

            if (rowRole === 'PREPARATOR' && rowName) {
              preparatorName = rowName;
            } else if (rowRole === 'ASMAN' && rowName) {
              asmanName = rowName;
              if (rowBidang) asmanBidang = rowBidang;
            }
          }
        }
      }
    }

    return {
      success: true,
      data: {
        preparator: preparatorName,
        asman: asmanName,
        asmanBidang: asmanBidang,
        bulanRomawi: getRomanMonthBackend(),
        tahun: new Date().getFullYear().toString()
      }
    };
  } catch (err) {
    return {
      success: true,
      data: {
        preparator: "AKMAL FADIL",
        asman: "BAKHTIAR",
        asmanBidang: "ASMAN JARINGAN DAN KONSTRUKSI",
        bulanRomawi: getRomanMonthBackend(),
        tahun: new Date().getFullYear().toString()
      }
    };
  }
}

/**
 * Menghitung jumlah personil dengan sertifikat_kompetensi = AKTIF
 * yang berstatus SEHAT atau KURANG SEHAT (eliminasi jika ada salah satu TIDAK SEHAT)
 * pada tanggal == tanggal_direncanakan.
 */
function handleGetPersonilReadyCount(payload) {
  try {
    var targetDate = payload.tanggal_direncanakan || payload.tanggal || "";
    var pdkbSS = null;
    var spreadsheedIds = [SPREADSHEETS.PDKB, SPREADSHEETS.USERS, SPREADSHEETS.BERKAS_PEKERJAAN];
    for (var i = 0; i < spreadsheedIds.length; i++) {
      try {
        var ss = SpreadsheetApp.openById(spreadsheedIds[i]);
        if (ss.getSheetByName("Personil") || ss.getSheetByName("PERSONIL")) {
          pdkbSS = ss;
          break;
        }
      } catch (e) {}
    }

    if (!pdkbSS) pdkbSS = SpreadsheetApp.openById(SPREADSHEETS.PDKB);

    var personilSheet = pdkbSS.getSheetByName("Personil") || pdkbSS.getSheetByName("PERSONIL");
    var logSheet = pdkbSS.getSheetByName("LOG KESEHATAN") || pdkbSS.getSheetByName("Log Kesehatan");

    if (!personilSheet) {
      return { success: false, message: "Sheet Personil tidak ditemukan", count: 0 };
    }

    var pData = personilSheet.getDataRange().getValues();
    var pHeaders = pData[0].map(function(h) { return String(h).trim().toLowerCase(); });
    var statusPdkbIdx = pHeaders.findIndex(function(h) { return h.includes("status") || h.includes("sertifikat"); });
    var pNipIdx = pHeaders.findIndex(function(h) { return h === 'nip'; });
    var pNameIdx = pHeaders.findIndex(function(h) { return h === 'nama' || h === 'name'; });

    // Kumpulkan personil aktif
    var activeMap = {};
    var totalActive = 0;
    for (var r = 1; r < pData.length; r++) {
      var row = pData[r];
      var statusVal = statusPdkbIdx !== -1 ? String(row[statusPdkbIdx] || 'AKTIF').toUpperCase() : 'AKTIF';
      var isAktif = !statusVal.includes('TIDAK') && !statusVal.includes('NON') && !statusVal.includes('PASIF') && !statusVal.includes('MUTASI');
      if (isAktif) {
        var nip = pNipIdx !== -1 ? String(row[pNipIdx]).trim() : '';
        var name = pNameIdx !== -1 ? String(row[pNameIdx]).trim().toLowerCase() : '';
        activeMap[nip] = true;
        if (name) activeMap[name] = true;
        totalActive++;
      }
    }

    var readyCount = 0;
    var checkedPersons = {};

    if (logSheet && targetDate) {
      var lData = logSheet.getDataRange().getValues();
      var lHeaders = lData[0].map(function(h) { return String(h).trim().toLowerCase(); });
      var tglIdx = lHeaders.findIndex(function(h) { return h.includes("tanggal") || h.includes("date"); });
      var nipIdx = lHeaders.findIndex(function(h) { return h === 'nip'; });
      var namaIdx = lHeaders.findIndex(function(h) { return h.includes('nama'); });
      var fisikIdx = lHeaders.findIndex(function(h) { return h.includes('fisik'); });
      var mentalIdx = lHeaders.findIndex(function(h) { return h.includes('mental'); });

      for (var l = 1; l < lData.length; l++) {
        var lRow = lData[l];
        var rowTgl = lRow[tglIdx];
        var formattedRowTgl = "";
        if (rowTgl instanceof Date) {
          formattedRowTgl = Utilities.formatDate(rowTgl, "Asia/Makassar", "dd-MM-yyyy");
        } else {
          formattedRowTgl = String(rowTgl || "").trim();
        }

        if (formattedRowTgl.replace(/[\/\.]/g, '-') === String(targetDate).replace(/[\/\.]/g, '-')) {
          var rowNip = nipIdx !== -1 ? String(lRow[nipIdx]).trim() : '';
          var rowNama = namaIdx !== -1 ? String(lRow[namaIdx]).trim().toLowerCase() : '';
          var pKey = rowNip || rowNama;

          if (pKey && activeMap[pKey] && !checkedPersons[pKey]) {
            checkedPersons[pKey] = true;
            var sf = fisikIdx !== -1 ? String(lRow[fisikIdx] || '').toUpperCase() : '';
            var sm = mentalIdx !== -1 ? String(lRow[mentalIdx] || '').toUpperCase() : '';

            // Syarat: fisik & mental SEHAT / KURANG SEHAT. Jika TIDAK SEHAT maka dieliminasi.
            var fisikOk = sf.includes('SEHAT') && !sf.includes('TIDAK');
            var mentalOk = sm.includes('SEHAT') && !sm.includes('TIDAK');

            if (fisikOk && mentalOk) {
              readyCount++;
            }
          }
        }
      }
    }

    // Jika belum ada log di tanggal tersebut, gunakan baseline personil aktif yang sehat
    if (readyCount === 0 && totalActive > 0) {
      readyCount = totalActive;
    }

    return {
      success: true,
      readyCount: readyCount,
      totalActive: totalActive,
      tanggal: targetDate
    };
  } catch (e) {
    return { success: false, message: e.toString(), readyCount: 8 };
  }
}

/**
 * Export Dokumen Work Order ke Google Drive
 */
function handleExportWorkOrderDocument(payload) {
  try {
    var folderId = payload.folderId || DRIVE_FOLDERS.PDKB_RECCA_EXPORT || "1urqblbRHzJroJ5i8VjCIpb0iDkBrQNF6";
    var inputNoWo = payload.inputNoWo || "001";
    var bulan = payload.bulan || getRomanMonthBackend();
    var tahun = payload.tahun || new Date().getFullYear().toString();
    var fileName = payload.fileName || ("WORK_ORDER_" + inputNoWo + "_" + bulan + "_" + tahun + ".pdf");

    if (payload.fileBase64) {
      return handleUploadFileToDrive({
        folderId: folderId,
        fileName: fileName,
        fileBase64: payload.fileBase64,
        mimeType: "application/pdf"
      });
    }

    return {
      success: true,
      message: "Data Work Order berhasil dipersiapkan untuk penomoran " + inputNoWo,
      headerBaris1: "NO : " + inputNoWo + "/WO/UP3 WATAMPONE.PREP/" + bulan + "/" + tahun,
      headerBaris2: "( " + (payload.tanggalSurvey || Utilities.formatDate(new Date(), "Asia/Makassar", "dd-MM-yyyy")) + " )"
    };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Export Dokumen SP2B & SP3B ke Google Drive
 */
function handleExportSp2bSp3bDocument(payload) {
  try {
    var folderId = payload.folderId || DRIVE_FOLDERS.PDKB_RECCA_EXPORT || "1urqblbRHzJroJ5i8VjCIpb0iDkBrQNF6";
    var docType = payload.docType || "BUNDLE";
    var tgl = payload.tanggal_direncanakan ? String(payload.tanggal_direncanakan).replace(/[\/\-\s]/g, '') : Utilities.formatDate(new Date(), "Asia/Makassar", "yyyyMMdd");
    var fileName = payload.fileName || (docType + "_PDKB_" + tgl + ".pdf");

    if (payload.fileBase64) {
      return handleUploadFileToDrive({
        folderId: folderId,
        fileName: fileName,
        fileBase64: payload.fileBase64,
        mimeType: "application/pdf"
      });
    }

    return {
      success: true,
      message: "Dokumen " + docType + " siap diexport.",
      fileName: fileName
    };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Export Dokumen dari Master Google Docs Template ke PDF di Google Drive
 */
function handleExportFromGoogleDocTemplate(payload) {
  try {
    var docType = payload.docType || "SP2B_SP3B";
    var isWorkOrder = (docType === "WORK_ORDER" || (payload.fileName && String(payload.fileName).indexOf("WORK_ORDER") === 0));

    // Default template master resmi sesuai jenis dokumen
    var defaultTemplateId = isWorkOrder
      ? (DRIVE_FOLDERS.WORK_ORDER_TEMPLATE || "17le09DrRAqCtmdBQWtWqsD-KO-2td3eTSVXn_mg5r_o")
      : (DRIVE_FOLDERS.SP2B_TEMPLATE || "1kdpZFjeu356d-vF16ph9oZhuPKHZAueBdO3mDmr7lso");

    var templateDocId = payload.templateDocId || defaultTemplateId;
    if (!templateDocId) {
      return { success: false, error: "templateDocId wajib disertakan." };
    }

    var folderId = payload.folderId || DRIVE_FOLDERS.PDKB_RECCA_EXPORT || "1urqblbRHzJroJ5i8VjCIpb0iDkBrQNF6";
    var fileName = payload.fileName || ((isWorkOrder ? "WORK_ORDER_" : "SP2B_SP3B_") + Date.now() + ".pdf");
    var replacements = payload.replacements || {};
    var imageReplacements = payload.imageReplacements || {};

    var targetFolder = DriveApp.getFolderById(folderId);
    var templateFile = DriveApp.getFileById(templateDocId);

    // 1. Buat salinan sementara dokumen di target folder
    var tempDocName = "TEMP_" + fileName.replace(/\.pdf$/i, "");
    var copiedFile = templateFile.makeCopy(tempDocName, targetFolder);
    var copiedDocId = copiedFile.getId();
    
    var doc;
    try {
      doc = DocumentApp.openById(copiedDocId);
    } catch (permErr) {
      try { copiedFile.setTrashed(true); } catch (tErr) {}
      return {
        success: false,
        permissionRequired: true,
        error: permErr.toString(),
        message: "Perizinan DocumentApp belum disetujui di Google Apps Script. Diperlukan scope https://www.googleapis.com/auth/documents. Jalankan fungsi authorizeGoogleDocsAndDrive() di script editor untuk memberikan izin."
      };
    }

    var body = doc.getBody();
    var header = doc.getHeader();
    var footer = doc.getFooter();

    // 2. Helper untuk replace text di container (body, header, footer, tables)
    function replaceInContainer(container, key, val) {
      if (!container || !key) return;
      var cleanVal = (val !== null && val !== undefined) ? String(val) : "";
      
      // Escape special regex characters in key
      var escapedKey = key.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
      try {
        container.replaceText(escapedKey, cleanVal);
      } catch (e) {
        try {
          container.replaceText(key, cleanVal);
        } catch (err) {}
      }
    }

    // Replace semua key-value text
    // PENTING: Wajib me-replace variasi {{key}} dan [key] terlebih dahulu agar tanda kurung tidak tertinggal!
    for (var placeholder in replacements) {
      if (replacements.hasOwnProperty(placeholder)) {
        var value = replacements[placeholder];
        var cleanVal = (value !== null && value !== undefined) ? String(value) : "";
        var cleanKey = placeholder.replace(/^[{\[\s]+|[}\]\s]+$/g, "");

        // 1. Prioritas paling utama: Replace {{cleanKey}} beserta kurung kurawal ganda secara utuh
        var doubleCurly = "{{" + cleanKey + "}}";
        replaceInContainer(body, doubleCurly, cleanVal);
        if (header) replaceInContainer(header, doubleCurly, cleanVal);
        if (footer) replaceInContainer(footer, doubleCurly, cleanVal);

        // 2. Replace [cleanKey] beserta kurung siku secara utuh
        var singleBracket = "[" + cleanKey + "]";
        replaceInContainer(body, singleBracket, cleanVal);
        if (header) replaceInContainer(header, singleBracket, cleanVal);
        if (footer) replaceInContainer(footer, singleBracket, cleanVal);

        // 3. Jika placeholder asli memuat kurung kurawal atau siku
        if (placeholder.indexOf("{") !== -1 || placeholder.indexOf("[") !== -1) {
          replaceInContainer(body, placeholder, cleanVal);
          if (header) replaceInContainer(header, placeholder, cleanVal);
          if (footer) replaceInContainer(footer, placeholder, cleanVal);
        }
      }
    }

    // Pembersihan akhir jika ada placeholder kosong yang menyisakan {{}}
    replaceInContainer(body, "{{}}", "");
    replaceInContainer(body, "[]", "");
    if (header) {
      replaceInContainer(header, "{{}}", "");
      replaceInContainer(header, "[]", "");
    }
    if (footer) {
      replaceInContainer(footer, "{{}}", "");
      replaceInContainer(footer, "[]", "");
    }

    // 3. Sisipkan Gambar jika ada (misal foto_temuan, CAPTURE MAP)
    for (var imgPlaceholder in imageReplacements) {
      if (imageReplacements.hasOwnProperty(imgPlaceholder)) {
        var imgData = imageReplacements[imgPlaceholder];
        var cleanImgKey = imgPlaceholder.replace(/^[{\[]+|[}\]]+$/g, "");
        var imgPatterns = [imgPlaceholder, "{{" + cleanImgKey + "}}", "[" + cleanImgKey + "]"];

        if (!imgData) {
          // Jika gambar tidak ada / kosong, hapus placeholder agar dokumen bersih
          imgPatterns.forEach(function(pat) {
            replaceInContainer(body, pat, "");
            if (header) replaceInContainer(header, pat, "");
            if (footer) replaceInContainer(footer, pat, "");
          });
          continue;
        }

        try {
          var imageBlob = null;
          if (typeof imgData === 'string' && imgData.indexOf('data:image') === 0) {
            var base64Content = imgData.split(',')[1];
            var mimeMatch = imgData.match(/data:(image\/[^;]+);/);
            var mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
            imageBlob = Utilities.newBlob(Utilities.base64Decode(base64Content), mime, "inline_image.jpg");
          } else if (typeof imgData === 'string' && (imgData.indexOf('http://') === 0 || imgData.indexOf('https://') === 0)) {
            // Jika Google Drive URL
            var directUrl = imgData;
            if (imgData.indexOf('drive.google.com') !== -1 || imgData.indexOf('docs.google.com') !== -1) {
              var dMatch = imgData.match(/id=([a-zA-Z0-9_-]+)/) || imgData.match(/\/d\/([a-zA-Z0-9_-]+)/);
              if (dMatch && dMatch[1]) {
                try {
                  imageBlob = DriveApp.getFileById(dMatch[1]).getBlob();
                } catch (dErr) {
                  directUrl = "https://drive.google.com/uc?export=download&id=" + dMatch[1];
                }
              }
            }
            if (!imageBlob) {
              imageBlob = UrlFetchApp.fetch(directUrl).getBlob();
            }
          }

          if (imageBlob) {
            for (var pIdx = 0; pIdx < imgPatterns.length; pIdx++) {
              var pat = imgPatterns[pIdx];
              var foundElement = body.findText(pat.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"));
              if (foundElement) {
                var el = foundElement.getElement();
                var parent = el.getParent();
                
                if (parent.getType() === DocumentApp.ElementType.PARAGRAPH) {
                  var paragraph = parent.asParagraph();
                  var inlineImg = paragraph.appendInlineImage(imageBlob);
                  var origW = inlineImg.getWidth();
                  var origH = inlineImg.getHeight();
                  if (origW > 0 && origH > 0) {
                    var maxW = 240;
                    var maxH = 170;
                    var ratio = Math.min(maxW / origW, maxH / origH, 1);
                    inlineImg.setWidth(Math.round(origW * ratio));
                    inlineImg.setHeight(Math.round(origH * ratio));
                  }
                  paragraph.replaceText(pat.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"), "");
                  break;
                }
              }
            }
          }
        } catch (imgErr) {
          console.error("Gagal menyisipkan gambar untuk " + imgPlaceholder + ": " + imgErr.toString());
        }
      }
    }

    // Simpan dokumen
    doc.saveAndClose();

    // 4. Konversi salinan Google Doc menjadi PDF langsung oleh Google Docs engine
    var pdfBlob = copiedFile.getAs("application/pdf").setName(fileName);
    var pdfFile = targetFolder.createFile(pdfBlob);
    try {
      pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (shareErr) {}

    // Hapus draft dokumen sementara
    try {
      copiedFile.setTrashed(true);
    } catch (trashErr) {}

    var pdfUrl = pdfFile.getUrl();
    var pdfId = pdfFile.getId();
    var downloadUrl = "https://drive.google.com/uc?export=download&id=" + pdfId;
    var pdfBytes = pdfBlob.getBytes();
    var pdfBase64 = Utilities.base64Encode(pdfBytes);

    return {
      success: true,
      message: "Dokumen PDF berhasil digenerate dari Google Docs Template resmi dan disimpan ke Google Drive.",
      fileId: pdfId,
      fileName: fileName,
      fileUrl: pdfUrl,
      downloadUrl: downloadUrl,
      pdfBase64: pdfBase64,
      folderId: folderId,
      driveFolderUrl: "https://drive.google.com/drive/folders/" + folderId + "?usp=sharing"
    };

  } catch (e) {
    console.error("handleExportFromGoogleDocTemplate error:", e);
    return {
      success: false,
      error: e.toString()
    };
  }
}

/**
 * Jalankan fungsi ini sekali di Google Apps Script Editor untuk mengotorisasi izin Google Docs & Google Drive:
 * 1. Buka Apps Script Editor
 * 2. Pilih fungsi 'authorizeGoogleDocsAndDrive' pada dropdown fungsi di toolbar atas
 * 3. Klik 'Jalankan' (Run)
 * PENTING: Jangan gunakan try-catch agar Google Apps Script memicu dialog otorisasi (Review Permissions)
 */
function authorizeGoogleDocsAndDrive() {
  // Panggil DocumentApp secara langsung tanpa try-catch agar Google menampilkan pop-up OAuth
  var doc = DocumentApp.openById("1kdpZFjeu356d-vF16ph9oZhuPKHZAueBdO3mDmr7lso");
  Logger.log("BERHASIL! Google Docs template terotorisasi: " + doc.getName());
}


