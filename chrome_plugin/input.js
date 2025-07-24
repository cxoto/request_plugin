let placeholders = [];
chrome.storage.local.get("pendingPlaceholders").then(data => {
    if (data.pendingPlaceholders) {
        placeholders = (data.pendingPlaceholders);
        renderInputs();
        chrome.storage.local.remove("pendingPlaceholders"); // 用完删掉
    }
});


function renderInputs() {
  const area = document.getElementById("inputArea");
  area.innerHTML = placeholders.map(p => `
    <label>${p}: <input id="input-${p}" /></label>
  `).join("");
}

document.getElementById("submitBtn").addEventListener("click", () => {
  const values = {};
  placeholders.forEach(p => {
    values[p] = document.getElementById(`input-${p}`).value;
  });

  chrome.runtime.sendMessage({
    type: "FORM_SUBMIT",
    values
  });

  window.close(); // 关闭窗口
});
