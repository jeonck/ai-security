// Left sidebar collapse/expand toggle
(function () {
  const STORAGE_KEY = "hextra-sidebar-collapsed";
  const root = document.documentElement;

  if (localStorage.getItem(STORAGE_KEY) === "1") {
    root.classList.add("hx-sidebar-collapsed");
  }

  const button = document.createElement("button");
  button.type = "button";
  button.id = "hextra-sidebar-toggle";
  button.setAttribute("aria-label", "Toggle sidebar");

  button.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><path d="m13 9 3 3-3 3"/></svg>';

  const updateState = () => {
    const collapsed = root.classList.contains("hx-sidebar-collapsed");
    button.setAttribute("aria-pressed", collapsed ? "true" : "false");
  };
  updateState();

  button.addEventListener("click", () => {
    const collapsed = root.classList.toggle("hx-sidebar-collapsed");
    localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    updateState();
  });

  document.body.appendChild(button);
})();
