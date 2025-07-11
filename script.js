let startZeit, endZeit;
let deferredPrompt = null;

const startBtn     = document.getElementById("startBtn");
const stopBtn      = document.getElementById("stopBtn");
const speichernBtn = document.getElementById("speichernBtn");
const zeitAnzeige  = document.getElementById("zeitAnzeige");
const installBtn   = document.getElementById("installBtn");
const begruessung  = document.getElementById("begruessung");

const modusBtn     = document.getElementById("modusWechselBtn");
const erfassungDiv = document.getElementById("erfassungModus");
const auswertungDiv= document.getElementById("auswertungModus");
const auswertungTabelle = document.getElementById("auswertungTabelle").querySelector("tbody");
const gesamtzeitAnzeige = document.getElementById("gesamtzeitAnzeige");

// PWA installieren
function isInApp() {
  return window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
}

if (!isInApp()) {
  begruessung.style.display = "block";
  installBtn.style.display  = "inline-block";
}

installBtn.addEventListener("click", () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(() => {
    begruessung.style.display = "none";
    installBtn.style.display  = "none";
  });
});

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = "inline-block";
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(() => console.log("✅ Service Worker registriert"))
    .catch(e => console.error("❌ SW-Fehler:", e));
});

// Start
startBtn.addEventListener("click", () => {
  startZeit = new Date();
  updateAnzeige();
  startBtn.disabled = true;
  stopBtn.disabled  = false;
});

// Stopp
stopBtn.addEventListener("click", () => {
  endZeit = new Date();
  updateAnzeige();
  stopBtn.disabled      = true;
  speichernBtn.disabled = false;
});

// Speichern
speichernBtn.addEventListener("click", () => {
  const checked = document.querySelectorAll("#checkboxContainer input:checked");
  const aufgaben = Array.from(checked).map(cb => cb.value).join(", ");
  const dauer    = berechneDauer(startZeit, endZeit);
  const datum    = startZeit.toLocaleDateString();
  const startStr = startZeit.toLocaleTimeString();
  const endStr   = endZeit.toLocaleTimeString();

  const zeile = `${datum} | ${startStr} | ${endStr} | ${dauer} | ${aufgaben}\n`;
  const blob  = new Blob([zeile], { type: "text/plain;charset=utf-8" });
  const link  = document.createElement("a");
  link.href   = URL.createObjectURL(blob);
  link.download = "arbeitszeit.txt";
  link.click();

  speichernBtn.disabled = true;
  startBtn.disabled     = false;
  zeitAnzeige.textContent = "Startzeit: --:-- | Endzeit: --:-- | Dauer: 0 h 0 m";
});

function updateAnzeige() {
  const startStr = startZeit ? startZeit.toLocaleTimeString() : "--:--";
  const endStr   = endZeit   ? endZeit.toLocaleTimeString()   : "--:--";
  const dauer    = (startZeit && endZeit) ? berechneDauer(startZeit, endZeit) : "0 h 0 m";
  zeitAnzeige.textContent = `Startzeit: ${startStr} | Endzeit: ${endStr} | Dauer: ${dauer}`;
}

function berechneDauer(start, end) {
  const diff = Math.max(0, Math.floor((end - start) / 1000));
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return `${h} h ${m} m`;
}

// Modus wechseln
modusBtn.addEventListener("click", () => {
  if (erfassungDiv.style.display !== "none") {
    erfassungDiv.style.display = "none";
    auswertungDiv.style.display = "block";
    modusBtn.textContent = "🔙 Zurück zur Zeiterfassung";
    ladeAuswertung();
  } else {
    erfassungDiv.style.display = "block";
    auswertungDiv.style.display = "none";
    modusBtn.textContent = "🔄 Modus wechseln";
  }
});

function ladeAuswertung() {
  fetch("arbeitszeit.txt")
    .then(res => res.text())
    .then(text => {
      auswertungTabelle.innerHTML = "";
      let gesamt = 0;

      text.trim().split("\n").forEach(zeile => {
        const [datum, start, ende, dauerStr, details] = zeile.split(" | ");
        const tr = document.createElement("tr");

        [datum, start, ende, dauerStr].forEach(val => {
          const td = document.createElement("td");
          td.textContent = val;
          tr.appendChild(td);
        });

        const detailsTd = document.createElement("td");
        const btn = document.createElement("button");
        btn.textContent = "Details";
        btn.onclick = () => alert("Aufgaben:\n" + details.split(", ").map(t => "• " + t).join("\n"));
        detailsTd.appendChild(btn);
        tr.appendChild(detailsTd);
        auswertungTabelle.appendChild(tr);

        gesamt += berechneDauerSekunden(start, ende);
      });

      const h = Math.floor(gesamt / 3600);
      const m = Math.floor((gesamt % 3600) / 60);
      gesamtzeitAnzeige.textContent = `Gesamtarbeitszeit: ${h} h ${m} m`;
    })
    .catch(() => {
      auswertungTabelle.innerHTML = "<tr><td colspan='5'>❌ Keine Datei „arbeitszeit.txt“ gefunden.</td></tr>";
      gesamtzeitAnzeige.textContent = "";
    });
}

function berechneDauerSekunden(start, ende) {
  const [sh, sm, ss] = start.split(":").map(Number);
  const [eh, em, es] = ende.split(":").map(Number);
  const d1 = new Date(0, 0, 0, sh, sm, ss);
  const d2 = new Date(0, 0, 0, eh, em, es);
  return Math.max(0, (d2 - d1) / 1000);
}
