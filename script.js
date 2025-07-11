let startZeit, endZeit;
let deferredPrompt = null;

const startBtn     = document.getElementById("startBtn");
const stopBtn      = document.getElementById("stopBtn");
const speichernBtn = document.getElementById("speichernBtn");
const zeitAnzeige  = document.getElementById("zeitAnzeige");
const installBtn   = document.getElementById("installBtn");
const begruessung  = document.getElementById("begruessung");

// Hilfsfunktion: Erkennen, ob wir als installierte App laufen
function isInApp() {
  return window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
}

// Nur im Browser anzeigen: Begrüßung & Install‑Button
if (!isInApp()) {
  begruessung.style.display = "block";
  installBtn.style.display  = "inline-block";
}

// Start-Logik
startBtn.addEventListener("click", () => {
  startZeit = new Date();
  updateAnzeige();
  startBtn.disabled = true;
  stopBtn.disabled  = false;
});

// Stop-Logik
stopBtn.addEventListener("click", () => {
  endZeit = new Date();
  updateAnzeige();
  stopBtn.disabled      = true;
  speichernBtn.disabled = false;
});

// Speichern als Textdatei
speichernBtn.addEventListener("click", () => {
  const checked = document.querySelectorAll("#checkboxContainer input:checked");
  const aufgaben = Array.from(checked).map(cb => cb.value).join(", ");
  const dauer   = berechneDauer(startZeit, endZeit);
  const datum   = startZeit.toLocaleDateString();
  const startStr= startZeit.toLocaleTimeString();
  const endStr  = endZeit.toLocaleTimeString();

  const zeile = `${datum} | ${startStr} | ${endStr} | ${dauer} | ${aufgaben}\n`;
  const blob  = new Blob([zeile], { type: "text/plain;charset=utf-8" });
  const link  = document.createElement("a");
  link.href   = URL.createObjectURL(blob);
  link.download = "arbeitszeit.txt";
  link.click();

  // Zurücksetzen
  speichernBtn.disabled = true;
  startBtn.disabled     = false;
  zeitAnzeige.textContent = "Startzeit: --:-- | Endzeit: --:-- | Dauer: 0 h 0 m";
});

// Anzeige updaten
function updateAnzeige() {
  const startStr = startZeit ? startZeit.toLocaleTimeString() : "--:--";
  const endStr   = endZeit   ? endZeit.toLocaleTimeString()   : "--:--";
  const dauer    = (startZeit && endZeit) ? berechneDauer(startZeit, endZeit) : "0 h 0 m";
  zeitAnzeige.textContent = `Startzeit: ${startStr} | Endzeit: ${endStr} | Dauer: ${dauer}`;
}

// Dauer berechnen
function berechneDauer(start, end) {
  const diff = Math.max(0, Math.floor((end - start) / 1000));
  const h    = Math.floor(diff / 3600);
  const m    = Math.floor((diff % 3600) / 60);
  return `${h} h ${m} m`;
}

// PWA: beforeinstallprompt abfangen
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = "inline-block";
});

// Install-Button → PC/Mobil installieren
installBtn.addEventListener("click", () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(() => {
    // Nach Installation: Alles ausblenden
    begruessung.style.display = "none";
    installBtn.style.display  = "none";
  });
});

// Service Worker registrieren
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(() => console.log("✅ Service Worker registriert"))
    .catch(e => console.error("❌ SW-Fehler:", e));
}
