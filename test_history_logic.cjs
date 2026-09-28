const val = "Tiba di Lokasi";
const step = "START";

// Logic:
const history = [];

if (step === "START") {
  if (val.toUpperCase() === "MENUJU LOKASI") {
    history.push({ status: "Menuju Lokasi", timeKey: "START_START_TIME" });
  } else if (val.toUpperCase() === "TIBA DI LOKASI") {
    history.push({ status: "Menuju Lokasi", timeKey: "START_START_TIME" });
    history.push({ status: "Tiba di Lokasi", timeKey: "START_END_TIME" });
  } else if (val.toUpperCase() !== "WAITING" && val.trim() !== "") {
    history.push({ status: val, timeKey: "START_START_TIME" });
  }
}
console.log(history);
