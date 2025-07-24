document.addEventListener("DOMContentLoaded", async () => {
    const textarea = document.getElementById("configInput");
    const status = document.getElementById("status");

    const data = await chrome.storage.local.get("templates");
    textarea.value = JSON.stringify(data.templates || [], null, 2);

    document.getElementById("saveBtn").addEventListener("click", () => {
        try {
            const json = JSON.parse(textarea.value);
            chrome.storage.local.set({ templates: json }, () => {
                status.textContent = "配置保存成功！右键菜单已刷新";
                setTimeout(() => status.textContent = "", 2000);
            });
        } catch (e) {
            status.textContent = "JSON 格式错误，请检查后再试。";
        }
    });
});
