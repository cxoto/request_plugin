// 监听来自后台的请求
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_SELECTION") {
    // 获取用户当前选中的文本
    const selection = window.getSelection().toString();
    console.log("选中的内容是：", selection);
    // 把选中的内容发回给后台
    sendResponse({ selection });
  }
});
