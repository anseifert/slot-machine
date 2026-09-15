const symbols = window.SLOT_SYMBOLS || [];
const { hydrateSymbolElements, renderSymbol } = window.SlotIcons;

const modal = document.getElementById("player-modal");
const playerForm = document.getElementById("player-form");
const formError = document.getElementById("form-error");
const spinBtn = document.getElementById("spin-btn");
const resultBanner = document.getElementById("result-banner");
const resultMessage = document.getElementById("result-message");
const resultClose = document.getElementById("result-close");

let player = null;
let hasSpun = false;

function showModal() {
  modal.hidden = false;
}

function hideModal() {
  modal.hidden = true;
}

function showError(message) {
  formError.textContent = message;
  formError.hidden = !message;
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

playerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  showError("");

  const formData = new FormData(playerForm);
  player = {
    first_name: formData.get("first_name").trim(),
    last_name: formData.get("last_name").trim(),
    email: formData.get("email").trim().toLowerCase(),
  };

  hideModal();
  spinBtn.disabled = false;
});

spinBtn.addEventListener("click", async () => {
  if (!player || hasSpun) {
    return;
  }

  spinBtn.disabled = true;
  showError("");

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
    hasSpun = true;
  } catch (error) {
    spinBtn.disabled = false;
    showModal();
    showError(error.message);
  }
});

resultClose.addEventListener("click", () => {
  resultBanner.hidden = true;
});

document.addEventListener("DOMContentLoaded", () => {
  hydrateSymbolElements();
  document.querySelectorAll(".reel").forEach((reel) => {
    reel.innerHTML = "";
    reel.appendChild(buildReelStrip("rhel"));
  });
  showModal();
});
