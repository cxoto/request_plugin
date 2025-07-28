// 注册消息监听器
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "parseDiv") {
        console.log("📥 收到解析请求，开始提取数据...");

        try {
            const wordData = extractWordData();
            if (!wordData) {
                console.warn("⚠️ 未找到需要解析的词汇信息");
                sendResponse({ error: "未找到需要解析的词汇信息" });
            } else {
                console.log("✅ 成功提取词汇数据:", wordData);
                sendResponse({ word_data: wordData });
            }
        } catch (err) {
            console.error("❌ 提取词汇数据异常:", err);
            sendResponse({ error: "提取词汇数据异常" });
        }

        return true; // 表示 sendResponse 是异步的
    }
});

// 提取词汇信息
function extractWordData() {
    const shadowHostId = "immersive-translate-modal-selection-root";
    const host = document.getElementById(shadowHostId);

    if (!host || !host.shadowRoot) {
        console.warn(`⚠️ Shadow host 未找到或未挂载: #${shadowHostId}`);
        return null;
    }

    const shadow = host.shadowRoot;
    const container = shadow.querySelector(".word-dictionary");

    if (!container) {
        console.warn("⚠️ 未找到 .word-dictionary 容器");
        return null;
    }

    // 通用提取函数
    const safeText = (selector) =>
        container.querySelector(selector)?.innerText?.trim() || "";

    const originalText = safeText(".word-original-text");
    const phonetic = safeText(".word-phonetic");

    const pos = safeText(".word-dictionary-pos"); // 词性（如 adj.）
    const meaning = safeText(".word-dictionary-meaning");
    const fullMeaning = pos && meaning ? `${pos} ${meaning}` : meaning || pos;

    const word_example = safeText(".word-example");

    return {
        originalText: originalText,
        phonetic: phonetic,
        meaning: fullMeaning,
        word_example
    };
}
