import { registerSW } from "virtual:pwa-register";

const updateSW = registerSW({
  onNeedRefresh() {
    showUpdateToast();
  },
});

function showUpdateToast() {
  if (document.querySelector(".pwa-update-toast")) return;

  const toast = document.createElement("div");
  toast.className = "pwa-update-toast";
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "polite");

  toast.innerHTML = `
    <span class="pwa-update-toast-message">Update available</span>
    <button class="pwa-update-toast-refresh">Refresh</button>
    <button class="pwa-update-toast-dismiss">Dismiss</button>
  `;

  const refreshBtn = toast.querySelector(
    ".pwa-update-toast-refresh"
  ) as HTMLButtonElement;
  const dismissBtn = toast.querySelector(
    ".pwa-update-toast-dismiss"
  ) as HTMLButtonElement;

  const removeToast = () => {
    document.removeEventListener("keydown", handleKeydown);
    toast.remove();
  };

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      removeToast();
    }
  };

  refreshBtn.addEventListener("click", () => {
    updateSW(true);
    removeToast();
  });

  dismissBtn.addEventListener("click", () => {
    removeToast();
  });

  document.addEventListener("keydown", handleKeydown);

  document.body.appendChild(toast);
  refreshBtn.focus();
}

// Expose for e2e testing
(
  window as typeof window & { __pwaShowUpdateToast?: typeof showUpdateToast }
).__pwaShowUpdateToast = showUpdateToast;
