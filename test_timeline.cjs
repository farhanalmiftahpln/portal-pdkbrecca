const timeline = (trackingData) => {
  const stepsDef = [
    { id: "MENUJU LOKASI", column: "START", labelEnd: "Menuju Lokasi" },
    { id: "TIBA DI LOKASI", column: "START", labelEnd: "Tiba di Lokasi" },
    { id: "GELAR PERALATAN & BRIEFING", column: "PERSIAPAN", labelEnd: "Gelar Peralatan & Briefing" },
    { id: "SIAP DIMULAI", column: "PERSIAPAN", labelEnd: "Siap Dimulai" },
    { id: "PEKERJAAN DILAKSANAKAN", column: "PELAKSANAAN", labelEnd: "Pekerjaan dilaksanakan" },
    { id: "PEKERJAAN SELESAI", column: "PELAKSANAAN", labelEnd: "Pekerjaan Selesai" }
  ];

  const valStart = (trackingData["START"] || "").toUpperCase();
  const valPers = (trackingData["PERSIAPAN"] || "").toUpperCase();
  const valPelak = (trackingData["PELAKSANAAN"] || "").toUpperCase();
  const valClosing = (trackingData["CLOSING"] || "").toUpperCase();

  let currentIndex = -1;
  if (valClosing === "SELESAI" || valPelak.includes("SELESAI") || valPelak.includes("DIHENTIKAN") || valPelak.includes("AMBIL ALIH")) {
    currentIndex = 5;
    if (valPelak.includes("DIHENTIKAN")) stepsDef[5].labelEnd = "Pekerjaan Dihentikan";
    if (valPelak.includes("AMBIL ALIH")) stepsDef[5].labelEnd = "Pekerjaan Diambil Alih";
  } else if (valPelak.includes("DILAKSANAKAN")) {
    currentIndex = 4;
  } else if (valPers.includes("SIAP DIMULAI")) {
    currentIndex = 3;
  } else if (valPers.includes("GELAR") || valPers.includes("BRIEFING")) {
    currentIndex = 2;
  } else if (valStart.includes("TIBA")) {
    currentIndex = 1;
  } else if (valStart.includes("MENUJU")) {
    currentIndex = 0;
  }

  let finalTimeline = [];

  for (let i = 0; i < stepsDef.length; i++) {
    const def = stepsDef[i];
    let state = "pending";
    if (i < currentIndex) state = "completed";
    if (i === currentIndex) {
      if (i === 5) state = "completed";
      else state = "active";
    }

    let tsTime = trackingData[`TS_${def.labelEnd.toUpperCase()}`];
    
    // For backfill, sometimes if a later step is active, the earlier step might not have a TS. We just leave it empty.
    
    finalTimeline.push({
      status: def.labelEnd,
      state: state,
      tanggal: tsTime,
      keterangan: (state !== "pending") ? (trackingData[`Keterangan ${def.column}`] || "") : "",
      foto: null
    });
  }
  
  return finalTimeline;
}

console.log(timeline({"START": "MENUJU LOKASI", "TS_MENUJU LOKASI": "12:00"}));
console.log(timeline({"START": "TIBA DI LOKASI", "TS_MENUJU LOKASI": "12:00", "TS_TIBA DI LOKASI": "12:10"}));
