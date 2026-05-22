中山國小聯絡簿與學生簽到系統 v4.1 雲端準備版

使用方式：
1. 解壓縮 zip 檔。
2. 用 Chrome 或 Edge 開啟 index.html。
3. 建議點右上角「全螢幕」，搭配教室觸控式大螢幕使用。

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

家長分享：
- 家長連結會帶有 ?share=分享代碼。
- 老師可勾選「分享學生出席」決定家長是否看到學生出席區。
- 未勾選時，家長只會看到聯絡簿內容。
- 勾選時，家長會看到聯絡簿內容、座號簽到狀態與當日統計。
- 家長看不到學生姓名、歷史紀錄、名單設定與系統設定。
- 老師修改聯絡簿後，需再按一次「更新家長分享」，家長才會看到新版內容。
- 每次只會公開老師目前選取日期的聯絡簿，以及勾選時的當日座號簽到狀態，不會公開整本歷史紀錄。

firebase-config.js 說明：
- firebaseConfig：貼上 Firebase Web App 設定。
- classConfig.classId：班級代號，英文、數字、底線或連字號，例如 class-601。
- classConfig.className：顯示給家長看的班級名稱。
- classConfig.shareId：可留空，系統會用老師帳號與班級代號產生；若要固定連結，可填自訂代碼，例如 cses-601-2026。

本版修改：
- 新增教師 Google 登入入口。
- 新增 Firestore 雲端同步。
- 新增家長只讀分享連結。
- 保留本機 localStorage 備援，Firebase 尚未設定時仍可照常使用。

注意：
若只是直接開啟 index.html，Google 登入可能因瀏覽器或 Firebase 授權網域限制而無法使用。
正式使用建議部署到 HTTPS 網站，例如 Firebase Hosting、GitHub Pages 或學校網站空間。
