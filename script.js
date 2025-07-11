let startZeit = null;
let endZeit = null;
let verbleibend = parseInt(localStorage.getItem("stundenVerbleibend")) || 96;
const SPEICHER = "arbeitszeit_logs";

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const speichernBtn = document.getElementById("speichernBtn");
const installBtn = document.getElementById("installBtn");
const begruessung = document.getElementById("begruessung");
const zeitAnzeige = document.getElementById("zeitAnzeige");
const modusBtn = document.getElementById("modusBtn");
const logTabelle = document.getElementById("logTabelle");
const logBody = document.getElementById("logBody");

let deferredPrompt;

function isInApp() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
}

if (!isInApp()) {
  begruessung.style.display = "block";
  installBtn.style.display = "inline-block";
}

installBtn.addEventListener("click", () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(() => {
    begruessung.style.display = installBtn.style.display = "none";
  });
});

window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = "inline-block";
});

window.addEventListener("load", () => {
  zeigeVerbleibend();
  if (localStorage.getItem("startzeit_temp")) {
    startZeit = new Date(localStorage.getItem("startzeit_temp"));
    startBtn.disabled = true;
    stopBtn.disabled = false;
    updateAnzeige();
  }
});

startBtn.addEventListener("click", () => {
  startZeit = new Date();
  localStorage.setItem("startzeit_temp", startZeit.toISOString());
  updateAnzeige();
  startBtn.disabled = true;
  stopBtn.disabled = false;
});

stopBtn.addEventListener("click", () => {
  endZeit = new Date();
  localStorage.removeItem("startzeit_temp");
  updateAnzeige();
  speichernBtn.disabled = false;
  stopBtn.disabled = true;
  speichernBtn.click();
});

speichernBtn.addEventListener("click", () => {
  if (!startZeit || !endZeit) return;

  const checked = [...document.querySelectorAll("#checkboxContainer input:checked")];
  const aufgaben = checked.map(cb => cb.value).join(", ") || "–";
  const dauerSek = Math.max(0, Math.floor((endZeit - startZeit) / 1000));
  const dauer = berechneDauer(dauerSek);
  const dauerInStunden = dauerSek / 3600;

  const datum = startZeit.toLocaleDateString();
  const startStr = startZeit.toLocaleTimeString();
  const endStr = endZeit.toLocaleTimeString();
  const eintrag = { datum, start: startStr, stop: endStr, dauer, aufgaben };

  let logs = JSON.parse(localStorage.getItem(SPEICHER) || "[]");
  logs.push(eintrag);
  localStorage.setItem(SPEICHER, JSON.stringify(logs));

  verbleibend -= dauerInStunden;
  verbleibend = Math.max(0, Math.round(verbleibend * 100) / 100);
  localStorage.setItem("stundenVerbleibend", verbleibend);

  if (verbleibend <= 0) {
    alert("🎉 Die 96 Stunden sind aufgebraucht. Alle Protokolle werden zurückgesetzt.");
    localStorage.removeItem(SPEICHER);
    localStorage.removeItem("stundenVerbleibend");
    verbleibend = 96;
  }

  startZeit = endZeit = null;
  speichernBtn.disabled = true;
  startBtn.disabled = false;
  zeitAnzeige.textContent = "Startzeit: --:-- | Endzeit: --:-- | Dauer: 0 h 0 m";
  zeigeVerbleibend();
  document.querySelectorAll("#checkboxContainer input").forEach(cb => cb.checked = false);
});

modusBtn.addEventListener("click", () => {
  let logs = JSON.parse(localStorage.getItem(SPEICHER) || "[]");
  logBody.innerHTML = "";
  if (logs.length === 0) return alert("Noch keine Einträge vorhanden.");

  logs.forEach(e => {
    const row = document.createElement("tr");
    ["datum", "start", "stop", "dauer"].forEach(k => {
      const td = document.createElement("td");
      td.textContent = e[k];
      row.appendChild(td);
    });
    const btn = document.createElement("button");
    btn.textContent = "Details";
    btn.className = "detailsBtn";
    btn.onclick = () => alert(`Aufgaben:\n${e.aufgaben}`);
    const tdBtn = document.createElement("td");
    tdBtn.appendChild(btn);
    row.appendChild(tdBtn);
    logBody.appendChild(row);
  });

  logTabelle.style.display = "block";
});

function berechneDauer(diff) {
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return `${h} h ${m} m`;
}

function updateAnzeige() {
  const s = startZeit ? startZeit.toLocaleTimeString() : "--:--";
  const e = endZeit ? endZeit.toLocaleTimeString() : "--:--";
  const d = (startZeit && endZeit) ? berechneDauer(Math.floor((endZeit - startZeit) / 1000)) : "0 h 0 m";
  zeitAnzeige.textContent = `Startzeit: ${s} | Endzeit: ${e} | Dauer: ${d}`;
}

function zeigeVerbleibend() {
  const zeile = document.createElement("div");
  zeile.textContent = `⏳ Verbleibende Stunden: ${verbleibend.toFixed(2)} h`;
  zeile.style.color = verbleibend <= 10 ? "#ff5252" : "#00e676";
  zeile.style.marginTop = "10px";
  zeile.style.fontSize = "16px";
  zeile.style.fontWeight = "bold";
  zeile.style.textAlign = "center";

  const alte = document.getElementById("verbleibendBox");
  if (alte) alte.remove();
  zeile.id = "verbleibendBox";
  document.body.insertBefore(zeile, document.querySelector(".aufgabenliste"));
}

// Service Worker bleibt unverändert
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(() => console.log("✅ Service Worker registriert"))
    .catch(e => console.error("❌ SW-Fehler:", e));
}
