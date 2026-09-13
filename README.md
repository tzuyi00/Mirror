# Mirror

一個透過對話建立「數位分身」的全端網站。使用者先與**採訪模式（Interviewer mode）**的聊天機器人互動，系統會將對話內容整理成個人**檔案頁面（Profile）**。累積足夠資料後,也能切換到**分身模式（Impersonation mode）**，與模擬該使用者說話方式與背景資訊的數位分身對話。

## 使用技術

**前端**
- Next.js 14（App Router）+ TypeScript
- NextAuth.js — 帳密登入、Google / GitHub OAuth、JWT session、middleware 路由保護
- Tailwind CSS + shadcn/ui
- React Context + 自訂 hooks,管理聊天模式、WebSocket 連線、即時檔案更新
- 原生 WebSocket 客戶端,具備自動重連與 HTTP Fallback
- 可安裝的 PWA

**後端**
- Node.js + Express 5 + TypeScript
- Prisma ORM + PostgreSQL
- WebSocket 伺服器,具備心跳偵測、可中斷的請求處理與安全清理機制

**文件**
- 使用 [Fumadocs](https://fumadocs.dev/) 建立文件網站,API Reference 頁面由後端自身的 OpenAPI spec 自動產生

## 功能特色

1. 使用者註冊後，可先透過 Activities 進入**採訪模式（Interviewer mode）**，與 AI 採訪機器人進行對話。系統會從對話中持續擷取與整理使用者資訊，逐步建立個人資料與數位分身所需的背景資訊。
![Activities](https://github.com/user-attachments/assets/515f9866-6922-40e9-913e-8b02dd400bab)
![Interviewing](https://github.com/user-attachments/assets/ea51865d-437b-48f6-bf1a-823464903544)

2. 當系統累積足夠的使用者資訊後，會自動生成個人 Profile 頁面，並透過不同的資料視覺化元件呈現使用者的特質、經歷與偏好。
![Profile](https://github.com/user-attachments/assets/434c2f75-aa8c-4d5b-87d7-bb3b37154d8b)

3. Profile 使用 Progress Bar、Timeline、Spectrum、Tags 等不同 UI 元件，以適合各類資料的方式呈現使用者資訊。
![Profile UI](https://github.com/user-attachments/assets/5a7a79c8-e358-4465-b18f-b5d7dd52a299)

4. 累積足夠資訊後，使用者也可以將聊天室切換至 **分身模式（Impersonation mode）**，與模擬自身說話方式與背景資訊的數位分身進行對話。
![Impersonation Mode](https://github.com/user-attachments/assets/6e21a868-712d-4217-8efe-2d3986f9fce8)

5. 使用者可從右上角的 All Memories 查看系統保存的記憶內容，並進行新增、編輯與刪除，讓數位分身所使用的個人資訊保持正確。
![All Memories](https://github.com/user-attachments/assets/de10afc0-15b4-4f33-bf6a-ee672d94d4de)

6. 除了作為完整的應用程式之外，Mirror 也可作為 Infrastructure Layer，透過 API 將數位分身相關能力提供給外部應用程式整合。因此使用 Fumadocs 建立官方技術文件，分別提供外部（Public）與內部（Private）開發者的使用說明與 API Reference。
![Fumadocs](https://github.com/user-attachments/assets/6506a506-a0e5-4f55-bb27-79d61c0ca2ae)
![API Reference](https://github.com/user-attachments/assets/4c618f90-1085-4b61-ae00-cae25f58d684)


## 開發者導覽

本地開發設定、環境變數、完整目錄結構等技術細節,請參考 **[DEVELOPMENT.md](./DEVELOPMENT.md)**。

