(async () => {
    console.log("✅ content-script 已注入");

    try {
        const wordData = {"abc" : "abc"};

        if (wordData) {
            console.log("Word Inputs:", wordData);
            const response = await chrome.runtime.sendMessage({
                type: "word_data",
                payload: wordData
            });
            console.log("📩 来自 background 的响应:", response);
        }
    } catch (err) {
        console.error("❌ 消息发送失败:", err);
    }
})();


function extractWordData() {
    const container = document.querySelector('.word-dictionary');
    if (!container) return null;

    const originalText = container.querySelector('.word-original-text')?.innerText?.trim() || '';
    const phonetic = container.querySelector('.word-phonetic')?.innerText?.trim() || '';
    const meaning = container.querySelector('.word-dictionary-meaning')?.innerText?.trim() || '';
    const example = container.querySelector('.word-example span')?.innerText?.trim() || '';
    const exampleTranslation = container.querySelector('.word-example .word-example-target')?.innerText?.trim() || '';

    return {
        originalText,
        phonetic,
        meaning,
        example,
        exampleTranslation
    };
}
