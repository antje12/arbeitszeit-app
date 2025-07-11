let startZeit, endZeit;
let deferredPrompt;
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const speichernBtn = document.getElementById("speichernBtn");
const installBtn = document.getElementById("installBtn");
const begruessung = document.getElementById("begruessung");
const zeitAnzeige = document.getElementById("zeitAnzeige");
const modusBtn = document.getElementById("modusBtn");
const logTabelle = document.getElementById("logTabelle");
const logBody = document.getElementById("logBody");
const kontingentAnzeige = document.getElementById("kontingentAnzeige");
const SPEICHER = "arbeitszeit_logs";

const MAX_STUNDEN = 96;

function isInApp() {
  return window.matchMedia('(display-mode: standalone)').matches
         || window.navigator.standalone === true;
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

startBtn.addEventListener("click", () => {
  startZeit = new Date();
  updateAnzeige();
  startBtn.disabled = true;
  stopBtn.disabled = false;
});

stopBtn.addEventListener("click", () => {
  endZeit = new Date();
  updateAnzeige();
  stopBtn.disabled = true;
  speichernBtn.disabled = false;
});

speichernBtn.addEventListener("click", () => {
  const checked = [...document.querySelectorAll("#checkboxContainer input:checked")];
  const aufgaben = checked.map(cb => cb.value).join(", ") || "–";
  const dauer = berechneDauer(startZeit, endZeit);
  const datum = startZeit.toLocaleDateString();
  const startStr = startZeit.toLocaleTimeString();
  const endStr = endZeit.toLocaleTimeString();
  const eintrag = { datum, start: startStr, stop: endStr, dauer, aufgaben };
  let logs = JSON.parse(localStorage.getItem(SPEICHER) || "[]");
  logs.push(eintrag);
  localStorage.setItem(SPEICHER, JSON.stringify(logs));
  speichernBtn.disabled = true;
  startBtn.disabled = false;
  zeitAnzeige.textContent = "Startzeit: --:-- | Endzeit: --:-- | Dauer: 0 h 0 m";
  aktualisiereKontingent();
});

modusBtn.addEventListener("click", () => {
  let logs = JSON.parse(localStorage.getItem(SPEICHER) || "[]");
  logBody.innerHTML = "";
  if (logs.length === 0) return alert("Noch keine Einträge vorhanden.");
  logs.forEach((e, i) => {
    const row = document.createElement("tr");
    ["datum","start","stop","dauer"].forEach(k => {
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

function updateAnzeige() {
  const s = startZeit ? startZeit.toLocaleTimeString() : "--:--";
  const e = endZeit ? endZeit.toLocaleTimeString() : "--:--";
  const d = (startZeit && endZeit) ? berechneDauer(startZeit, endZeit) : "0 h 0 m";
  zeitAnzeige.textContent = `Startzeit: ${s} | Endzeit: ${e} | Dauer: ${d}`;
}

function berechneDauer(a, b) {
  const diff = Math.max(0, Math.floor((b - a) / 1000));
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return `${h} h ${m} m`;
}

function berechneGesamtzeit(logs) {
  let totalSek = 0;
  logs.forEach(e => {
    const parts = e.dauer.match(/(\d+) h (\d+) m/);
    if (parts) {
      const h = parseInt(parts[1], 10);
      const m = parseInt(parts[2], 10);
      totalSek += h * 3600 + m * 60;
    }
  });
  return totalSek;
}

function aktualisiereKontingent() {
  const logs = JSON.parse(localStorage.getItem(SPEICHER) || "[]");
  const gesamtSek = berechneGesamtzeit(logs);
  const verbleibSek = Math.max(0, MAX_STUNDEN * 3600 - gesamtSek);
  const h = Math.floor(verbleibSek / 3600);
  const m = Math.floor((verbleibSek % 3600) / 60);
  kontingentAnzeige.textContent = `🧮 Verbleibendes Kontingent: ${h} h ${m} m von ${MAX_STUNDEN} h`;
}

aktualisiereKontingent();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(() => console.log("✅ Service Worker registriert"))
    .catch(e => console.error("❌ SW-Fehler:", e));
}
