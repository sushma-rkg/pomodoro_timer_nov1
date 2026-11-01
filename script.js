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
const artEl = document.getElementById("art");
const mainBtn = document.getElementById("main-btn");
const resetBtn = document.getElementById("reset-btn");
const panelEl = document.querySelector(".panel");
const detailsEl = document.getElementById("details");

// The Met Museum's free public API
const MET_SEARCH_URL =
  "https://collectionapi.metmuseum.org/public/collection/v1.1/search?q=*&medium=Paintings&hasImages=true";
const MET_OBJECT_URL = "https://collectionapi.metmuseum.org/public/collection/v1/objects/";
const MAX_PICK_TRIES = 25;

// The painting on screen: its image and details all come from one Met record.
let currentPainting = null;
let loadCount = 0; // so an old, slow request can't replace a newer painting

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

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("The Met answered with status " + response.status);
  }
  return response.json();
}

// A painting qualifies if it is public domain, has an image, and is a painting
function qualifies(record) {
  return (
    record.isPublicDomain === true &&
    Boolean(record.primaryImageSmall) &&
    /^Paintings/.test(record.classification || "")
  );
}

// Keep only what we need, exactly as the Met gives it.
function toPainting(record) {
  return {
    image: record.primaryImageSmall,
    title: (record.title || "").trim() || "Unknown",
    artist: (record.artistDisplayName || "").trim() || "Unknown",
    year: (record.objectDate || "").trim() || "Unknown",
    link: record.objectURL || "https://www.metmuseum.org/art/collection/search/" + record.objectID,
  };
}

// Pick one random painting from the Met and show its image.
async function loadPainting() {
  const myLoad = ++loadCount;
  currentPainting = null;
  artEl.hidden = true;
  artEl.removeAttribute("src");

  try {
    // First ask how many paintings there are, then pick a random one
    const first = await fetchJson(MET_SEARCH_URL + "&limit=1");
    for (let attempt = 0; attempt < MAX_PICK_TRIES; attempt++) {
      const offset = Math.floor(Math.random() * first.total);
      const found = await fetchJson(MET_SEARCH_URL + "&limit=1&offset=" + offset);
      if (!found.objectIDs || found.objectIDs.length === 0) {
        continue;
      }
      const record = await fetchJson(MET_OBJECT_URL + found.objectIDs[0]);
      if (!qualifies(record)) {
        continue; // quietly pick another
      }
      if (myLoad !== loadCount) {
        return; // a newer painting was asked for
      }
      currentPainting = toPainting(record);
      artEl.src = currentPainting.image;
      return;
    }
  } catch (error) {
    // No error messages on the page yet (a later step). Leave a note for testing.
    console.error("Could not get a painting from the Met:", error);
  }
}

artEl.addEventListener("load", function () {
  artEl.hidden = false;
});

function showDetails() {
  if (!detailsEl.hidden || !currentPainting) {
    return;
  }
  const title = document.createElement("h3");
  title.textContent = currentPainting.title;

  const meta = document.createElement("p");
  meta.className = "meta";
  meta.textContent = currentPainting.artist + " · " + currentPainting.year;

  const linkWrap = document.createElement("p");
  const link = document.createElement("a");
  link.href = currentPainting.link;
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
    resetCountdown(); // "Restart session": back to the start, with a new painting
    loadPainting();
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
loadPainting();
