let startZeit, endZeit;
let daten = [];
let gesamtzeit = [new Date(0)];
const MONATSZIEL_STUNDEN = 96;

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const speichernBtn = document.getElementById("speichernBtn");
const zeitAnzeige = document.getElementById("zeitAnzeige");
const installBtn = document.getElementById("installBtn");
const begruessung = document.getElementById("begruessung");
const modusBtn = document.getElementById("modusBtn");
const auswertung = document.getElementById("auswertung");
const offeneStundenDiv = document.getElementById("offeneStundenAnzeige");

let imErfassungsModus = true;

// Modus wechseln
modusBtn.addEventListener("click", () => {
  imErfassungsModus = !imErfassungsModus;

  const aufgabenDiv = document.querySelector(".aufgabenliste");
  const steuerungDiv = document.querySelector(".steuerung");

  if (imErfassungsModus) {
    aufgabenDiv.style.display = "block";
    steuerungDiv.style.display = "flex";
    speichernBtn.style.display = "block";
    zeitAnzeige.style.display = "block";
    begruessung.style.display = "block";
    auswertung.style.display = "none";
  } else {
    aufgabenDiv.style.display = "none";
    steuerungDiv.style.display = "none";
    speichernBtn.style.display = "none";
    zeitAnzeige.style.display = "none";
    begruessung.style.display = "none";
    auswertung.style.display = "block";
    aktualisiere_anzeige();
  }
});

// Start
startBtn.addEventListener("click", () => {
  startZeit = new Date();
  updateAnzeige();
  startBtn.disabled = true;
  stopBtn.disabled = false;
});

// Stopp
stopBtn.addEventListener("click", () => {
  endZeit = new Date();
  updateAnzeige();
  speichernBtn.disabled = false;
  stopBtn.disabled = true;
});

// Speichern
speichernBtn.addEventListener("click", () => {
  const checked = document.querySelectorAll("#checkboxContainer input:checked");
  const aufgaben = Array.from(checked).map(cb => cb.value).join(", ");
  const dauer = berechneDauer(startZeit, endZeit);
  const datum = startZeit.toLocaleDateString();
  const startStr = startZeit.toLocaleTimeString();
  const endStr = endZeit.toLocaleTimeString();

  daten.push([datum, startStr, endStr, dauer, aufgaben]);

  const diff = Math.max(0, Math.floor((endZeit - startZeit) / 1000));
  gesamtzeit[0] = new Date(gesamtzeit[0].getTime() + diff * 1000);

  startBtn.disabled = false;
  speichernBtn.disabled = true;
  zeitAnzeige.textContent = "Startzeit: --:-- | Endzeit: --:-- | Dauer: 0 h 0 m";

  aktualisiere_anzeige();
});

// Anzeige aktualisieren
function updateAnzeige() {
  const startStr = startZeit ? startZeit.toLocaleTimeString() : "--:--";
  const endStr = endZeit ? endZeit.toLocaleTimeString() : "--:--";
  const dauer = (startZeit && endZeit) ? berechneDauer(startZeit, endZeit) : "0 h 0 m";
  zeitAnzeige.textContent = `Startzeit: ${startStr} | Endzeit: ${endStr} | Dauer: ${dauer}`;
}

// Dauer berechnen
function berechneDauer(start, end) {
  const diff = Math.max(0, Math.floor((end - start) / 1000));
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return `${h} h ${m} m`;
}

// Tabelle anzeigen & aktualisieren
function aktualisiere_anzeige() {
  const tableBody = document.getElementById("eintraegeBody");
  tableBody.innerHTML = "";

  daten.forEach((eintrag, index) => {
    const row = document.createElement("tr");
    eintrag.slice(0, 4).forEach(val => {
      const td = document.createElement("td");
      td.textContent = val;
      row.appendChild(td);
    });

    const tdDetails = document.createElement("td");
    const btnDetails = document.createElement("button");
    btnDetails.textContent = "Details";
    btnDetails.className = "detailsBtn";
    btnDetails.onclick = () => zeigeDetails(index);
    tdDetails.appendChild(btnDetails);
    row.appendChild(tdDetails);

    const tdLoeschen = document.createElement("td");
    const btnDel = document.createElement("button");
    btnDel.textContent = "Löschen";
    btnDel.className = "loeschenBtn";
    btnDel.onclick = () => {
      daten.splice(index, 1);
      aktualisiere_anzeige();
    };
    tdLoeschen.appendChild(btnDel);
    row.appendChild(tdLoeschen);

    tableBody.appendChild(row);
  });

  const gearbeitetStunden = gesamtzeit[0].getTime() / 3600000;
  const offen = Math.max(0, MONATSZIEL_STUNDEN - gearbeitetStunden);
  offeneStundenDiv.textContent = `Gesamtarbeitszeit: ${gearbeitetStunden.toFixed(2)} h | Offene Stunden: ${offen.toFixed(2)} h`;
}

// Detail-Fenster
function zeigeDetails(index) {
  const eintrag = daten[index];
  alert(`📝 Aufgaben am ${eintrag[0]}:\n\n${eintrag[4]}`);
}

// App-Install prompt
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
    installBtn.style.display = "none";
    begruessung.style.display = "none";
  });
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(() => console.log("✅ Service Worker aktiv"))
    .catch(e => console.error("❌ Fehler bei SW:", e));
});
