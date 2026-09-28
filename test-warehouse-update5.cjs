async function test() {
  const payload = {
    sheetName: "MATERIAL",
    updates: {
      "NO": "1",
      "KODE": "MTR-1",
      "NAMA - JENIS": "Live Line Connector, 35-70",
      "MERK": "",
      "STOK GUDANG": "94",
      "STOK MOBIL": "-31",
      "TOTAL STOK": "63",
      "gudangMasuk": 0,
      "gudangKeluar": 5,
      "gudangKet": "Dipakai",
      "mobilKeluar": 0,
      "mobilKet": ""
    },
    isNew: false,
    rowIndex: 2,
    fotoBase64: null,
    fotoName: null
  };
  
  const res = await fetch("https://script.google.com/macros/s/AKfycbx_TinZ9UQ5_3U4Vmcd-sO509PztlKW5r8Ugt-cJZV6Eu6erYYwwkn2xXs_8z_XTDo6/exec", {
    method: 'POST',
    body: JSON.stringify({ action: "updateWarehouseData", payload }),
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }
  });
  
  const text = await res.json();
  console.log(text);
}

test();
