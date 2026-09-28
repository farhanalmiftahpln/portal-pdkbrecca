const reviewedWOs = [
  {
    "noWo": 1369,
    "approvalPreparator": "Layak",
    "ketPreparator": "",
    "tanggalRencanakan": "2026-07-14T16:00:00.000Z"
  },
  {
    "noWo": 1368,
    "approvalPreparator": "Menunggu Approval",
    "ketPreparator": "",
    "tanggalRencanakan": ""
  }
];
const dateFilter = "2026-07-15"; // let's say they want to match 1369

const filtered = reviewedWOs.filter(wo => {
    const tglStr = String(wo.tanggalRencanakan || '');
    let matched = false;
    if (tglStr) {
        const d = new Date(tglStr);
        if (!isNaN(d.getTime())) {
            // we simulate Indonesian timezone here for the test:
            // let's just use string slicing from the raw T string!
            // Wait, tglStr is 2026-07-14T16:00:00.000Z
        }
    }
});
console.log("OK");
