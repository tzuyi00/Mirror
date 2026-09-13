# Mirror

一個透過對話建立「數位分身」的全端網站。使用者先與**採訪模式（Interviewer mode）**的聊天機器人互動,系統會將對話內容整理成個人**檔案頁面（Profile）**; 累積足夠資料後,也能切換到**分身模式（Impersonation mode）**, 與一個訓練成該使用者說話風格的聊天機器人對話。

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

* 當 User 最初註冊系統後，可以先透過 Activities 與 Interviewer Mode 聊天室互動，讓 Retriver 系統獲取資料，持續了解 User ，訓練出與 User 很相似的機器人分身。
![Activities](https://github.com/user-attachments/assets/515f9866-6922-40e9-913e-8b02dd400bab)
![Interviewing](https://github.com/user-attachments/assets/ea51865d-437b-48f6-bf1a-823464903544)

* 當 User 資料搜集到一定程度後，將自動的生成專屬於他的 Profile 頁面，並透過各種不同效果的 UI 方式，完美呈現 User 的個人特色。
![Profile](https://github.com/user-attachments/assets/434c2f75-aa8c-4d5b-87d7-bb3b37154d8b)

* 例如有 Progress bar, Timeline , Spectrum, Tags 等等的方式。
![Profile UI](https://github.com/user-attachments/assets/5a7a79c8-e358-4465-b18f-b5d7dd52a299)

* 此時也可以將聊天室切換至 Impersonation Mode，與他的分身互動，體驗一個相當相似且充分了解 User 的機器人。
![Impersonation Mode](https://github.com/user-attachments/assets/6e21a868-712d-4217-8efe-2d3986f9fce8)

* 此外，還有附加的功能是，在版面的右上角可以查看 All Memories，若有想要修正的 Memories，可以進行新增刪除修改，幫助這位專屬機器人更準確的了解 User ！
![All Memories](https://github.com/user-attachments/assets/de10afc0-15b4-4f33-bf6a-ee672d94d4de)

* 此專案本身就是一個完整的應用程式之外，也可作為 Infrastructure Layer，將訓練出的機器人分身提供給外部使用。因此使用了 Fumadocs 做官方說明文件，包含了給 外部(public) 與 內部(private) 開發者的使用說明。
![Fumadocs](https://github.com/user-attachments/assets/6506a506-a0e5-4f55-bb27-79d61c0ca2ae)


## 開發者導覽

本地開發設定、環境變數、完整目錄結構等技術細節,請參考 **[DEVELOPMENT.md](./DEVELOPMENT.md)**。

