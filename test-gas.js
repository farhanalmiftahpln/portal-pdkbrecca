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
    
    // Check if the response was a redirect (Apps Script often redirects to a random URL for the output)
    // fetch handles redirects automatically
    
    const text = await response.text();
    console.log("RESPONSE:", text);
  } catch (e) {
    console.error(e);
  }
}

test();
