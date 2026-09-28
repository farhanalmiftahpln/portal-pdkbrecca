async function test() {
  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbyMgRYz-vXFJufqJFbtyTfZ18md1thRasFNBdWEZq3B67eDF-OxEp_Kcqoah7Upemg/exec', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        action: 'getWorkOrders',
        payload: { },
      }),
    });
    
    // Sometimes getWorkOrders returns {success:true, data: [...]}
    // Let's parse the raw text first
    const text = await response.text();
    console.log("RAW TEXT:", text);
  } catch (e) {
    console.error(e);
  }
}

test();
