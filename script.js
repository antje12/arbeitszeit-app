let startZeit, endZeit;
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const speichernBtn = document.getElementById("speichernBtn");
const zeitAnzeige = document.getElementById("zeitAnzeige");

// Start
startBtn.addEventListener("click", () => {
  startZeit = new Date();
  updateAnzeige();
  startBtn.disabled = true;
  stopBtn.disabled = false;
});

// Stop
stopBtn.addEventListener("click", () => {
  endZeit = new Date();
  updateAnzeige();
  stopBtn.disabled = true;
  speichernBtn.disabled = false;
});

// Speichern
speichernBtn.addEventListener("click", () => {
  const checkboxes = document.querySelectorAll("#checkboxContainer input:checked");
  const aufgaben = Array.from(checkboxes).map(cb => cb.value).join(", ");
  const dauer = berechneDauer(startZeit, endZeit);
  const datum = startZeit.toLocaleDateString();
  const startStr = startZeit.toLocaleTimeString();
  const endStr = endZeit.toLocaleTimeString();

  const zeile = `${datum} | ${startStr} | ${endStr} | ${dauer} | ${aufgaben}`;
  const blob = new Blob([zeile + "\n"], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "arbeitszeit.txt";
  link.click();

  speichernBtn.disabled = true;
  startBtn.disabled = false;
  zeitAnzeige.textContent = "Startzeit: --:-- | Endzeit: --:-- | Dauer: 0 h 0 m";
});

function updateAnzeige() {
  const startStr = startZeit ? startZeit.toLocaleTimeString() : "--:--";
  const endStr = endZeit ? endZeit.toLocaleTimeString() : "--:--";
  const dauer = startZeit && endZeit ? berechneDauer(startZeit, endZeit) : "0 h 0 m";
  zeitAnzeige.textContent = `Startzeit: ${startStr} | Endzeit: ${endStr} | Dauer: ${dauer}`;
}

function berechneDauer(start, end) {
  const diff = Math.max(0, Math.floor((end - start) / 1000));
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return `${h} h ${m} m`;
}

// === PWA Install ===
let deferredPrompt;
const installBtn = document.getElementById("installBtn");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = "block";
});

installBtn.addEventListener("click", () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === "accepted") {
        console.log("✅ App installiert");
      } else {
        console.log("❌ Installation abgelehnt");
      }
      installBtn.style.display = "none";
      deferredPrompt = null;
    });
  }
});

  const m = Math.floor((diff % 3600) / 60);
  return `${h} h ${m} m`;
}
