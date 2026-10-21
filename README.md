# 製程資料室｜半成品與調理設備資料庫

四廠 Excel → GitHub Actions 自動整理 → data-json → GitHub Pages 更新網站。

新版介面：深綠導覽列、淺色工作區、統計卡、上方集中複選篩選、完整寬度明細表、設備與狀態標籤、風險分色、固定表頭、手機排版。

## 第一次架設（只設定一次）

1. 將壓縮檔解壓，將**裡面的檔案與資料夾**上傳到GitHub儲存庫根目錄。務必包含 `.github/workflows/update-and-deploy.yml`，不要再包在另一層資料夾裡。
2. 進入 **Settings → Pages → Build and deployment → Source**，改選 **GitHub Actions**。這版不要選 Deploy from a branch。
3. 進入 **Settings → Actions → General → Workflow permissions**，選擇 **Read and write permissions**，按 Save。組織可能需由管理員允許，受保護分支也需允許流程回寫產生的資料。
4. 進入 **Actions → 更新 Excel 資料並發布網站 → Run workflow**，選擇預設分支，執行第一次發布。
5. 等待 build、deploy 皆呈現綠色勾勾；Pages頁面或部署紀錄會顯示網站網址。

支援預設分支main或master的推送自動觸發。其他分支名稱請修改工作流程的branches；手動Run workflow讀取預設分支。

## 以後更新：直接替換 Excel

1. 打開 GitHub 儲存庫的 **data** 資料夾。
2. 新版Excel依工廠命名為 **晉欣.xlsx、新豐.xlsx、大溪.xlsx、長家.xlsx**，只準備有更新的工廠。
3. 在data中按 **Add file → Upload files**，上傳同名新版檔案，取代原檔。
4. 按 **Commit changes**，提交到預設分支。
5. 等待Actions完成，重新整理網站即可看到新版資料。

例如只更新晉欣：上傳新版 `晉欣.xlsx` 至 `data/晉欣.xlsx`，其餘三廠保留原檔。**不必手動改JSON或程式，也不必在電腦安裝Python。**

請替換同名檔，不要留下舊檔再新增「晉欣(1).xlsx」。同廠有多份檔案時會停止並指出錯誤。檔名須保留正確工廠名稱，Excel須維持原五個明細分頁與欄位結構。

## 自動更新內容

- 讀取四廠最新版Excel，依欄位名稱辨識。
- 產生data-json/data.json及data-json/data.js。
- 驗證筆數、來源、百分比及複選邏輯，筆數沒有固定限制。
- 以github-actions[bot]產生「data: update dashboard JSON」提交，讓你能查看轉換紀錄。
- 發布最新網站至同一GitHub Pages網址，更新頁面的資料轉換日期及筆數。

資料檢查失敗時不發布，既有線上版本持續使用。可在Actions查看紅色步驟的原因。必須上傳並Commit才會觸發，網站不會直接讀取電腦上未上傳的檔案。

## 資料夾

| 位置 | 用途 | 日常需要操作嗎 |
|---|---|---|
| data/ | 四廠原始Excel | **只替換這裡的Excel** |
| data-json/ | 自動產生的網站資料 | 不需要 |
| scripts/ | 資料轉換、驗證及打包 | 不需要 |
| .github/workflows/ | 自動更新與部署流程 | 第一次完整上傳 |
| index.html、app.js、filters.js、style.css | 網站介面 | 不需要 |

## 查詢及資料規則

- 溫層、4℃麵／飯／其他、狀態、工廠、設備、品類均可複選；同組採「或」，不同組採「且」。
- 4℃細分類僅作用於4℃資料，不會排除同時選取的18℃或冷凍資料。
- 預設全部勾選，各組有全選、清空及重設全部。
- 搜尋半成品、商品、工廠、設備、品類及風險；多個關鍵字需同時符合。
- 點半成品查看來源列，匯出CSV涵蓋全部篩選結果。
- 每列保留商品與半成品關聯；同名半成品不合併。
- 原始「架上」顯示「上架」；空白、無狀態欄及「-」顯示「未標示」。
- 製成率依Excel原始百分比格式轉換，保留大於100%的資料。
- 品類、設備、檢核及風險沿用來源；萬能炒食機一併納入。
- 公式結果讀取Excel快取；請先用Excel開啟並儲存來源檔，確保風險等公式已計算。

## 本機查看與驗證

開啟index.html即可使用，不需啟動伺服器。快速預覽.html也可單獨開啟查看新版介面，但只是交付時的資料快照；GitHub網站入口使用index.html。

手動驗證：

```bash
python -m pip install -r requirements.txt
python scripts/import_data.py data --output data-json
node scripts/verify.cjs
python scripts/package_site.py
```

本次驗證資料轉換、一致性、篩選及網站打包，尚未在你的GitHub實際執行Actions或進行瀏覽器畫面檢查。工作流程需依上述設定啟用才會運作。

參考：[GitHub Pages自訂工作流程官方說明](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。
