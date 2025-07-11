// Konstanten & Variablen
let startZeit, endZeit, erinnerungsTimer;
const MONATSZIEL_STUNDEN = 96;
let daten = JSON.parse(localStorage.getItem("arbeitszeitDaten") || "[]");

// DOM-Elemente
const startBtn     = document.getElementById("startBtn");
const stopBtn      = document.getElementById("stopBtn");
const speichernBtn = document.getElementById("speichernBtn");
const zeitAnzeige  = document.getElementById("zeitAnzeige");
const installBtn   = document.getElementById("installBtn");
const begruessung  = document.getElementById("begruessung");
const modusBtn     = document.getElementById("modusBtn");
const auswertung   = document.getElementById("auswertung");
const tabelleBody  = document.querySelector("#ergebnisTabelle tbody");
const offeneAnzeige = document.getElementById("offeneStundenAnzeige");
const alarmAudio   = document.getElementById("alarmTon");

// Modus (true = Erfassung, false = Auswertung)
let imErfassungsModus = true;

// Begrüßung & Install-Button nur im Browser
if (!isInApp()) {
  begruessung.style.display = "block";
  installBtn.style.display  = "inline-block";
}

// Starten
startBtn.addEventListener("click", () => {
  startZeit = new Date();
  updateAnzeige();
  startBtn.disabled = true;
  stopBtn.disabled  = false;
  erinnerungsTimer = setInterval(() => {
    alarmAudio.play();
    notify("⏱ Erinnerung", "Du arbeitest seit 15 Minuten.");
  }, 15 * 60 * 1000);
});

// Stoppen
stopBtn.addEventListener("click", () => {
  endZeit = new Date();
  updateAnzeige();
  stopBtn.disabled = true;
  speichernBtn.disabled = false;
  clearInterval(erinnerungsTimer);
  speichernAutomatisch();
});

// Speichern per Button (optional)
speichernBtn.addEventListener("click", speichernAutomatisch);

// Modus wechseln
modusBtn.addEventListener("click", () => {
  imErfassungsModus = !imErfassungsModus;
  auswertung.style.display = imErfassungsModus ? "none" : "block";
});

// Automatisch speichern
function speichernAutomatisch() {
  const checked = document.querySelectorAll("#checkboxContainer input:checked");
  const aufgaben = Array.from(checked).map(cb => cb.value).join(", ");
  const dauer = berechneDauer(startZeit, endZeit);
  const datum = startZeit.toLocaleDateString();
  const startStr = startZeit.toLocaleTimeString();
  const endStr = endZeit.toLocaleTimeString();

  const eintrag = [datum, startStr, endStr, dauer, aufgaben];
  daten.push(eintrag);
  localStorage.setItem("arbeitszeitDaten", JSON.stringify(daten));
  renderTabelle();

  // Reset
  speichernBtn.disabled = true;
  startBtn.disabled = false;
  zeitAnzeige.textContent = "Startzeit: --:-- | Endzeit: --:-- | Dauer: 0 h 0 m";
  document.querySelectorAll("#checkboxContainer input").forEach(cb => cb.checked = false);
}

// Tabelle rendern
function renderTabelle() {
  tabelleBody.innerHTML = "";
  let gesamtSekunden = 0;
  daten.forEach((eintrag, idx) => {
    const [datum, start, ende, dauer, aufgaben] = eintrag;
    const zeile = document.createElement("tr");
    zeile.innerHTML = `
      <td>${datum}</td>
      <td>${start}</td>
      <td>${ende}</td>
      <td>${dauer}</td>
      <td><button onclick="zeigeDetails(${idx})">Details</button></td>
    `;
    const teile = dauer.match(/(\d+) h (\d+) m/);
    if (teile) {
      const [_, h, m] = teile;
      gesamtSekunden += (+h * 3600 + +m * 60);
    }
    tabelleBody.appendChild(zeile);
  });
  const gearbeitetStunden = gesamtSekunden / 3600;
  const offen = Math.max(0, MONATSZIEL_STUNDEN - gearbeitetStunden);
  offeneAnzeige.textContent = `Gesamtarbeitszeit: ${gearbeitetStunden.toFixed(2)} h | Offene Stunden: ${offen.toFixed(2)} h`;
}

// Detailanzeige
window.zeigeDetails = function(idx) {
  const [, , , , aufgaben] = daten[idx];
  document.getElementById("detailsInhalt").textContent = aufgaben || "Keine Aufgaben notiert.";
  document.getElementById("detailsPopup").style.display = "block";
}

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
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return `${h} h ${m} m`;
}

// Benachrichtigung
function notify(title, body) {
  if (Notification.permission === "granted") {
    new Notification(title, { body });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(p => {
      if (p === "granted") new Notification(title, { body });
    });
  }
}

// Install-Button Logik
let deferredPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = "inline-block";
});
installBtn.addEventListener("click", () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(() => {
    begruessung.style.display = "none";
    installBtn.style.display = "none";
  });
});

// Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(() => console.log("✅ Service Worker registriert"))
    .catch(e => console.error("❌ SW-Fehler:", e));
}

// App-Check
function isInApp() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

// Initial anzeigen
renderTabelle();
