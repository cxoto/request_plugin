(async () => {
    const templates = await new Promise(res =>
        chrome.storage.local.get("templates", data => res(data.templates || []))
    );
    const templateSelect = document.getElementById("templateSelect");
    const placeholderInputs = document.getElementById("placeholderInputs");
    const callApiBtn = document.getElementById("callApiBtn");
    const responseDiv = document.getElementById("response");

    let currentTemplate = null;
    let currentPlaceholders = [];

    templateSelect.innerHTML = templates.map((tpl, idx) =>
        `<option value="${idx}">${tpl.name}</option>`
    ).join("");

    templateSelect.addEventListener("change", () => {
        const selected = templates[templateSelect.value];
        currentTemplate = selected;
        updatePlaceholderInputs(selected);
    });

    function updatePlaceholderInputs(template) {
        const placeholders = extractPlaceholders(template);
        currentPlaceholders = placeholders;

        placeholderInputs.innerHTML = placeholders.map(name => `
    <label>${name}: <input type="text" id="ph-${name}" /></label>
  `).join("");
    }

    // 从对象中提取所有 ${xxx}
    function extractPlaceholders(template) {
        const allValues = JSON.stringify(template);
        const matches = [...allValues.matchAll(/\$\{(\w+)\}/g)];
        const names = [...new Set(matches.map(m => m[1]))];
        return names;
    }

    // 替换模板
    function fillTemplate(obj, values) {
        const str = JSON.stringify(obj);
        const filled = str.replace(/\$\{(\w+)\}/g, (_, key) => values[key] || "");
        return JSON.parse(filled);
    }

    // 点击按钮调用接口
    callApiBtn.addEventListener("click", async () => {
        if (!currentTemplate) return;

        const userInput = {};
        currentPlaceholders.forEach(name => {
            const inputEl = document.getElementById(`ph-${name}`);
            userInput[name] = inputEl.value;
        });

        const url = fillTemplate(currentTemplate.url, userInput);
        const headers = fillTemplate(currentTemplate.headers, userInput);
        const body = fillTemplate(currentTemplate.body, userInput);

        try {
            const res = await fetch(url, {
                method: currentTemplate.method,
                headers,
                body: JSON.stringify(body)
            });
            const text = await res.text();
            responseDiv.textContent = text;
        } catch (err) {
            responseDiv.textContent = "请求失败：" + err.message;
        }
    });

    // 初始化默认选择
    templateSelect.dispatchEvent(new Event("change"));
})();
