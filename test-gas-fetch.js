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
    
    const json = await response.json();
    if (json.data && json.data.length > 0) {
       console.log("Latest WO:", json.data[0]);
    } else {
       console.log(json);
    }
  } catch (e) {
    console.error(e);
  }
}

test();
