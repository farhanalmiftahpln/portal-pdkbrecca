async function test() {
  const payload = {
    sheetName: "MATERIAL",
    updates: {
      "NO": "999",
      "KODE": "MTR-UNKNOWN",
      "NAMA MATERIAL": "Unknown",
      "gudangMasuk": 0,
      "gudangKeluar": 5,
      "gudangKet": "Dipakai",
      "mobilKeluar": 0,
      "mobilKet": ""
    },
    isNew: false,
    rowIndex: 999999, // likely invalid
    fotoBase64: null,
    fotoName: null
  };
  
  const res = await fetch("https://script.google.com/macros/s/AKfycbx_TinZ9UQ5_3U4Vmcd-sO509PztlKW5r8Ugt-cJZV6Eu6erYYwwkn2xXs_8z_XTDo6/exec", {
    method: 'POST',
    body: JSON.stringify({ action: "updateWarehouseData", payload }),
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }
  });
  
  const text = await res.text();
  console.log(text);
}

test();
