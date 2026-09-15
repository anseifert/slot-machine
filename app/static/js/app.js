const symbols = window.SLOT_SYMBOLS || [];
const { renderSymbol } = window.SlotIcons;

const playerForm = document.getElementById("player-form");
const emailInput = document.getElementById("email-input");
const formError = document.getElementById("form-error");
const spinBtn = document.getElementById("spin-btn");
const resultBanner = document.getElementById("result-banner");
const resultMessage = document.getElementById("result-message");
const resultClose = document.getElementById("result-close");

const REEL_SPIN_ITEMS = 18;
let hasSpun = false;
let isSpinning = false;

function getSymbolPool() {
  return symbols.length ? symbols : Object.keys(window.SlotIcons.ICONS);
}

function getReelItemHeight() {
  const value = getComputedStyle(document.documentElement).getPropertyValue("--reel-item-height");
  return Number.parseInt(value, 10) || 100;
}

function showError(message) {
  formError.textContent = message;
  formError.hidden = !message;
}

function getPlayerFromForm() {
  const formData = new FormData(playerForm);
  return {
    first_name: (formData.get("first_name") || "").toString().trim(),
    last_name: (formData.get("last_name") || "").toString().trim(),
    email: (formData.get("email") || "").toString().trim().toLowerCase(),
  };
}

function hasValidEmail() {
  const email = (emailInput.value || "").trim();
  return email.length > 0 && emailInput.checkValidity();
}

function updateSpinButton() {
  spinBtn.disabled = isSpinning || hasSpun || !hasValidEmail();
}

function setSpinningState(spinning) {
  isSpinning = spinning;
  playerForm.querySelectorAll("input").forEach((input) => {
    input.disabled = spinning || hasSpun;
  });
  updateSpinButton();
}

function createSymbolCell(symbolName) {
  const cell = document.createElement("div");
  cell.className = "reel__symbol";
  cell.innerHTML = renderSymbol(symbolName);
  return cell;
}

function showIdleSymbol(reel, symbolName) {
  reel.classList.remove("is-spinning");
  reel.innerHTML = "";

  const strip = document.createElement("div");
  strip.className = "reel__strip reel__strip--idle";
  strip.appendChild(createSymbolCell(symbolName));
  reel.appendChild(strip);
}

function buildSpinStrip(finalSymbol) {
  const pool = getSymbolPool();
  const strip = document.createElement("div");
  strip.className = "reel__strip";
  const sequence = [];

  for (let i = 0; i < REEL_SPIN_ITEMS - 1; i += 1) {
    sequence.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  sequence.push(finalSymbol);

  sequence.forEach((symbolName) => {
    strip.appendChild(createSymbolCell(symbolName));
  });

  return strip;
}

function startReelCycle(reel) {
  const pool = getSymbolPool();
  reel.classList.add("is-spinning");
  reel.innerHTML = "";

  const strip = document.createElement("div");
  strip.className = "reel__strip reel__strip--cycle";

  for (let i = 0; i < pool.length * 3; i += 1) {
    strip.appendChild(createSymbolCell(pool[i % pool.length]));
  }

  reel.appendChild(strip);
}

function spinReelTo(reel, finalSymbol, stopDelayMs) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const itemHeight = getReelItemHeight();
      const strip = buildSpinStrip(finalSymbol);
      const finalOffset = (strip.children.length - 1) * itemHeight;

      reel.classList.remove("is-spinning");
      reel.innerHTML = "";
      reel.appendChild(strip);

      requestAnimationFrame(() => {
        strip.style.transition = "transform 1.1s cubic-bezier(0.2, 0.85, 0.3, 1)";
        strip.style.transform = `translate3d(0, -${finalOffset}px, 0)`;
      });

      let finished = false;
      const finish = () => {
        if (finished) {
          return;
        }
        finished = true;
        showIdleSymbol(reel, finalSymbol);
        resolve();
      };

      strip.addEventListener("transitionend", finish, { once: true });
      setTimeout(finish, 1400);
    }, stopDelayMs);
  });
}

async function animateReels(finalReels) {
  const reels = [...document.querySelectorAll(".reel")];
  const tasks = reels.map((reel, index) => spinReelTo(reel, finalReels[index], 400 + index * 280));
  await Promise.all(tasks);
}

function showResult(message, isWinner) {
  resultMessage.textContent = message;
  resultBanner.classList.toggle("winner", isWinner);
  resultBanner.hidden = false;
}

playerForm.addEventListener("input", () => {
  showError("");
  updateSpinButton();
});

emailInput.addEventListener("change", updateSpinButton);

playerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError("");

  if (hasSpun) {
    return;
  }

  if (!hasValidEmail()) {
    showError("Enter a valid email address to spin.");
    emailInput.focus();
    return;
  }

  if (!playerForm.checkValidity()) {
    playerForm.reportValidity();
    return;
  }

  const player = getPlayerFromForm();
  setSpinningState(true);

  document.querySelectorAll(".reel").forEach((reel) => startReelCycle(reel));

  try {
    const response = await fetch("/api/spin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(player),
    });

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error("Unexpected server response. Please try again.");
    }

    if (!response.ok) {
      throw new Error(data.detail || "Unable to spin right now.");
    }

    await animateReels(data.reels);
    showResult(data.message, data.is_winner);

    if (data.is_test) {
      setSpinningState(false);
    } else {
      hasSpun = true;
      setSpinningState(true);
    }
  } catch (error) {
    document.querySelectorAll(".reel").forEach((reel, index) => {
      const pool = getSymbolPool();
      showIdleSymbol(reel, pool[index % pool.length]);
    });
    setSpinningState(false);
    showError(error.message);
  }
});

resultClose.addEventListener("click", () => {
  resultBanner.hidden = true;
});

function initPage() {
  const pool = getSymbolPool();
  document.querySelectorAll(".reel").forEach((reel, index) => {
    showIdleSymbol(reel, pool[index % pool.length]);
  });
  updateSpinButton();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPage);
} else {
  initPage();
}

window.addEventListener("orientationchange", () => {
  window.setTimeout(() => {
    if (!isSpinning) {
      initPage();
    }
  }, 150);
});
