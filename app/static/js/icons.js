const ICONS = {
  golf_ball: `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="28" fill="#ffffff" stroke="#c7c7c7" stroke-width="2"/>
      <circle cx="22" cy="24" r="2.2" fill="#e0e0e0"/>
      <circle cx="32" cy="18" r="2.2" fill="#e0e0e0"/>
      <circle cx="42" cy="24" r="2.2" fill="#e0e0e0"/>
      <circle cx="18" cy="34" r="2.2" fill="#e0e0e0"/>
      <circle cx="28" cy="32" r="2.2" fill="#e0e0e0"/>
      <circle cx="38" cy="34" r="2.2" fill="#e0e0e0"/>
      <circle cx="46" cy="42" r="2.2" fill="#e0e0e0"/>
      <circle cx="24" cy="44" r="2.2" fill="#e0e0e0"/>
      <circle cx="34" cy="46" r="2.2" fill="#e0e0e0"/>
    </svg>
  `,
  hat: `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <ellipse cx="32" cy="44" rx="24" ry="6" fill="#a60000"/>
      <path d="M14 44 C14 28 24 18 32 18 C40 18 50 28 50 44 Z" fill="#ee0000"/>
      <rect x="14" y="40" width="36" height="6" rx="2" fill="#5f0000"/>
    </svg>
  `,
  rhel: `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <rect x="6" y="14" width="52" height="36" rx="10" fill="#ee0000"/>
      <text x="32" y="39" text-anchor="middle" font-size="16" font-weight="700" fill="#ffffff" font-family="Arial, sans-serif">RHEL</text>
    </svg>
  `,
  openshift: `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="24" fill="#ee0000"/>
      <circle cx="24" cy="36" r="8" fill="#ffffff"/>
      <circle cx="40" cy="36" r="8" fill="#ffffff"/>
      <circle cx="32" cy="24" r="8" fill="#ffffff"/>
    </svg>
  `,
  ansible: `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="24" fill="#ee0000"/>
      <path d="M20 36 L32 20 L44 36 Z" fill="#ffffff"/>
      <circle cx="32" cy="40" r="4" fill="#ffffff"/>
    </svg>
  `,
  satellite: `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <rect x="10" y="28" width="44" height="16" rx="8" fill="#63bdbd"/>
      <circle cx="20" cy="36" r="5" fill="#ffffff"/>
      <rect x="28" y="32" width="18" height="8" rx="2" fill="#ffffff"/>
      <path d="M32 10 L36 24 L28 24 Z" fill="#37a3a3"/>
      <path d="M18 24 L24 28 L16 32 Z" fill="#37a3a3"/>
      <path d="M46 24 L40 28 L48 32 Z" fill="#37a3a3"/>
    </svg>
  `,
  insights: `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <rect x="10" y="12" width="44" height="40" rx="8" fill="#876fd4"/>
      <rect x="18" y="36" width="8" height="10" fill="#ffffff"/>
      <rect x="30" y="28" width="8" height="18" fill="#ffffff"/>
      <rect x="42" y="22" width="8" height="24" fill="#ffffff"/>
    </svg>
  `,
  aap: `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <rect x="8" y="14" width="48" height="36" rx="10" fill="#f5921b"/>
      <text x="32" y="39" text-anchor="middle" font-size="15" font-weight="700" fill="#ffffff" font-family="Arial, sans-serif">AAP</text>
    </svg>
  `,
};

function renderSymbol(symbol) {
  return ICONS[symbol] || ICONS.rhel;
}

function hydrateSymbolElements(root = document) {
  root.querySelectorAll("[data-symbol]").forEach((el) => {
    const symbol = el.dataset.symbol;
    el.innerHTML = renderSymbol(symbol);
  });
}

window.SlotIcons = { ICONS, renderSymbol, hydrateSymbolElements };
