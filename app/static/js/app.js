(function () {
  const symbols = window.SLOT_SYMBOLS || [];

  function renderSymbol(symbolName) {
    if (window.SlotIcons && typeof window.SlotIcons.renderSymbol === "function") {
      return window.SlotIcons.renderSymbol(symbolName);
    }
    return `<div class="symbol-fallback">${symbolName}</div>`;
  }

  function getSymbolPool() {
    if (symbols.length) {
      return symbols;
    }
    if (window.SlotIcons && window.SlotIcons.ICONS) {
      return Object.keys(window.SlotIcons.ICONS);
    }
    return ["rhel"];
  }

  let playerForm;
  let emailInput;
  let formError;
  let spinBtn;
  let resultBanner;
  let resultMessage;
  let resultClose;

  const REEL_SPIN_ITEMS = 24;
  const SPIN_TIMING = {
    minSpinMs: 2200,
    reelStopBaseMs: 900,
    reelStopStaggerMs: 500,
    reelLandMs: 2200,
  };
  let hasSpun = false;
  let isSpinning = false;

  function wait(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  function getReelItemHeight(reel) {
    if (reel && reel.clientHeight) {
      return reel.clientHeight;
    }
    const value = getComputedStyle(document.documentElement).getPropertyValue("--reel-item-height");
    return Number.parseInt(value, 10) || 100;
  }

  function showError(message) {
    if (!formError) {
      return;
    }
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
    if (!emailInput) {
      return false;
    }
    const email = emailInput.value.trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function updateSpinButton() {
    if (!spinBtn) {
      return;
    }
    spinBtn.disabled = isSpinning || (hasSpun && !isTestEmail()) || !hasValidEmail();
  }

  function isTestEmail() {
    if (!emailInput) {
      return false;
    }
    return emailInput.value.trim().toLowerCase() === "aseifert@redhat.com";
  }

  function setSpinningState(spinning) {
    isSpinning = spinning;
    if (!playerForm) {
      return;
    }
    playerForm.querySelectorAll("input").forEach((input) => {
      input.disabled = spinning || (hasSpun && !isTestEmail());
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

    for (let i = 0; i < pool.length * 4; i += 1) {
      strip.appendChild(createSymbolCell(pool[i % pool.length]));
    }

    reel.appendChild(strip);
  }

  function spinReelTo(reel, finalSymbol, stopDelayMs) {
    return new Promise((resolve) => {
      window.setTimeout(() => {
        const strip = buildSpinStrip(finalSymbol);

        reel.classList.remove("is-spinning");
        reel.innerHTML = "";
        reel.appendChild(strip);

        const itemHeight = strip.children[0]?.offsetHeight || getReelItemHeight(reel);
        const finalOffset = (strip.children.length - 1) * itemHeight;

        strip.style.transform = "translate3d(0, 0, 0)";

        requestAnimationFrame(() => {
          strip.style.transition = `transform ${SPIN_TIMING.reelLandMs}ms cubic-bezier(0.12, 0.85, 0.22, 1)`;
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
        window.setTimeout(finish, SPIN_TIMING.reelLandMs + 250);
      }, stopDelayMs);
    });
  }

  async function animateReels(finalReels) {
    const reels = [...document.querySelectorAll(".reel")];
    const tasks = reels.map(
      (reel, index) => spinReelTo(
        reel,
        finalReels[index],
        SPIN_TIMING.reelStopBaseMs + index * SPIN_TIMING.reelStopStaggerMs,
      ),
    );
    await Promise.all(tasks);
  }

  function showResult(message, isWinner) {
    resultMessage.textContent = message;
    resultBanner.classList.toggle("winner", isWinner);
    resultBanner.hidden = false;
  }

  async function handleSpin() {
    showError("");

    if (hasSpun && !isTestEmail()) {
      return;
    }

    if (!hasValidEmail()) {
      showError("Enter a valid email address to spin.");
      emailInput.focus();
      return;
    }

    if (!playerForm.reportValidity()) {
      return;
    }

    const player = getPlayerFromForm();
    const spinStartedAt = Date.now();
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
        const detail = typeof data.detail === "string" ? data.detail : "Unable to spin right now.";
        throw new Error(detail);
      }

      const elapsed = Date.now() - spinStartedAt;
      if (elapsed < SPIN_TIMING.minSpinMs) {
        await wait(SPIN_TIMING.minSpinMs - elapsed);
      }

      await animateReels(data.reels);
      showResult(data.message, data.is_winner);

      if (data.is_test) {
        hasSpun = false;
        setSpinningState(false);
      } else {
        hasSpun = true;
        setSpinningState(true);
      }
    } catch (error) {
      const pool = getSymbolPool();
      document.querySelectorAll(".reel").forEach((reel, index) => {
        showIdleSymbol(reel, pool[index % pool.length]);
      });
      setSpinningState(false);
      showError(error.message || "Unable to spin right now.");
    }
  }

  function renderReels() {
    if (window.SlotIcons && typeof window.SlotIcons.hydrateSymbolElements === "function") {
      window.SlotIcons.hydrateSymbolElements();
    }

    const pool = getSymbolPool();
    document.querySelectorAll(".reel").forEach((reel, index) => {
      const existing = reel.querySelector(".reel__strip--idle .reel__symbol");
      if (existing && existing.innerHTML.trim()) {
        return;
      }
      showIdleSymbol(reel, pool[index % pool.length]);
    });
  }

  function bindEvents() {
    playerForm.addEventListener("input", () => {
      showError("");
      updateSpinButton();
    });

    emailInput.addEventListener("change", updateSpinButton);
    emailInput.addEventListener("blur", updateSpinButton);

    playerForm.addEventListener("submit", (event) => {
      event.preventDefault();
      handleSpin();
    });

    spinBtn.addEventListener("click", (event) => {
      if (spinBtn.disabled) {
        event.preventDefault();
        if (!hasValidEmail()) {
          showError("Enter a valid email address to spin.");
          emailInput.focus();
        }
      }
    });

    if (resultClose) {
      resultClose.addEventListener("click", () => {
        resultBanner.hidden = true;
      });
    }
  }

  function boot() {
    playerForm = document.getElementById("player-form");
    emailInput = document.getElementById("email-input");
    formError = document.getElementById("form-error");
    spinBtn = document.getElementById("spin-btn");
    resultBanner = document.getElementById("result-banner");
    resultMessage = document.getElementById("result-message");
    resultClose = document.getElementById("result-close");

    if (!playerForm || !emailInput || !spinBtn) {
      return;
    }

    renderReels();
    bindEvents();
    updateSpinButton();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.addEventListener("orientationchange", () => {
    window.setTimeout(() => {
      if (!isSpinning) {
        renderReels();
      }
    }, 150);
  });
})();
