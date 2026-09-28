async function run() {
  const payload = {
    action: "updateTracking",
    payload: {
      noWo: "1237", // random from the sheet provided: 1237
      stepName: "PELAKSANAAN",
      stepValue: "Pekerjaan dilaksanakan", // or something similar
      keterangan: "test",
      fotoSebelumBase64: "dGVzdA==", // base64 for "test"
      fotoSebelumName: "test.jpg",
      fotoProses1Base64: "dGVzdDI=",
      fotoProses1Name: "test2.jpg",
      fotoProses2Base64: "dGVzdDM=",
      fotoProses2Name: "test3.jpg"
    }
  };

  const response = await fetch("https://script.google.com/macros/s/AKfycbx_TinZ9UQ5_3U4Vmcd-sO509PztlKW5r8Ugt-cJZV6Eu6erYYwwkn2xXs_8z_XTDo6/exec", {
    method: "POST",
    redirect: "follow",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  console.log("RESPONSE:", text);
}

run();
