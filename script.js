// Arbeitszeit Tracker Erweiterung
let startZeit, endZeit, timerInterval, alarmInterval;
let daten = JSON.parse(localStorage.getItem("arbeitszeit")) || [];
const MONATSZIEL_STUNDEN = 96;

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const speichernBtn = document.getElementById("speichernBtn");
const zeitAnzeige = document.getElementById("zeitAnzeige");
const installBtn = document.getElementById("installBtn");
const begruessung = document.getElementById("begruessung");
const modusBtn = document.getElementById("modusBtn");
const eintragBody = document.getElementById("eintragBody");
const zeitSumme = document.getElementById("zeitSumme");
const alarmSound = document.getElementById("alarmSound");
const modalDetails = document.getElementById("modalDetails");
const detailText = document.getElementById("detailText");
const closeModal = document.getElementById("closeModal");

let currentModus = 1;

function isInApp() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
if (!isInApp()) {
  begruessung.style.display = "block";
  installBtn.style.display = "inline-block";
}

startBtn.addEventListener("click", () => {
  startZeit = new Date();
  updateAnzeige();
  startBtn.disabled = true;
  stopBtn.disabled = false;
  alarmInterval = setInterval(() => {
    new Notification("⏰ Erinnerung", { body: "Du arbeitest noch!", icon: "icon-192.png" });
    alarmSound.play();
  }, 15 * 60 * 1000);
});

stopBtn.addEventListener("click", () => {
  endZeit = new Date();
  updateAnzeige();
  stopBtn.disabled = true;
  speichernBtn.disabled = false;
  clearInterval(alarmInterval);
  alarmSound.pause();
  alarmSound.currentTime = 0;
  autoSpeichern();
});

speichernBtn.addEventListener("click", speichernManuell);

function speichernManuell() {
  const eintrag = generateEintrag();
  daten.push(eintrag);
  localStorage.setItem("arbeitszeit", JSON.stringify(daten));
  speichernBtn.disabled = true;
  startBtn.disabled = false;
  zeitAnzeige.textContent = "Startzeit: --:-- | Endzeit: --:-- | Dauer: 0 h 0 m";
  updateTabelle();
}

function autoSpeichern() {
  const eintrag = generateEintrag();
  daten.push(eintrag);
  localStorage.setItem("arbeitszeit", JSON.stringify(daten));
  updateTabelle();
}

function generateEintrag() {
  const checked = document.querySelectorAll("#checkboxContainer input:checked");
  const aufgaben = Array.from(checked).map(cb => cb.value);
  const dauer = berechneDauer(startZeit, endZeit);
  return {
    datum: startZeit.toLocaleDateString(),
    start: startZeit.toLocaleTimeString(),
    ende: endZeit.toLocaleTimeString(),
    dauer: dauer,
    details: aufgaben
  };
}

function updateAnzeige() {
  const startStr = startZeit ? startZeit.toLocaleTimeString() : "--:--";
  const endStr = endZeit ? endZeit.toLocaleTimeString() : "--:--";
  const dauer = (startZeit && endZeit) ? berechneDauer(startZeit, endZeit) : "0 h 0 m";
  zeitAnzeige.textContent = `Startzeit: ${startStr} | Endzeit: ${endStr} | Dauer: ${dauer}`;
}

function berechneDauer(start, end) {
  const diff = Math.max(0, Math.floor((end - start) / 1000));
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return `${h} h ${m} m`;
}

modusBtn.addEventListener("click", () => {
  currentModus = currentModus === 1 ? 2 : 1;
  document.getElementById("modus1").style.display = currentModus === 1 ? "block" : "none";
  document.getElementById("modus2").style.display = currentModus === 2 ? "block" : "none";
  if (currentModus === 2) updateTabelle();
});

function updateTabelle() {
  eintragBody.innerHTML = "";
  let gesamtSek = 0;

  daten.forEach((eintrag, index) => {
    const row = document.createElement("tr");
    const zellen = [eintrag.datum, eintrag.start, eintrag.ende, eintrag.dauer];
    zellen.forEach(text => {
      const td = document.createElement("td");
      td.textContent = text;
      row.appendChild(td);
    });
    const detailBtn = document.createElement("button");
    detailBtn.textContent = "Details";
    detailBtn.onclick = () => {
      detailText.textContent = eintrag.details.join(", ");
      modalDetails.style.display = "block";
    };
    const tdBtn = document.createElement("td");
    tdBtn.appendChild(detailBtn);
    row.appendChild(tdBtn);

    eintragBody.appendChild(row);

    const match = eintrag.dauer.match(/(\d+) h (\d+) m/);
    if (match) {
      gesamtSek += parseInt(match[1]) * 3600 + parseInt(match[2]) * 60;
    }
  });

  const gearbeitetStunden = gesamtSek / 3600;
  const offen = Math.max(0, MONATSZIEL_STUNDEN - gearbeitetStunden);
  zeitSumme.textContent = `Gesamtarbeitszeit: ${gearbeitetStunden.toFixed(2)} h | Offene Stunden: ${offen.toFixed(2)} h`;
}

closeModal.onclick = () => {
  modalDetails.style.display = "none";
};

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

if ('Notification' in window && Notification.permission !== 'granted') {
  Notification.requestPermission();
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(() => console.log("✅ Service Worker registriert"))
    .catch(e => console.error("❌ SW-Fehler:", e));
}

// Beim Start: Lade Daten
window.onload = () => {
  updateTabelle();
};
