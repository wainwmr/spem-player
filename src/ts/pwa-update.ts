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

  refreshBtn.addEventListener("click", () => {
    updateSW(true);
    toast.remove();
  });

  dismissBtn.addEventListener("click", () => {
    toast.remove();
  });

  document.body.appendChild(toast);
}
