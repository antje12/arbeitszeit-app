let startZeit, endZeit, benachrichtigungsIntervall, deferredPrompt;

const $ = id => document.getElementById(id);
const startBtn = $("startBtn");
const stopBtn = $("stopBtn");
const speichernBtn = $("speichernBtn");
const installBtn = $("installBtn");
const begruessung = $("begruessung");
const zeitAnzeige = $("zeitAnzeige");
const modusBtn = $("modusBtn");
const logTabelle = $("logTabelle");
const logBody = $("logBody");
const pingSound = $("pingSound");

const SPEICHER = "arbeitszeit_logs";

if (!window.matchMedia('(display-mode: standalone)').matches) {
  begruessung.classList.remove("hidden");
  installBtn.classList.remove("hidden");
}

window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.classList.remove("hidden");
});

installBtn.addEventListener("click", () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(() => {
    begruessung.classList.add("hidden");
    installBtn.classList.add("hidden");
  });
});

startBtn.addEventListener("click", () => {
  startZeit = new Date();
  updateAnzeige();
  startBtn.disabled = true;
  stopBtn.disabled = false;
  Notification.requestPermission();
  benachrichtigungsIntervall = setInterval(() => {
    if (Notification.permission === "granted") {
      new Notification("⏰ Erinnerung: Bitte Pause einlegen!");
      pingSound.play();
    }
  }, 15 * 60 * 1000);
});

stopBtn.addEventListener("click", () => {
  endZeit = new Date();
  updateAnzeige();
  stopBtn.disabled = true;
  speichernBtn.disabled = false;
  clearInterval(benachrichtigungsIntervall);
  pingSound.pause();
  pingSound.currentTime = 0;
  speichernBtn.click();
});

speichernBtn.addEventListener("click", () => {
  const checked = [...document.querySelectorAll("#checkboxContainer input:checked")];
  const aufgaben = checked.map(cb => cb.value).join(", ") || "–";
  const dauer = berechneDauer(startZeit, endZeit);
  const eintrag = {
    datum: startZeit.toLocaleDateString(),
    start: startZeit.toLocaleTimeString(),
    stop: endZeit.toLocaleTimeString(),
    dauer,
    aufgaben
  };

  const logs = JSON.parse(localStorage.getItem(SPEICHER) || "[]");
  logs.push(eintrag);
  localStorage.setItem(SPEICHER, JSON.stringify(logs));

  speichernBtn.disabled = true;
  startBtn.disabled = false;
  zeitAnzeige.textContent = "Startzeit: --:-- | Endzeit: --:-- | Dauer: 0 h 0 m";
});

modusBtn.addEventListener("click", () => {
  const logs = JSON.parse(localStorage.getItem(SPEICHER) || "[]");
  logBody.innerHTML = "";
  if (logs.length === 0) return alert("Noch keine Einträge vorhanden.");
  logs.forEach(e => {
    const row = document.createElement("tr");
    ["datum", "start", "stop", "dauer"].forEach(key => {
      const td = document.createElement("td");
      td.textContent = e[key];
      row.appendChild(td);
    });
    const tdBtn = document.createElement("td");
    const btn = document.createElement("button");
    btn.textContent = "Details";
    btn.onclick = () => alert(`Aufgaben:\n${e.aufgaben}`);
    tdBtn.appendChild(btn);
    row.appendChild(tdBtn);
    logBody.appendChild(row);
  });
  logTabelle.classList.remove("hidden");
});

function updateAnzeige() {
  const s = startZeit ? startZeit.toLocaleTimeString() : "--:--";
  const e = endZeit ? endZeit.toLocaleTimeString() : "--:--";
  const d = (startZeit && endZeit) ? berechneDauer(startZeit, endZeit) : "0 h 0 m";
  zeitAnzeige.textContent = `Startzeit: ${s} | Endzeit: ${e} | Dauer: ${d}`;
}

function berechneDauer(a, b) {
  const ms = Math.max(0, b - a);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h} h ${m} m`;
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register("service-worker.js")
    .then(() => console.log("✅ Service Worker registriert"))
    .catch(err => console.error("❌ Fehler beim Registrieren:", err));
}
