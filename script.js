// Timer length rules
const DEFAULT_MS = 25 * 60 * 1000; // 25:00
const MIN_MS = 30 * 1000; // 00:30
const MAX_MS = 120 * 60 * 1000; // 120:00
const LENGTH_MESSAGE =
  "Please pick a length from 00:30 to 120:00, using whole numbers (seconds from 0 to 59).";

const minutesInput = document.getElementById("minutes");
const secondsInput = document.getElementById("seconds");
const messageEl = document.getElementById("message");
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
let totalMs = DEFAULT_MS; // the last valid length
let remainingMs = totalMs;
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
  const progress = 1 - remainingMs / totalMs;
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

  // The length can only be changed before the timer starts
  const locked = state !== "idle";
  minutesInput.disabled = locked;
  secondsInput.disabled = locked;

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

// Read the two boxes. Gives the length in milliseconds, or null if not valid.
function readLength() {
  const m = minutesInput.value.trim();
  const s = secondsInput.value.trim();
  if (!/^\d+$/.test(m) || !/^\d+$/.test(s)) {
    return null; // empty, letters, decimals or negative numbers
  }
  const minutes = Number(m);
  const seconds = Number(s);
  if (seconds > 59) {
    return null;
  }
  const ms = (minutes * 60 + seconds) * 1000;
  if (ms < MIN_MS || ms > MAX_MS) {
    return null;
  }
  return ms;
}

function writeBoxes(ms) {
  const totalSeconds = Math.round(ms / 1000);
  minutesInput.value = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  secondsInput.value = String(totalSeconds % 60).padStart(2, "0");
}

function showMessage(text) {
  messageEl.textContent = text;
  messageEl.hidden = false;
}

function hideMessage() {
  messageEl.hidden = true;
  messageEl.textContent = "";
}

function startCountdown() {
  hideMessage();
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
  totalMs = DEFAULT_MS; // back to 25:00
  remainingMs = totalMs;
  writeBoxes(totalMs);
  hideMessage();
  render();
}

// Typing in the boxes: use the new length as soon as it is valid
function onLengthInput() {
  if (state !== "idle") {
    return;
  }
  const ms = readLength();
  if (ms === null) {
    showMessage(LENGTH_MESSAGE); // keep the last valid length
    return;
  }
  hideMessage();
  totalMs = ms;
  remainingMs = ms;
  render();
}

// When leaving the boxes: show the last valid length again.
// (Moving from the minutes box to the seconds box does not count as leaving.)
function onLengthLeave(event) {
  if (state !== "idle") {
    return;
  }
  if (event.relatedTarget === minutesInput || event.relatedTarget === secondsInput) {
    return;
  }
  writeBoxes(totalMs);
}

function onLengthEnter(event) {
  if (event.key === "Enter") {
    writeBoxes(totalMs);
  }
}

minutesInput.addEventListener("input", onLengthInput);
secondsInput.addEventListener("input", onLengthInput);
minutesInput.addEventListener("focusout", onLengthLeave);
secondsInput.addEventListener("focusout", onLengthLeave);
minutesInput.addEventListener("keydown", onLengthEnter);
secondsInput.addEventListener("keydown", onLengthEnter);

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

writeBoxes(totalMs); // browsers can remember old box values, so set them again
render();
