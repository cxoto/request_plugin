// 替换模板中的占位符 ${key}
function replacePlaceholders(objOrStr, values) {
    const jsonStr = typeof objOrStr === "string"
        ? objOrStr
        : JSON.stringify(objOrStr);

    const replaced = jsonStr.replace(/\$\{(\w+)\}/g, (_, key) => values[key] || "");

    return typeof objOrStr === "string" ? replaced : JSON.parse(replaced);
}


// ✅ 清空并重新创建 contextMenus
function refreshContextMenus(templates) {
    chrome.contextMenus.removeAll(() => {
        templates.forEach((tpl) => {
            chrome.contextMenus.create({
                id: tpl.name,
                title: tpl.name,
                contexts: ["selection"]
            });
        });
    });
}

// ✅ 插件启动时加载右键菜单（防止插件刷新时为空）
chrome.runtime.onStartup.addListener(async () => {
    const { templates } = await chrome.storage.local.get("templates");
    refreshContextMenus(templates || []);
});

// ✅ 插件首次安装时也创建菜单
chrome.runtime.onInstalled.addListener(async () => {
    const { templates } = await chrome.storage.local.get("templates");
    refreshContextMenus(templates || []);
});

// ✅ 监听配置变化，自动刷新菜单
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.templates) {
        refreshContextMenus(changes.templates.newValue || []);
    }
});


// ✅ 右键菜单点击事件
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    const { templates } = await chrome.storage.local.get("templates");
    const config = templates.find(tpl => tpl.name === info.menuItemId);
    if (!config) {
        console.warn("未找到配置模板", info.menuItemId);
        return;
    }
    const [tabId] = [tab.id];
    const response = await chrome.tabs.sendMessage(tabId, { action: "parseDiv" });
    console.log("✅ 来自 content-script 的数据：", response);
    const wordData = response.word_data || {};
    // 提取所有占位符
    const allPlaceholders = extractPlaceholders(config);
    // 过滤 realPlaceholders：去掉 "input" 和 wordData 中已有的 key
    const wordDataKeys = Object.keys(wordData);
    const realPlaceholders = [...new Set(
        allPlaceholders.filter(p => p !== "input" && !wordDataKeys.includes(p))
    )];

    // 把 wordData 的键值对填入 placeholderValues
    const placeholderValues = { input: info.selectionText, ...wordData };


    console.log("✅ placeholderValues: ", placeholderValues);

    if (realPlaceholders.length > 0) {
        // 打开一个参数填写窗口
        await chrome.storage.local.set({ pendingPlaceholders: realPlaceholders });

        chrome.windows.create({
            url: chrome.runtime.getURL("input.html"),
            type: "popup",
            width: 350,
            height: 500
        });


        // 存下来等待提交表单
        chrome.runtime.onMessage.addListener(function handler(message) {
            if (message.type === "FORM_SUBMIT") {
                Object.assign(placeholderValues, message.values);

                // 构造请求
                const finalUrl = replacePlaceholders(config.url, placeholderValues);
                const finalHeaders = replacePlaceholders(config.headers, placeholderValues);
                const finalBody = replacePlaceholders(config.body, placeholderValues);

                fetch(finalUrl, {
                    method: config.method,
                    headers: finalHeaders,
                    body: JSON.stringify(finalBody)
                }).then(res => res.text()).then(result => {
                    console.log("API 返回：", result);
                });

                // 移除监听器，避免重复响应
                chrome.runtime.onMessage.removeListener(handler);
            }
        });
    } else {
        // 没有额外参数，直接调用
        const finalUrl = replacePlaceholders(config.url, placeholderValues);
        const finalHeaders = replacePlaceholders(config.headers, placeholderValues);
        const finalBody = replacePlaceholders(config.body, placeholderValues);

        const response = await fetch(finalUrl, {
            method: config.method,
            headers: finalHeaders,
            body: JSON.stringify(finalBody)
        });

        const result = await response.text();

        console.log("API 调用结果：", result);
    }
});

function extractPlaceholders(template) {
    const str = JSON.stringify(template);
    const matches = [...str.matchAll(/\$\{(\w+)\}/g)];
    return matches.map(m => m[1]); 
}
