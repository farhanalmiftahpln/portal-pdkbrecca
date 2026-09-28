function processTest() {
  const presentationId = '1AuCEqo5mcNWTGgOQnHki-8lyScSfRPHaNJE9_QR29jU';
  try {
    const p = SlidesApp.openById(presentationId);
    console.log("Success open");
  } catch(e) {
    console.error(e);
  }
}
processTest();
