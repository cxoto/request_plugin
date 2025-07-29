// ✅ 消息处理器映射
const messageHandlers = {
    async SHOW_TOAST(message) {
        log("[TOAST]", message.text);
        notify(message.text, message.toastType || "info");
    },

    async parseDiv() {
        log("[PARSE] 开始提取词汇数据...");
        const wordData = extractWordData();
        if (!wordData) {
            throw new Error("未找到需要解析的词汇信息");
        }
        log("[PARSE] ✅ 提取成功:", wordData);
        return { word_data: wordData };
    }
};

// ✅ 注册消息监听器
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    const { action } = message;
    const handler = messageHandlers[action];

    if (!handler) {
        console.warn(`[MESSAGE] ❓ 未知 action: ${action}`);
        return; // 不 return true，表示没有异步处理
    }

    try {
        const result = await handler(message, sender);
        if (result !== undefined) {
            sendResponse(result);
        }
    } catch (err) {
        console.error(`[ERROR] ❌ action: ${action}, 错误:`, err);
        sendResponse({ error: err.message || "处理失败" });
    }

    return true; // 所有 handler 默认异步
});

// ✅ 日志工具
function log(...args) {
    console.log("[ChromaPlugin]", ...args);
}


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

function notify(text, type = "info") {
    const existing = document.getElementById("chroma-toast");
    if (existing) existing.remove(); // 防止重复插入

    const toast = document.createElement("div");
    toast.id = "chroma-toast";
    toast.innerText = text;

    // 不同类型颜色
    const bgColors = {
        success: "rgba(56, 142, 60, 0.9)",   // 绿色
        error: "rgba(211, 47, 47, 0.9)",     // 红色
        info: "rgba(66, 66, 66, 0.9)"        // 黑灰色
    };

    Object.assign(toast.style, {
        position: "fixed",
        bottom: "20px",
        right: "20px",
        background: bgColors[type] || bgColors.info,
        color: "#fff",
        padding: "10px 16px",
        borderRadius: "8px",
        fontSize: "14px",
        zIndex: 999999,
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        transition: "opacity 0.3s ease",
        opacity: "1"
    });

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}
