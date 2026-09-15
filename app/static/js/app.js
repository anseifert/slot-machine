const symbols = window.SLOT_SYMBOLS || [];
const { hydrateSymbolElements, renderSymbol } = window.SlotIcons;

const playerForm = document.getElementById("player-form");
const formError = document.getElementById("form-error");
const spinBtn = document.getElementById("spin-btn");
const resultBanner = document.getElementById("result-banner");
const resultMessage = document.getElementById("result-message");
const resultClose = document.getElementById("result-close");

let hasSpun = false;

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

function setSpinningState(isSpinning) {
  spinBtn.disabled = isSpinning || hasSpun;
  playerForm.querySelectorAll("input").forEach((input) => {
    input.disabled = isSpinning || hasSpun;
  });
}

function buildReelStrip(finalSymbol) {
  const strip = document.createElement("div");
  strip.className = "reel__strip";

  const fillerPool = symbols.length ? symbols : Object.keys(window.SlotIcons.ICONS);
  for (let i = 0; i < 12; i += 1) {
    const symbol = i === 11 ? finalSymbol : fillerPool[Math.floor(Math.random() * fillerPool.length)];
    const cell = document.createElement("div");
    cell.className = "reel__symbol";
    cell.innerHTML = renderSymbol(symbol);
    strip.appendChild(cell);
  }
  return strip;
}

function setReelFinal(reel, finalSymbol, delayMs) {
  return new Promise((resolve) => {
    reel.classList.add("spinning");
    setTimeout(() => {
      reel.classList.remove("spinning");
      reel.innerHTML = "";
      const strip = buildReelStrip(finalSymbol);
      strip.style.transform = "translateY(-968px)";
      reel.appendChild(strip);
      resolve();
    }, delayMs);
  });
}

async function animateReels(finalReels) {
  const reels = [...document.querySelectorAll(".reel")];
  const tasks = reels.map((reel, index) => setReelFinal(reel, finalReels[index], 900 + index * 250));
  await Promise.all(tasks);
}

function showResult(message, isWinner) {
  resultMessage.textContent = message;
  resultBanner.classList.toggle("winner", isWinner);
  resultBanner.hidden = false;
}

playerForm.addEventListener("input", () => {
  showError("");
});

playerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError("");

  if (hasSpun) {
    return;
  }

  if (!playerForm.checkValidity()) {
    playerForm.reportValidity();
    return;
  }

  const player = getPlayerFromForm();
  setSpinningState(true);

  try {
    const response = await fetch("/api/spin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(player),
    });

    const data = await response.json();
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
    setSpinningState(false);
    showError(error.message);
  }
});

resultClose.addEventListener("click", () => {
  resultBanner.hidden = true;
});

function initPage() {
  hydrateSymbolElements();
  document.querySelectorAll(".reel").forEach((reel) => {
    reel.innerHTML = "";
    reel.appendChild(buildReelStrip("rhel"));
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPage);
} else {
  initPage();
}
