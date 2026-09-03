中山國小聯絡簿與學生簽到系統 v4.1 雲端準備版

使用方式：
1. 解壓縮 zip 檔。
2. 用 Chrome 或 Edge 開啟 index.html。
3. 建議點右上角「全螢幕」，搭配教室觸控式大螢幕使用。
4. 聯絡簿會在一般分頁可見時自動嘗試保持螢幕喚醒，不必進入全螢幕才生效。
5. 若 Windows 電源政策、省電模式或瀏覽器不支援導致喚醒失敗，請到 Windows「螢幕與睡眠」和「螢幕保護程式」調整關閉螢幕與睡眠時間。

Firebase 雲端使用方式：
1. 到 https://console.firebase.google.com/ 建立 Firebase 專案。
2. 在 Authentication 啟用「Google」登入提供者。
3. 建立 Cloud Firestore 資料庫。
4. 將 firestore.rules 的內容貼到 Firestore Rules 並發布。
5. 在專案設定新增 Web App，複製 Firebase SDK 設定。
6. 將設定填入 firebase-config.js。
7. 重新開啟 index.html，按「教師 Google 登入」。
8. 老師登入後，資料會先存在本機，也會同步到老師帳號底下的 Firestore。
9. 按「更新家長分享」後，系統會複製家長只讀連結。

早自修專區：
- 預設關閉，可在「系統設定」開啟「顯示早自修專區」。
- 開啟後會在聯絡簿與學生簽到區中間顯示早自修交代事項。
- 早自修內容依日期儲存，可預先編輯其他日期，文字格式沿用聯絡簿格式設定。

家長分享：
- 家長連結會帶有 ?share=分享代碼。
- 老師可勾選「分享學生出席」決定家長是否看到學生出席區。
- 未勾選時，家長只會看到聯絡簿內容。
- 勾選時，家長會看到聯絡簿內容、座號簽到狀態與當日統計。
- 家長看不到學生姓名、歷史紀錄、名單設定與系統設定。
- 老師修改聯絡簿後，需再按一次「更新家長分享」，家長才會看到新版內容。
- 家長分享頁會依實際日期顯示當天聯絡簿；老師可以先編明天或之後的聯絡簿，內容會先排好，但要到該日期才會顯示在家長連結。
- 分享學生出席時，只會分享當天座號簽到狀態。

firebase-config.js 說明：
- firebaseConfig：貼上 Firebase Web App 設定。
- classConfig.classId：班級代號，英文、數字、底線或連字號，例如 class-601。
- classConfig.className：顯示給家長看的班級名稱。
- classConfig.shareId：可留空，系統會用老師帳號與班級代號產生；若要固定連結，可填自訂代碼，例如 cses-601-2026。
- classConfig.temperatureProxyUrl：Cloudflare Worker 氣溫代理網址。部署 workers/zhongshan-temp-worker.js 後，貼上 Worker 網址，例如 https://chses-zhongshan-temp.帳號.workers.dev/zhongshan-temp。

中山國小氣溫代理設定：
1. 到 https://dash.cloudflare.com/ 建立或登入 Cloudflare 帳號。
2. 進入 Workers & Pages，建立 Worker。
3. 將 workers/zhongshan-temp-worker.js 的內容貼上並部署。
4. 複製 Worker 網址，建議使用 /zhongshan-temp 路徑。
5. 將網址填入 firebase-config.js 的 classConfig.temperatureProxyUrl。
6. 重新開啟聯絡簿，頁首氣溫會讀取官方中山國小儀表板 Id=4 的氣溫值。

若使用指令部署：
1. 安裝 Node.js 後，在本資料夾執行 npx wrangler login。
2. 執行 npx wrangler deploy。
3. 將部署後顯示的 workers.dev 網址加上 /zhongshan-temp，填入 firebase-config.js。

本版修改：
- 新增教師 Google 登入入口。
- 新增 Firestore 雲端同步。
- 新增家長只讀分享連結。
- 保留本機 localStorage 備援，Firebase 尚未設定時仍可照常使用。

注意：
若只是直接開啟 index.html，Google 登入可能因瀏覽器或 Firebase 授權網域限制而無法使用。
正式使用建議部署到 HTTPS 網站，例如 Firebase Hosting、GitHub Pages 或學校網站空間。
