async function test() {
  const dummyBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8A1j//2Q==";

  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbyMgRYz-vXFJufqJFbtyTfZ18md1thRasFNBdWEZq3B67eDF-OxEp_Kcqoah7Upemg/exec', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        action: 'submitWorkOrder',
        payload: {
          surveyor: 'Test Upload Drive',
          ulp: 'Test',
          garduInduk: 'Test GI',
          penyulang: 'Test Penyulang',
          segmen: 'Test',
          temuan: 'Testing FOTO TEMUAN upload.',
          alamat: 'Test',
          koordinat: '-5, 119',
          skalaPrioritas: '1',
          fotoBase64: dummyBase64
        },
      }),
    });
    
    const text = await response.text();
    console.log("RESPONSE:", text);
  } catch (e) {
    console.error(e);
  }
}

test();
