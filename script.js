let minutes = 0;
let seconds = 0;
let interval = null;
let isRunning = false;
let mode = localStorage.getItem('mode') || 'timer';
let wakeLock = null;

const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const toggleModeBtn = document.getElementById('toggleModeBtn');
const currentModeEl = document.getElementById('currentMode');

// State laden
function loadState() {
  const saved = JSON.parse(localStorage.getItem('timerState'));
  if (saved) {
    minutes = saved.minutes;
    seconds = saved.seconds;
    mode = saved.mode;
    updateDisplay();
    currentModeEl.textContent = `Aktueller Modus: ${mode === 'timer' ? 'Timer' : 'Stoppuhr'}`;
  }
}

// State speichern
function saveState() {
  localStorage.setItem('timerState', JSON.stringify({ minutes, seconds, mode }));
  localStorage.setItem('mode', mode);
}

function updateDisplay() {
  minutesEl.textContent = String(minutes).padStart(2, '0');
  secondsEl.textContent = String(seconds).padStart(2, '0');
}

function tick() {
  if (mode === 'timer') {
    if (minutes === 0 && seconds === 0) {
      clearInterval(interval);
      isRunning = false;
      releaseWakeLock();
      return;
    }
    if (seconds === 0) {
      minutes--;
      seconds = 59;
    } else {
      seconds--;
    }
  } else {
    seconds++;
    if (seconds === 60) {
      minutes++;
      seconds = 0;
    }
  }
  updateDisplay();
  saveState();
}

startBtn.addEventListener('click', () => {
  if (!isRunning) {
    interval = setInterval(tick, 1000);
    isRunning = true;
    requestWakeLock();
  }
});

pauseBtn.addEventListener('click', () => {
  clearInterval(interval);
  isRunning = false;
  releaseWakeLock();
});

resetBtn.addEventListener('click', () => {
  clearInterval(interval);
  isRunning = false;
  minutes = 0;
  seconds = 0;
  updateDisplay();
  saveState();
  releaseWakeLock();
});

toggleModeBtn.addEventListener('click', () => {
  mode = mode === 'timer' ? 'stopwatch' : 'timer';
  currentModeEl.textContent = `Aktueller Modus: ${mode === 'timer' ? 'Timer' : 'Stoppuhr'}`;
  resetBtn.click(); // reset on mode switch
  saveState();
});

function requestWakeLock() {
  if ('wakeLock' in navigator) {
    navigator.wakeLock.request('screen')
      .then(lock => {
        wakeLock = lock;
        wakeLock.addEventListener('release', () => {
          console.log('Wake Lock released');
        });
      })
      .catch(err => console.error('Wake Lock Error:', err));
  }
}

function releaseWakeLock() {
  if (wakeLock) {
    wakeLock.release().then(() => {
      wakeLock = null;
    });
  }
}

// Alle 30 Sekunden ein Ping, damit die App aktiv bleibt
setInterval(() => {
  console.log('App aktiv');
}, 30000);

// PWA Setup
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(() => console.log('Service Worker registriert'))
    .catch(err => console.error('SW Fehler:', err));
}

loadState();
