// Timer length: always 25 minutes for now
const TOTAL_MS = 25 * 60 * 1000;

const timeEl = document.getElementById("time");
const ringEl = document.querySelector(".ring");
const artEl = document.querySelector(".art");
const mainBtn = document.getElementById("main-btn");
const resetBtn = document.getElementById("reset-btn");
const panelEl = document.querySelector(".panel");
const detailsEl = document.getElementById("details");

// Made-up details for now. Real ones from the Met come in a later step.
const PLACEHOLDER_PAINTING = {
  title: "Painting name",
  artist: "Artist name",
  year: "Year",
  link: "https://www.metmuseum.org/",
};

// state: "idle" (before start), "running", "paused", or "finished"
let state = "idle";
let remainingMs = TOTAL_MS;
let endTime = 0; // the clock time when the countdown reaches zero
let intervalId = null;

function formatTime(ms) {
  // Round up so the screen shows 25:00 for the first second, then 24:59, ...
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return minutes + ":" + seconds;
}

function render() {
  timeEl.textContent = formatTime(remainingMs);

  // How much of the time has passed: 0 (start) to 1 (finished)
  const progress = 1 - remainingMs / TOTAL_MS;
  ringEl.style.setProperty("--p", progress * 100 + "%");
  // The artwork starts blurred and gets sharper as time passes
  artEl.style.setProperty("--blur", 26 * (1 - progress) + "px");
  artEl.style.setProperty("--scale", 1 + 0.25 * (1 - progress));

  if (state === "running") {
    mainBtn.textContent = "Pause";
  } else if (state === "paused") {
    mainBtn.textContent = "Resume";
  } else if (state === "finished") {
    mainBtn.textContent = "Restart session";
  } else {
    mainBtn.textContent = "Start";
  }

  // Finished: only "Restart session" is left, and the painting details appear
  const finished = state === "finished";
  resetBtn.hidden = finished;
  panelEl.classList.toggle("finished", finished);
  if (finished) {
    showDetails();
  } else {
    hideDetails();
  }
}

function showDetails() {
  if (!detailsEl.hidden) {
    return;
  }
  const title = document.createElement("h3");
  title.textContent = PLACEHOLDER_PAINTING.title;

  const meta = document.createElement("p");
  meta.className = "meta";
  meta.textContent = PLACEHOLDER_PAINTING.artist + " · " + PLACEHOLDER_PAINTING.year;

  const linkWrap = document.createElement("p");
  const link = document.createElement("a");
  link.href = PLACEHOLDER_PAINTING.link;
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = "Read about this painting";
  linkWrap.appendChild(link);

  detailsEl.replaceChildren(title, meta, linkWrap);
  detailsEl.hidden = false;
}

function hideDetails() {
  detailsEl.hidden = true;
  detailsEl.replaceChildren(); // remove the text completely
}

function tick() {
  // Work out the time left from the real clock, so it stays correct
  // even when the browser tab is in the background.
  remainingMs = Math.max(0, endTime - Date.now());
  if (remainingMs === 0) {
    clearInterval(intervalId);
    intervalId = null;
    state = "finished";
  }
  render();
}

function startCountdown() {
  endTime = Date.now() + remainingMs;
  state = "running";
  clearInterval(intervalId);
  intervalId = setInterval(tick, 250);
  render();
}

function pauseCountdown() {
  tick(); // save the exact time left
  if (state === "finished") {
    return; // the time ran out at the same moment
  }
  clearInterval(intervalId);
  intervalId = null;
  state = "paused";
  render();
}

function resetCountdown() {
  clearInterval(intervalId);
  intervalId = null;
  state = "idle";
  remainingMs = TOTAL_MS;
  render();
}

mainBtn.addEventListener("click", function () {
  if (state === "finished") {
    resetCountdown(); // "Restart session"
  } else if (state === "running") {
    pauseCountdown();
  } else {
    startCountdown(); // from "idle" (Start) or "paused" (Resume)
  }
});

resetBtn.addEventListener("click", resetCountdown);

// When coming back to the tab, update straight away
document.addEventListener("visibilitychange", function () {
  if (state === "running") {
    tick();
  }
});

render();
