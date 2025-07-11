let startZeit = null, endZeit = null;
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
const SPEICHER = "arbeitszeit_logs";
const START_KEY = "aktive_startzeit";
const MAX_STUNDEN = 96;

function isInApp() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
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
  const gespeicherterStart = localStorage.getItem(START_KEY);
  if (gespeicherterStart) {
    startZeit = new Date(gespeicherterStart);
    updateAnzeige();
    startBtn.disabled = true;
    stopBtn.disabled = false;
  }
});

startBtn.addEventListener("click", () => {
  startZeit = new Date();
  localStorage.setItem(START_KEY, startZeit.toISOString());
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

  startZeit = endZeit = null;
  localStorage.removeItem(START_KEY);
  updateAnzeige();
  speichernBtn.disabled = true;
  startBtn.disabled = false;
});

modusBtn.addEventListener("click", () => {
  let logs = JSON.parse(localStorage.getItem(SPEICHER) || "[]");
  logBody.innerHTML = "";

  if (logs.length === 0) return alert("Noch keine Einträge vorhanden.");

  const infoDiv = document.getElementById("stundenInfo") || document.createElement("div");
  infoDiv.id = "stundenInfo";
  infoDiv.style.marginBottom = "10px";
  infoDiv.style.color = "#ffc107";
  infoDiv.style.fontSize = "16px";

  const gesamtMinuten = logs.reduce((sum, e) => {
    const [h, m] = e.dauer.split(" ").filter(x => x !== "h" && x !== "m").map(Number);
    return sum + h * 60 + m;
  }, 0);

  const maxMinuten = MAX_STUNDEN * 60;
  const verbleibend = Math.max(0, maxMinuten - gesamtMinuten);
  const vH = Math.floor(verbleibend / 60);
  const vM = verbleibend % 60;

  infoDiv.textContent = `Verbleibend: ${vH} h ${vM} m von ${MAX_STUNDEN} h 0 m`;
  logTabelle.insertBefore(infoDiv, logTabelle.children[1]);

  logs.forEach((e, i) => {
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

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(() => console.log("✅ Service Worker registriert"))
    .catch(e => console.error("❌ SW-Fehler:", e));
}
