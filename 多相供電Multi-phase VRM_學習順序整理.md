---
title: 多相供電 Multi-phase VRM：學習順序整理與補充（互動教學頁企劃）
date: 2026-10-01
tags: [工作技術, 電源設計, 多相供電, VRM, DrMOS, SPS, IMVP9, LoadLine, Buck, 教學素材, 互動教學]
---

# 多相供電 Multi-phase VRM：學習順序整理與補充

> **2026-10-01 整理。** 原稿 `多相供電Multi-phase VRM.md` 是 Gemini 對話匯出（6 輪），原稿不動，本檔另存。
> 原稿六輪中，**Turn 2（DrMOS／SPS）、Turn 4（多相特色與問題）、Turn 5（Intel 45W／28W 相數）、Turn 6（IMVP9.x）** 是多相 VRM 主體；Turn 1（SEPIC／Flyback／Buck-Boost）已由 DC-DC 拓撲系列涵蓋、Turn 3（PoE PD）已由 PoE PD 系列涵蓋，本系列只當「延伸閱讀」連過去。
>
> **來源標示**：〔原稿〕＝原對話內容；〔修正〕＝原稿有誤或不精確處；〔補充〕＝Claude 依一般電源設計知識補上，屬 AI 整理，數值為示意或常見範圍；〔待查〕＝涉及 Intel 規範（IMVP／PDG／EDS，多為 NDA 文件）或特定晶片型號，原稿與本檔都無法保證，正式設計前要對照規格書。

---

## 一、為什麼原稿要重排順序

原稿是「問到哪答到哪」：先講 DrMOS（元件），才講多相的原理，再跳到 Intel 平台相數，最後才講規範。對第一次學的人，問題有三個：

1. **先看到解法、後看到問題**：DrMOS 是用來解決「寄生電感」與「佈局面積」的，但讀者還不知道多相為什麼會有這些問題。
2. **缺少前置知識**：整份原稿假設讀者已懂同步 Buck 的佔空比、電感漣波、導通／切換損耗，沒有這些就看不懂「為什麼單相做不到」。
3. **重要的定量關係沒有給**：「紋波抵消」「等效頻率 N 倍」「動態響應快」都只有結論、沒有公式，做成互動頁時無法讓滑桿驅動計算。

所以重排原則是：**問題 → 原理 → 元件 → 控制 → 規範 → 實例 → 實作**，每一站都先回答「為什麼需要」，再講「怎麼做」，並把每站的核心公式補齊，讓每一站都能變成一頁有滑桿、有波形的互動頁。

---

## 縮寫對照（Abbreviations）

| 縮寫 | 完整英文名稱 | 中文說明 |
|---|---|---|
| VRM | Voltage Regulator Module | 電壓調節模組，CPU／GPU 的板端供電電路 |
| VR | Voltage Regulator | 電壓調節器（Intel 文件中泛指一個電源軌的穩壓電路） |
| CPU／GPU | Central Processing Unit／Graphics Processing Unit | 中央處理器／圖形處理器 |
| MOSFET | Metal-Oxide-Semiconductor Field-Effect Transistor | 金氧半場效電晶體 |
| HS／LS | High-Side／Low-Side (MOSFET) | 高側／低側開關 |
| SW node | Switching Node | 開關節點（高低側 MOSFET 與電感的連接點） |
| DrMOS | Driver-MOSFET | 驅動 IC＋高／低側 MOSFET 整合封裝 |
| SPS | Smart Power Stage | 智慧功率級，DrMOS 再整合電流與溫度感測 |
| QFN／TQFN | Quad Flat No-lead／Thin Quad Flat No-lead | 無引腳方形扁平封裝（薄型） |
| PWM | Pulse-Width Modulation | 脈波寬度調變 |
| D | Duty Cycle | 佔空比 |
| f<sub>sw</sub> | Switching Frequency | 開關頻率 |
| f<sub>c</sub> | Crossover Frequency | 控制迴路頻寬（交越頻率） |
| RMS | Root Mean Square | 均方根值 |
| CCM／DCM | Continuous／Discontinuous Conduction Mode | 連續／非連續導通模式 |
| DEM | Diode Emulation Mode | 二極體模擬模式（輕載時不讓電感電流反向） |
| COT | Constant On-Time | 定導通時間控制 |
| R3 | Robust Ripple Regulator | Renesas 專有調變架構 |
| G-NAVP | Green Native Adaptive Voltage Positioning | Richtek 專有 AVP 控制架構 |
| AQR | Adaptive Quick Response | Richtek 的暫態快速響應機制 |
| SPM | Smart Phase Management | Richtek 的自動加減相功能 |
| MLCC | Multilayer Ceramic Capacitor | 積層陶瓷電容 |
| SP-CAP／POSCAP | Specialty Polymer Capacitor／Polymer Organic Semiconductor Capacitor | Panasonic 聚合物電容系列名稱 |
| ESR／ESL | Equivalent Series Resistance／Inductance | 等效串聯電阻／電感 |
| DCR | DC Resistance | 電感的直流電阻（用來做無損電流感測） |
| NTC | Negative Temperature Coefficient (thermistor) | 負溫度係數熱敏電阻 |
| IMON／TMON | Current Monitor／Temperature Monitor | 電流監控／溫度監控輸出訊號 |
| OCP／OTP | Over-Current Protection／Over-Temperature Protection | 過電流／過溫保護 |
| Q<sub>rr</sub> | Reverse Recovery Charge | 體二極體反向恢復電荷 |
| Q<sub>g</sub> | Gate Charge | MOSFET 閘極電荷 |
| R<sub>DS(on)</sub> | Drain-Source On-Resistance | MOSFET 導通電阻 |
| AVP | Adaptive Voltage Positioning | 主動電壓定位，即 Load-line 下垂 |
| R<sub>LL</sub> | Load-Line Resistance | Load-line 斜率 |
| VID | Voltage Identification | 電壓識別碼，CPU 要求的目標電壓 |
| SVID | Serial Voltage Identification | CPU 與 VRM 控制器間的三線序列匯流排 |
| VCLK／VDIO／ALERT# | SVID Clock／SVID Data I/O／Alert (active low) | SVID 的三條訊號線 |
| PS0–PS4 | Power State 0–4 | SVID 定義的 VR 電源狀態 |
| IMVP | Intel Mobile Voltage Positioning | Intel 行動平台核心供電規範 |
| SVI2／SVI3 | Serial VID Interface 2／3 | AMD 對應的 CPU–VRM 介面 |
| I²C | Inter-Integrated Circuit | 雙線序列匯流排 |
| Icc_max（ICCMAX） | Maximum Core Current | 電源軌最大電流 |
| TDP | Thermal Design Power | 熱設計功耗 |
| PL1／PL2／PL4 | Power Limit 1／2／4 | Intel 長時間／短時間功耗上限／瞬間峰值功率限制 |
| IA | Intel Architecture (CPU cores) | CPU 核心電源軌（VCC_CORE） |
| GT | Graphics Technology | 內顯電源軌（VCC_GT） |
| SA | System Agent | 系統代理電源軌（VCCSA：記憶體控制器、I/O） |
| VCCIN_AUX | Auxiliary Input Voltage | 輔助輸入電源軌，供晶片內部 FIVR／LDO 再轉換 |
| VCC_SENSE／VSS_SENSE | Core Voltage／Ground Sense | CPU 提供給 VRM 遠端差分感測的專用腳位 |
| FIVR | Fully Integrated Voltage Regulator | Intel 晶片內整合穩壓器 |
| LDO | Low-Dropout Regulator | 低壓差線性穩壓器 |
| ADL／RPL／MTL | Alder Lake／Raptor Lake／Meteor Lake | Intel 第 12 代／第 13 代／Core Ultra 第一代平台代號（-P、-H、-N、-S 為產品系列） |
| PDG／EDS | Platform Design Guide／External Design Specification | Intel 平台設計指南／外部設計規格（多為 NDA 文件） |
| NDA | Non-Disclosure Agreement | 保密協議 |
| SKU | Stock Keeping Unit | 產品型號／規格版本 |
| OEM | Original Equipment Manufacturer | 品牌或代工廠 |
| BGA | Ball Grid Array | 球柵陣列封裝 |
| PCB | Printed Circuit Board | 印刷電路板 |
| EMI | Electromagnetic Interference | 電磁干擾 |
| MTBF | Mean Time Between Failures | 平均故障間隔時間 |
| TLVR | Trans-inductor Voltage Regulator | 跨電感穩壓器（伺服器高速暫態架構） |
| VRTT | Voltage Regulator Test Tool | Intel VR 負載暫態測試工具 |
| SEPIC | Single-Ended Primary-Inductor Converter | 單端初級電感轉換器（原稿 Turn 1） |
| PoE／PD／PSE | Power over Ethernet／Powered Device／Power Sourcing Equipment | 乙太網路供電／受電端／供電端（原稿 Turn 3） |

---

## 二、學習地圖（總覽）

| 站 | 主題 | 對應原稿 | 一句話學習目標 | 互動頁核心元件 |
|---|---|---|---|---|
| 00 | 前置：同步 Buck 快速複習 | 無（補充） | 會算 D、ΔI_L、導通與切換損耗 | 連 DC-DC 系列 Buck 頁＋小計算器 |
| 01 | 為什麼需要多相 | Turn 4 開頭 | 理解「低電壓 × 大電流」讓單相在物理上做不到 | CPU 功率→電流→單相損耗計算器 |
| 02 | 交錯並聯與紋波抵消 | Turn 4「一」 | 會用 N、D 算輸出紋波與輸入 RMS 電流，知道 D=k/N 時完全抵消 | N 相電流波形動畫＋K(D,N) 曲線 |
| 03 | 功率級：分離式 → DrMOS → SPS | Turn 2、Turn 4「二.2」 | 知道寄生電感怎麼造成振鈴、整合封裝解決了什麼 | V=L·di/dt 振鈴模擬＋三代比較卡 |
| 04 | 電流偵測與均流 | Turn 4「二.1」、Turn 2 SPS 表 | 會設計 DCR 感測 RC、理解溫漂與 SPS IMON 的差異 | 相間 DCR 誤差 → 電流分配與溫度模擬 |
| 05 | 負載暫態與 Load-line（AVP） | Turn 6「一.3」、Turn 4「三.5」 | 理解為什麼刻意讓電壓下垂、三級電容各管哪段頻率 | 負載階躍波形：有／無 AVP、電容組合切換 |
| 06 | 效率、相數切換與省電狀態 | Turn 4「二.3」、Turn 6「一.4」 | 會看效率曲線，理解 Phase Shedding 與 PS0–PS4 | 效率 vs 負載曲線，自動切相動畫 |
| 07 | Intel IMVP9.x 與 SVID | Turn 6 | 知道多軌控制器、SVID 指令、IMVP8→9 差異 | 電源軌架構圖＋SVID 時序示意 |
| 08 | 實例：45W／28W 筆電要幾相 | Turn 5 | 會從 Icc_max 與每相熱電流推出相數與控制器配置 | 相數推估計算器（4+2、3+2…） |
| 09 | Layout 與量測除錯實務 | Turn 4「三」、Turn 6「三」 | 能用檢查清單審 VRM 佈局、知道怎麼量 | 可點擊佈局圖熱點＋檢查清單＋故障對照表 |
| 延伸 | 伺服器／桌機／其他平台 | 無（補充） | 知道 TLVR、48V、Phase Doubler、AMD SVI3 等名詞 | 文字卡片 |

建議學習路徑：00 → 01 → 02 是「為什麼與原理」；03 → 04 → 05 → 06 是「工程問題與解法」；07 → 08 是「Intel 平台落地」；09 收尾做實作。已有 Buck 基礎的人可從 01 開始。

---

## 三、各站內容（含修正與補充）

### 站 00　前置：同步 Buck 快速複習〔補充〕

多相 VRM 每一相就是一個**同步降壓（Synchronous Buck）**：高側 MOSFET（HS）導通時電感充電、低側 MOSFET（LS）導通時電感續流。要讀懂後面各站，只需要這幾個關係：

| 量 | 公式 | 說明 |
|---|---|---|
| 佔空比 | D ≈ Vout ／ Vin | 12 V → 1.0 V 時 D ≈ 0.083 |
| HS 導通時間 | t_on = D ／ fsw | 500 kHz 時約 167 ns，接近控制器最小導通時間，這是單相很難再降 D 或升頻的原因之一 |
| 電感漣波 | ΔI_L = (Vin − Vout) · D ／ (L · fsw) | L = 150 nH、500 kHz 時約 12 A |
| 導通損耗 | P_cond ≈ I² · [D · R_HS + (1 − D) · R_LS] + I² · DCR | 與電流**平方**成正比 |
| 切換損耗 | P_sw ≈ ½ · Vin · I · (t_r + t_f) · fsw + Q_g · V_drv · fsw | 與 Vin、fsw 成正比 |

> 低 D 的特性：12 V 轉 1 V 時 LS 導通 92% 的時間，所以**低側 MOSFET 的 R_DS(on) 決定大部分導通損耗**，高側 MOSFET 則要切換快（低 Q_g）。這也是 DrMOS 內兩顆 FET 尺寸不一樣的原因。

**互動頁設計**：直接連 DC-DC 系列的 Buck 頁（https://dcdc-topology-series.vercel.app/buck.html），本頁只放一個「12 V → Vcore」小計算器，給後面各站共用參數（Vin、Vout、fsw、L）。

---

### 站 01　為什麼需要多相

**〔原稿〕** 現代處理器核心電壓降到 0.8–1.1 V，暫態電流 200–500 A，單相 Buck 在導通損耗與元件耐受度上做不到。

**〔補充〕把「做不到」量化**：

1. **功率不變、電壓下降 → 電流暴增**：P = V · I。一顆筆電 CPU 在 PL2 115 W 時，若核心軌分到約 100 W、Vcore ≈ 1.0 V，電流就是 100 A；同樣 100 W 若是 12 V 只有 8.3 A。
2. **導通損耗與電流平方成正比**：假設 LS R_DS(on) = 1 mΩ、D = 0.083，110 A 單相：P ≈ 110² × 1 mΩ × 0.917 ≈ **11.1 W**，集中在一顆 MOSFET 上，筆電散熱不可能。拆成 4 相每相 27.5 A：每相 0.69 W、合計 **2.8 W**，總損耗變成 1/4（總導通損耗 ∝ I²／N）。
3. **元件極限**：單顆電感飽和電流、單顆 MOSFET 封裝電流、PCB 銅箔載流都有上限。
4. **暫態要求**：單相要做到 µs 級響應，必須拉高 fsw，切換損耗又跟著上升（見站 06）。

**一句話結論**：多相是把「一個大電流問題」拆成「N 個中電流問題」，並且用相位交錯換來紋波與響應上的好處（站 02）。

**互動頁設計**：
- 輸入：CPU 功率、Vcore、Vin、R_DS(on)、相數 N。
- 輸出：總電流、每相電流、總導通損耗、每相損耗長條圖；N 從 1 拉到 8 時看損耗曲線 ∝ 1／N 下降。
- 小測驗：「同樣 100 W，Vcore 從 1.2 V 降到 0.8 V，導通損耗變成幾倍？」（答：(1.2／0.8)² ≈ 2.25 倍）

---

### 站 02　交錯並聯（Interleaving）與紋波抵消

**〔原稿〕** N 相彼此錯開 360°／N 輪流導通；輸入電流變成多個小脈衝、輸出電感電流的交流成分在電容端互相抵消；輸出端紋波頻率為 N × fsw。

**〔補充〕紋波抵消不是固定的，要看 D**：

設 m = floor(N · D)，輸出總漣波與「單相電感漣波 ΔI_L」的比值：

> **K(D, N) = (N·D − m) · (m + 1 − N·D) ／ [N · D · (1 − D)]**

- **D = k／N（k 為整數）時 K = 0，完全抵消**。例如 2 相在 D = 0.5、4 相在 D = 0.25／0.5／0.75。
- 驗算：2 相、D = 0.25 → K = 0.5 × 0.5 ／ (2 × 0.25 × 0.75) = 0.667。
- **VRM 的實際情況**：12 V → 1 V，D ≈ 0.083，4 相時 N·D = 0.33，K ≈ 0.73——**低 D 時抵消效果其實不大**。多相在 VRM 上真正的好處是「漣波頻率變 N 倍」與「每相電感可以用小電感（漣波大一點沒關係）換取快的電流斜率」，而不是漣波幅度大降。原稿「相互抵消」的說法沒錯，但容易讓人以為漣波會大幅變小，做頁面時要把這點講清楚。

**輸入電容 RMS 電流**（忽略電感漣波）：

> **I_Cin,rms ≈ I_out · √[(D − m／N) · ((m + 1)／N − D)]**

- N = 1 時退化成 I_out · √[D(1 − D)]。
- 110 A、D = 0.083：單相約 **30 A rms**；4 相約 **13 A rms**。輸入 MLCC 顆數可大幅減少——這個好處在低 D 時反而比輸出端明顯。

**〔補充〕電流斜率（暫態能力）**：每相電感電流最大上升斜率 = (Vin − Vout)／L，N 相合計 × N。L = 150 nH、11 V 壓差時每相約 73 A/µs，4 相約 290 A/µs。這是 VRM 本身能「追上」負載的極限，追不上的部分由輸出電容補（站 05）。

**〔修正〕「動態響應極快」要拆開說**：響應速度由兩件事決定——(1) 控制迴路頻寬（多相因漣波頻率 N 倍，迴路頻寬可以設得比單相高）；(2) 上面的電感電流斜率。原稿只說「等效頻率倍增所以響應快」，少了第二點。

**互動頁設計**（本系列最重要的一頁）：
- 滑桿：N（1–8）、Vin、Vout（決定 D）、L、fsw。
- 動畫：N 條相電流三角波依 360°／N 錯開，下方疊加成總電流；HS 閘極訊號同步顯示。
- 圖表：K(D, N) 對 D 的曲線（N = 1–6 疊圖），目前操作點用圓點標示；輸入 RMS 電流對 D 的曲線。
- 小測驗：「4 相要在什麼 D 完全抵消？」「12 V → 1 V 時多相的主要好處是什麼？」

---

### 站 03　功率級：分離式 → DrMOS → SPS

**〔原稿〕** DrMOS（Driver-MOSFET）把閘極驅動 IC、HS FET、LS FET 封裝在一起，Intel 2004 年提出規範；好處是降低寄生電感、支援高頻、省 PCB 面積、改善死區與散熱。SPS（Smart Power Stage）再整合電流與溫度感測。

**問題先講（原稿放在 Turn 4「二.2」）**：多相下每相數十安培快速切換，驅動器→閘極、HS 汲極→輸入電容→LS 源極這兩個迴路若拉長，寄生電感會產生 V = L · di/dt 突波。
- 例：熱迴路（hot loop）寄生 1 nH、電流 30 A 在 5 ns 內切換，di/dt = 6 A/ns → 突波 6 V，疊加在 12 V 上就是 18 V 以上，接近 25 V 耐壓 MOSFET 的餘裕，且振鈴頻率在數百 MHz，是輻射 EMI 來源。

**〔補充〕三代功率級比較**：

| 項目 | 分離式（Driver＋2 FET） | DrMOS | SPS（Smart Power Stage） |
|---|---|---|---|
| 封裝 | 3 顆元件 | 1 顆 QFN（常見 5×5、4×5 mm） | 1 顆 QFN |
| 閘極迴路 | PCB 走線，nH 級 | 封裝內，大幅縮短 | 同 DrMOS |
| 電流感測 | 外部 DCR 或電阻 | 外部 DCR | 內建電流鏡，輸出 IMON |
| 溫度感測 | 板端 NTC | 板端 NTC（部分有 TMON） | 內建，輸出 TMON |
| 保護 | 控制器端 | 基本 OTP、直通保護 | 逐週期 OCP、故障回報 |
| 常見電流等級 | — | 40–70 A | 50–90 A 以上 |

**〔補充〕DrMOS 內兩顆 FET 為什麼不一樣大**：低 D 下 LS 導通時間長，所以 LS 用大面積、低 R_DS(on)；HS 導通時間短但承擔切換損耗，所以用小面積、低 Q_g。

**〔補充〕死區時間與體二極體**：HS 關、LS 開之間若死區太長，電流走 LS 體二極體（壓降約 0.7 V），產生導通損耗與反向恢復損耗（Qrr）；太短則有直通（shoot-through）風險。整合驅動器可以依實際切換狀態自適應調整（adaptive dead time）。

**〔修正〕** 原稿說「DrMOS 可在 1 MHz 以上維持高效率」：可以跑，但筆電與伺服器 VRM 實務上多在 **300 kHz–1 MHz**，取決於效率與暫態的取捨；不要讓讀者以為 DrMOS 就等於 MHz 級。

**互動頁設計**：
- 振鈴模擬：滑桿調寄生電感（0.2–3 nH）、切換時間、負載電流，畫出 SW 節點電壓波形（二階 RLC 阻尼振盪），標示峰值與 MOSFET 耐壓線。
- 「分離式 / DrMOS / SPS」三張可切換的方塊圖，點方塊看說明。

---

### 站 04　電流偵測與相間均流

**〔原稿〕** 元件公差（DCR、R_DS(on)）、走線不對稱、溫度梯度會讓某一相分到過多電流而過熱；解法是控制器的均流迴路，以及用 SPS 取代溫漂大的 DCR 感測，精度收斂到 ±2%。

**〔補充〕為什麼會不平衡（先講原理）**：若沒有均流控制，各相電流大致由「各相路徑總電阻」決定（電阻小的分得多），電流多→溫度高→銅的電阻上升，這是**負回授**，所以 DC 偏差不會無限擴大；真正危險的是 MOSFET 或驅動時序差異造成的動態不平衡，以及電流大的相溫度高、壽命短。均流迴路會依各相電流誤差微調該相 PWM 的導通時間。

**〔補充〕DCR 感測原理**：電感兩端並聯 R、C，當 **R · C = L ／ DCR** 時，電容電壓 = I_L · DCR，可以無損地量到電感電流。
- 例：L = 150 nH、DCR = 0.2 mΩ → τ = 750 µs，可選 R = 3.4 kΩ、C = 0.22 µF。
- RC 與 L／DCR 不匹配時，暫態時感測電流會過衝或拖尾，影響 droop 與 OCP。
- 銅的溫度係數約 **+0.39%／°C**（原稿這個數字正確）：25 °C → 85 °C，DCR 上升約 23%，量到的電流就偏高 23%。所以要用 NTC 熱敏電阻網路做溫度補償，而且 NTC 要貼近電感、熱耦合要好。
- 電感本身 DCR 出廠公差也常有 ±5–7%。

**〔修正〕原稿 DrMOS「DCR 精度約 ±7%～10%」**：這是未做好溫補時的量級；溫補良好的 DCR 感測在設計良好的板子上可做到數個百分比。SPS 的優勢是**不受電感公差與溫度影響**、而且不用調 RC。

**〔已查證〕SPS 電流感測精度**：原稿說 SPS 可達 ±2%，查到的公開規格是 **±3% 到 ±5%**——Renesas ISL99390／ISL99380（90 A／80 A、5×6 mm）標示 IMON 精度 ±3%（涵蓋輸入電壓、負載與溫度範圍）；AOS AOZ52177QI／AOZ52178QI 標示 IMON 增益 5 mV/A、全溫度範圍典型精度 5%。教學頁改寫成「常見 ±3–5%，依型號而定」。

**互動頁設計**：
- 4 相模型，每相 DCR 可用滑桿加入 ±% 誤差，另有「走線電阻」差異；切換「無均流 / DCR 感測均流 / SPS 均流」三種模式。
- 輸出：各相電流長條圖與估計溫升熱圖；DCR 模式下可調「溫補開／關」，看 85 °C 時感測誤差。
- 小測驗：「L = 220 nH、DCR = 0.25 mΩ、C = 0.1 µF，R 要選多少？」（答：8.8 kΩ）

---

### 站 05　負載暫態、Load-line（AVP）與輸出電容

**〔原稿〕** IMVP9.x 採主動降載線（AVP）：V_out = V_VID − I_out × R_LL；負載增加時電壓依斜率下垂，可減少輸出電容。三級電容：電感側聚合物電容、Socket 周邊 MLCC、Socket 背面腔體 0402／0201 MLCC。

**〔補充〕為什麼刻意讓電壓下垂（AVP 原理）**：
- 不用 AVP 時，電壓設在中間值；負載突然加重會往下掉（undershoot），突然卸載會往上衝（overshoot），兩個方向都要留餘裕，可用的容差窗只剩一半。
- 用 AVP 時，**輕載電壓偏高、重載電壓偏低**。負載加重前電壓本來就在高處，往下掉時有整個容差窗可用；卸載時本來就在低處，往上衝也有整個窗。同樣的容差規格下，輸出電容可以少很多。
- 額外好處：重載時電壓較低，CPU 功耗（∝ V²）也降低。
- 例：Alder Lake-P 28W／45W 的 IA 軌 load-line 為 **2.3 mΩ**（見站 08 查證表），負載從 10 A 跳到 70 A，穩態電壓下降 60 A × 2.3 mΩ ≈ **138 mV**，這是「設計好的」下降，不是誤差。

**〔補充〕DC Load-line 與 AC Load-line**：DC 指穩態時電壓與電流的斜率是否等於 R_LL；AC 指暫態時輸出阻抗在各頻率都維持約等於 R_LL（**目標阻抗是平的**）。若某頻段阻抗高於 R_LL，暫態時會出現超出 load-line 的尖峰。

**〔補充〕三級電容各管哪段頻率（把原稿的三級配置和阻抗連起來）**：

| 層級 | 元件 | 負責頻段（量級） | 為什麼 |
|---|---|---|---|
| 封裝內／晶片上 | Die 電容、封裝電容 | 100 MHz 以上 | 只有它們距離電晶體夠近 |
| Socket 背面腔體 | 大量 0402／0201 MLCC | 約 1–100 MHz | ESL 最低、最靠近 BGA |
| Socket 周邊 | 0805／1206 MLCC | 約 100 kHz–數 MHz | 容量與 ESL 折衷 |
| 電感側 | 聚合物電容（SP-CAP／POSCAP） | 數 kHz–數百 kHz | 大容量，補到 VRM 迴路接手前 |
| VRM 迴路 | 控制器＋電感 | DC 到迴路頻寬（數十至一百多 kHz） | 電感電流斜率的限制（站 02） |

**〔修正〕「奈秒級的 di/dt」**：CPU 內部負載變化確實是奈秒級，但**奈秒級那段由封裝與腔體電容供應**，VRM 迴路本身只負責 µs 以上的時間尺度。原稿 Turn 6 說 SVID 讓 CPU「在奈秒級時間內」調整電壓、IMVP9 要應對「奈秒級 di/dt」，容易誤解成 VRM 在奈秒級反應，這是錯的。

**〔補充〕控制架構**（原稿沒提）：筆電 VRM 控制器常見**定導通時間（COT）類**或**漣波／遲滯類**的快速響應架構，以及各廠專有調變（例如 Renesas R3／R4、TI D-CAP+ 等名稱）〔待查各型號實際架構〕。共同目標都是負載突增時能讓多相「同時」打開 HS，不用等下一個時脈週期。

**互動頁設計**：
- 負載階躍模擬：可選負載從 I1 跳到 I2、上升斜率；顯示 Vout 波形與容差窗、load-line 目標線。
- 開關：AVP 開／關；輸出電容各層級顆數滑桿；顯示 undershoot／overshoot 是否超出窗。
- 阻抗圖：Z(f) 對數圖，各層電容與 VRM 迴路疊合，目標阻抗 R_LL 水平線。

---

### 站 06　效率、相數切換（Phase Shedding）與省電狀態

**〔原稿〕** 輕載時多相全開會有大量閘極驅動與切換損耗；控制器依負載電流動態切相數（全載 8 相 → 半載 4 相 → 輕載 1 相）；極輕載進入 DCM 或 Pulse-Skipping。

**〔補充〕為什麼有「最佳相數」**：
- 導通損耗 ∝ I²／N（相數越多越小）。
- 切換損耗與驅動損耗 ∝ N（每多一相就多一組切換）。
- 兩者相加，在每個負載電流下都有一個損耗最小的 N；把各 N 的效率曲線畫在一起，取包絡線，就是 Phase Shedding 的切相點。

**〔補充〕DCM（非連續導通模式）**：輕載時讓 LS 在電感電流降到零時關閉，不讓電流反向（同步 Buck 預設會反向流，形成循環損耗）；再更輕載時跳過部分切換週期（pulse skipping），等效降低 fsw。

**〔已查證〕IMVP 的電源狀態 PS0–PS4**：CPU 透過 SVID 的 SetPS 指令告訴 VRM 目前預期負載等級（依 Richtek 應用筆記 AN051 與 VR12／IMVP 控制器規格書）：
- PS0：所有相一起運作，提供全部電流能力。
- PS1：只留一相，其他相關閉以減少切換損耗。
- PS2：剩下的那一相從強制 PWM 改成二極體模擬模式（DEM，也就是 DCM），輕載時切換頻率跟著降低。
- PS3：VID 電壓降低，控制器進入低靜態電流模式。
- PS4：最低功耗狀態，VR12.6 世代控制器的 PS4 靜態功耗典型約 0.25 mW；IMVP8 控制器（如 Renesas ISL95855／ISL95857A）也標示支援 PS4。
- 各狀態對應的負載電流門檻由平台規範定義，屬 Intel 文件內容，公開資料查不到。
原稿「控制器根據實時電流即時增減相數」只講了控制器自主切相，少了 CPU 主動告知的 PS 狀態這條路徑；兩者實務上並存。

**〔補充〕切相時的電壓擾動**：加相太慢會在負載突增時 undershoot，所以控制器在偵測到大電流或收到 PS0 時會立刻全相恢復；這也是原稿「IMVP9 支援平滑加減相」的實際意義。

**互動頁設計**：
- 效率曲線：負載電流 0–150 A 為 X 軸，N = 1–6 各一條效率曲線，滑桿調 R_DS(on)、Q_g、fsw；自動標出最佳切相點。
- 動畫：負載從待機→全載→待機，示意相位一個個點亮／熄滅，並標示 PS 狀態。

---

### 站 07　Intel IMVP9.x 與 SVID

**〔原稿〕** IMVP9.x 是 Intel 行動平台核心供電規範（第 12 代 Alder Lake 起），對應大小核、Tile 封裝、大暫態電流、輕載省電；特點為 SVID、多軌、AVP、動態切相、原生支援 SPS。

**〔補充〕先講 SVID 是什麼**：Serial VID，CPU 與 VRM 控制器之間的三線匯流排（VCLK、VDIO、ALERT#）。CPU 是主控端，常用指令：
- **SetVID_Fast／SetVID_Slow**：設定目標電壓與爬升速率。
- **SetPS**：設定電源狀態 PS0–PS4（站 06）。
- **GetReg**：讀 VRM 回報的電流（IMON）、溫度、狀態。
- **ALERT#**：VRM 完成電壓爬升或有狀態變化時通知 CPU。
- **〔已查證〕爬升速率**：SetVID_Fast 要求控制器以**至少 10 mV/µs** 把電壓推到新 VID，SetVID_Slow 至少 **2.5 mV/µs**，另有 SetVID_Decay（不主動拉低，讓負載自然放電）（依 IMVP-7／VR12 與 IMVP8 相容控制器規格書，例如 Renesas ISL95831、ISL95839）。IMVP9 是否更快屬 Intel 文件內容，公開資料查不到。

**〔修正〕「奈秒級時間內調整電壓」**：以 10 mV/µs 計，電壓改變 100 mV 要 10 µs；SVID 一筆指令也要數十個時脈。VID 變化是 µs 到數十 µs 的事件；奈秒級的負載變化靠電容（站 05）。

**〔已查證並修正〕IMVP 版本與世代對照**：

| 規範 | 世代（依廠商資料推定） | 依據 |
|---|---|---|
| IMVP-7／VR12 | 第 2–3 代（Sandy／Ivy Bridge）前後 | ISL95831、ISL95839 等「IMVP-7/VR12」控制器 |
| IMVP8 | **第 6 代 Skylake** 起（Kaby Lake 等沿用） | Skylake 把 Haswell／Broadwell 的 FIVR 移出，改回板端多軌 VRM；Renesas ISL95855 等三軌（Core／GT／SA）控制器 |
| IMVP9 | 第 11 代（Rocket Lake-S、Tiger Lake）前後 | 德國 Igor's Lab 指出 IMVP9.1 是相對於 Rocket Lake-S 的 IMVP9 改版；Renesas ISL95869 為 IMVP9 控制器 |
| IMVP9.1 | 第 12–13 代 Alder Lake／Raptor Lake | Richtek RT3628AE（IMVP9.1）；AOS AOZ71026QI 標示用於 Alder Lake、Raptor Lake |
| IMVP9.2 | Core Ultra（Meteor Lake）世代 | Richtek RT3638AE（IMVP9.2，三軌 VCCCORE＋VCCGT＋VCCSA）；onsemi NCP81538（IMVP9.2，5 輸出） |
| IMVP9.3 | 更新世代 | MPS MP29439-A 標示相容 IMVP9.3 |

原稿「IMVP8 用於第 8～11 代」兩端都不對：IMVP8 從第 6 代開始，第 11 代已是 IMVP9。各版本對應的確切平台以 Intel 文件為準。

**〔補充〕電源軌命名與世代差異**：Alder／Raptor Lake 典型為 VCC_CORE（IA）、VCC_GT、VCCSA，加上另由單相 Buck 供應的 VCCIN_AUX。查到的 IMVP9.2 控制器 RT3638AE 三軌命名為 VCCCORE、VCCGT、VCCSA，可見 Meteor Lake 世代仍是 Core／GT／SA 三軌結構。Lunar Lake 等更新平台的電源軌安排公開資料不足，以各平台 PDG（Platform Design Guide）為準。

**〔已查證，修正我上一版的說法〕控制器型號**：上一版把原稿的型號全列為存疑，查證後多數確實存在：
- **Richtek RT3628AE**：雙軌、1–8 相、符合 IMVP9.1，採 Richtek 專有的 G-NAVP 架構（以誤差放大器有限直流增益加電流模式控制，直接產生 AVP 下垂），具 AQR 快速暫態響應以減少輸出電容。
- **Richtek RT3638AE**：符合 IMVP9.2，8 相 VCCCORE＋單相 VCCGT＋單相 VCCSA，具 Smart Phase Management（可經 I²C 設定自動加減相門檻）。
- **MPS MP2979A**：MPS 的 IMVP 控制器（有實際使用者討論），MP2980 未查到；MPS 另有 MP2949A（IMVP8／IMVP9 三軌）。
- **Renesas**：原稿寫「ISL958xx 系列」方向正確，例如 ISL95869（IMVP9，3 相，R3 調變）。
- 其他廠商：AOS AOZ71026QI（6 相，IMVP8／9／9.1／9.2）、onsemi NCP81538（IMVP9.2）。
- 教學頁可以列這些型號當例子，但註明「選型以最新規格書與 Intel 平台認證清單為準」。

**〔補充〕和 AMD 對照**：AMD 對應的介面是 SVI2／SVI3（Serial VID Interface），概念相同（CPU 數位告知 VRM 電壓與狀態），訊號定義與規範不同。

**原稿 IMVP8 vs IMVP9 對照表的處理**：表格可沿用，但「奈秒級 di/dt」那列改為「更大的 Icc_max 與更快的負載階躍，靠電容與 VRM 共同處理」；「電流偵測主流全面轉向 SPS」改為「SPS 比例提高，DCR 感測仍常見於成本導向設計」。

**互動頁設計**：
- 電源軌架構圖：CPU 方塊與各電源軌，點選軌別看說明、典型相數、負責的電路區塊；可切換「ADL/RPL」「MTL/ARL」兩套（標註〔待查〕）。
- SVID 時序示意：點「SetVID_Fast」→ 看 VCLK／VDIO 封包、Vout 開始爬升、ALERT# 拉低；點「SetPS(PS1)」→ 相數減少。

---

### 站 08　實例：Intel 45W／28W 筆電要幾相

**〔原稿〕** 相數由 PL2／PL4 與 Icc_max 決定，不是 TDP。45W（H 系列）：Core 4–6 相、GT 2–3 相、SA／AUX 1–2 相，合計 7–10 相；28W（P 系列）：Core 3–4 相、GT 1–2 相、SA 1 相，合計 5–7 相。筆電每相熱設計電流抓 20–30 A。控制器常見 4+2、5+1、6+2、3+2、4+1 配置。

**〔補充〕把推導寫成公式（互動頁計算器用）**：

> **N_core ≈ ceil( I_cc,max ／ I_phase,thermal )**，再看封裝電流上限與 OCP 是否足夠。

- 例：I_cc,max = 120 A、每相 25 A → 4.8 → **5 相**；若用 30 A → 4 相。
- 每相電流抓 20–30 A 而非 DrMOS 標稱 50–70 A，是因為：標稱值是理想散熱下的極限；筆電空間小、風道有限；而且效率甜蜜點在額定電流的 30–50%。
- 還要檢查：OCP 設定點（通常高於 Icc_max）、PL4 瞬間電流由電容與相數共同承受。

**〔已查證〕Alder Lake-P／Raptor Lake-P 的公開 VR 參數**：開源韌體 coreboot 的 `src/soc/intel/alderlake/vr_config.c` 收錄了 Intel 參考的預設 VR 設定（OEM 可以改，但這是目前能公開查到最接近官方的數字）：

| 平台／TDP | IA（Core）Icc_max | IA load-line（AC／DC） | GT Icc_max | GT load-line |
|---|---|---|---|---|
| ADL-P 45W（682／482／442） | 120–160 A | 2.3 mΩ | 55 A | 3.2 mΩ |
| ADL-P 28W（682／482／442） | 85–109 A | 2.3 mΩ | 55 A | 3.2 mΩ |
| ADL-P 15W（282） | 80 A | 2.8 mΩ | 40 A | 3.2 mΩ |
| RPL-P 45W（682） | 160 A | 2.3 mΩ | 55 A | 3.2 mΩ |
| RPL-P 28W（482／682） | 102 A | 2.3 mΩ | 55 A | 3.2 mΩ |
| RPL-P 15W（282） | 80 A | 2.8 mΩ | 40 A | 3.2 mΩ |
| ADL-N（6–15W） | 27–53 A | 4.7–5.0 mΩ | 23–40 A | 6.5 mΩ |

（表中 682／482 等代表核心組合，例如 682 = 6 個 P-core＋8 個 E-core＋GT2。）

**對照原稿**：
- 原稿「45W 瞬間電流約 110–150 A」略低，實際上限到 **160 A**；「28W 約 80–110 A」與 85–109 A 吻合。
- 用每相 25 A 推算：45W 的 160 A → **6–7 相**；28W 的 102–109 A → **4–5 相**；GT 的 55 A → **2–3 相**（每相抓 25 A 為 3 相、28 A 以上為 2 相；GT 長時間電流通常較低，原稿「2–3 相」合理）。原稿「45W Core 4–6 相」偏保守，Icc_max 160 A 的 SKU 實務上需要 6 相左右（或每相分到更多電流）。
- 原稿「Arc 內顯配 2–3 相」：ADL／RPL 的 GT 為 55 A，依每相電流假設為 2–3 相；Meteor Lake Arc 內顯的 GT Icc_max 公開資料未查到，維持〔待查〕。
- PL2 預設值（「90–115 W」「64–80 W」）OEM 差異很大，教學頁不寫死，計算器讓使用者自己輸入。

**〔補充〕看懂「4+2 相」**：前一個數字是 Core 軌相數、後一個是 GT 軌；第三軌（SA／AUX）有時由同一顆控制器提供（寫成 4+2+1），有時是另一顆獨立 Buck。

**〔補充〕桌機主機板的「16+2 相」**：桌機板常見大相數宣傳，實際可能是控制器 8 相輸出搭配 **Phase Doubler**（一個 PWM 分給兩組功率級交錯工作）或 **Teamed／並聯相**（一個 PWM 同時推兩組功率級），控制器真實相數比宣傳少。學習時要分清「控制器相數」與「功率級數量」。

**互動頁設計**：
- 計算器：輸入 PL2、Vcore（或直接輸入 Icc_max）、每相熱電流、選 SPS 等級 → 輸出建議相數、每相實際電流、建議控制器配置（如 4+2）、預估導通損耗。
- 兩個預設情境按鈕：「45W H 系列」「28W P 系列」（數值標示示意）。

---

### 站 09　Layout 與量測除錯實務

**〔原稿〕重點彙整（保留）**：
1. **對稱佈局**：各相從 12 V 輸入、經功率級、電感到 CPU 的阻抗要一致。
2. **SW 節點面積最小**：最高 dv/dt、主要雜訊源，在載流足夠前提下短而集中，不跨越敏感訊號。
3. **熱迴路（Power Loop）優先**：12 V → HS → LS → GND 的高頻迴路面積決定 EMI；每相輸入端緊貼高頻 MLCC。
4. **功率級正下方 L2 完整地平面**：鏡像電流抵消迴路磁場、降低迴路電感。
5. **遠端感測差分走線**、**電流感測走線**遠離 SW 節點、**SVID 走線**有完整參考地。
6. **三級輸出電容**（見站 05）。

**〔修正〕遠端感測接點**：原稿寫「直接牽線至處理器封裝底部 BGA 球柱正下方」。實際上 CPU 會提供**專用的 VCC_SENSE／VSS_SENSE 腳位**（在封裝內部連到晶片上的量測點），感測線應接到這兩支腳，以差分對走線到控制器；不是自己挑一顆電源 BGA 球去量。

**〔補充〕SVID 走線**：原稿說「長度須嚴格匹配、避免打孔」。SVID 速度不高（數十 MHz 以下），重點是**完整參考地、遠離 SW 節點與電感、上拉電阻依規範**；長度匹配與零過孔是加分不是必要〔待查 PDG 實際限制〕。

**〔補充〕電感下方**：電感正下方避免走敏感訊號（電感漏磁）；DCR 感測線從電感焊墊的內側引出，Kelvin 連接。

**〔補充〕量測與除錯**（原稿只提 Load-line 校準）：

| 量什麼 | 怎麼量 | 看什麼 |
|---|---|---|
| SW 節點振鈴 | 短接地彈簧探棒，貼近 LS 源極 | 峰值是否超過 MOSFET 耐壓 80%；振鈴頻率 |
| 相電流平衡 | 讀控制器 IMON 暫存器，或在電感上用電流探棒 | 各相差異是否在目標內（例如 ±10%） |
| Load-line | 用 Intel VR 測試工具（VRTT 類）或主動負載卡，在 VCC_SENSE 量 | DC 斜率是否等於 R_LL；暫態 undershoot／overshoot 是否在窗內 |
| 熱 | 紅外線熱像，滿載與 PL2 長時間 | 各相溫度是否一致；最熱點在電感還是功率級 |
| 輸出漣波 | 在 VCC_SENSE 差分量，頻寬限制 20 MHz | 漣波頻率是否為 N × fsw（不是表示有相掉了） |

**〔補充〕常見故障對照**：

| 症狀 | 可能原因 | 先查 |
|---|---|---|
| 高負載當機、藍屏 | Undershoot 超過窗；load-line 設錯；遠端感測接錯 | 用負載階躍量 VCC_SENSE |
| 某一相特別燙 | 均流失效、DCR 感測 RC 錯、該相走線電阻小 | IMON 讀值、熱像 |
| 漣波頻率只有 (N−1) × fsw | 某相沒在工作（功率級損壞或 PWM 斷） | 各相 SW 節點波形 |
| 輕載效率差、待機耗電高 | 未進入 PS1／PS2 或 DCM 被關閉 | SVID 指令紀錄、控制器設定 |
| EMI 超標 | 熱迴路太大、SW 銅箔過大、L2 地平面被切 | 近場探棒定位 |

**互動頁設計**：
- 可點擊的 VRM 佈局示意圖（4 相功率級、電感、輸入／輸出電容、CPU socket、控制器、感測線），點熱點跳出檢查要點；可切換「好佈局 / 壞佈局」對照。
- 可勾選的檢查清單（存在瀏覽器本機），以及故障對照表。

---

### 延伸：其他平台與趨勢〔補充〕

- **伺服器 VR13／VR14、更大電流**：伺服器 CPU／GPU／AI 加速器的核心電流可達數百到上千安培，相數十幾到二十幾相。
- **TLVR（Trans-inductor Voltage Regulator）**：每相電感多一組次級繞組串成迴路，讓所有相在暫態時一起反應，大幅提升電流斜率，用於高端伺服器與 AI 加速卡。
- **48 V 供電**：資料中心從 12 V 轉向 48 V 匯流排，再以中間匯流排轉換器或直接 48 V → 1 V 架構供電。
- **垂直供電（Vertical Power Delivery）**：功率級放在處理器正下方的板背面，縮短大電流路徑。
- **晶片內整合穩壓**：Intel FIVR（Haswell 起部分世代採用）與晶片內 LDO，把部分轉換搬進封裝。

---

## 四、互動網頁製作建議

### 1. 網站架構（比照 PoE PD 系列與 DC-DC 系列）

```
多相供電Multi-phase VRM/
├── 多相供電Multi-phase VRM.md            ← 原稿（不動）
├── 多相供電Multi-phase VRM_學習順序整理.md ← 本檔
├── _src/
│   ├── shell.html        共用版型（導覽列＋上一站／下一站）
│   ├── series.css        沿用 DC-DC 系列樣式
│   ├── vrm.css           本系列專用（相位色票、熱圖、阻抗圖）
│   ├── common.js         共用參數（Vin、Vout、fsw、L、N）與公式函式
│   ├── 00-index.part.html ～ 09-layout.part.html
│   └── build.py          產生單檔版與 _site/
└── _site/                Vercel 部署（例如 multiphase-vrm-series）
```

### 2. 各頁共用設計原則
- **跨頁共用參數**：Vin、Vout、fsw、L、N 存在 common.js（可加 localStorage 記住），讀者在站 01 設的值會帶到站 02、05、06、08，形成一個連貫的「設計案例」。
- **每頁固定結構**：學習目標 → 為什麼需要（問題）→ 原理＋公式 → 互動模擬 → 實務重點 → 2–3 題小測驗 → 上一站／下一站。
- **來源標示上頁**：〔待查〕的數值在頁面上用淡色徽章標示「示意值」，避免被當成規範。
- **相位色票**：每一相固定一種顏色，在所有頁面（波形、電流長條圖、佈局圖）一致。

### 3. 製作優先順序
1. **站 02 紋波抵消**（最有互動價值、公式完整）
2. **站 05 Load-line**（最難用文字理解、最需要波形）
3. **站 01、站 06**（計算器與曲線，實作簡單）
4. **站 04、站 08**（模型簡單、教學價值高）
5. **站 03、站 07、站 09**（以圖解與點擊為主）
6. 站 00 首頁與學習地圖最後做，連到 DC-DC 系列 Buck 頁

### 4. 決議（2026-10-01）
- 〔待查〕項目先查資料核對：已完成，結果標為〔已查證〕並列在第五節查證來源；仍查不到的（SVID 走線限制、IMVP9 的爬升速率、PS 各狀態電流門檻、MTL 內顯 Icc_max）屬 Intel NDA 文件內容，維持〔待查〕。
- 先做本機單檔版，確認沒問題再部署 Vercel。
- 先做站 02（紋波抵消）與站 05（Load-line），其他站之後再討論。

---

## 五、原稿修正清單（彙整）

| # | 原稿位置 | 原稿說法 | 修正／補充 |
|---|---|---|---|
| 1 | Turn 4「一.1」 | 輸出電流交流成分相互抵消 | 抵消程度依 D 而定，D = k／N 才完全抵消；12 V → 1 V 低 D 時抵消有限，主要好處是 N 倍頻率與輸入 RMS 電流降低 |
| 2 | Turn 4「一.2」 | 等效頻率倍增所以響應極快 | 響應另受電感電流斜率 N·(Vin − Vout)／L 限制，其餘由電容補 |
| 3 | Turn 2 | DrMOS 可在 1 MHz 以上高效率 | 可行，但 VRM 實務多在 300 kHz–1 MHz |
| 4 | Turn 2 SPS 表 | DCR 精度 ±7–10%；SPS 可達 ±2% | DCR 數字屬未溫補量級；SPS 公開規格為 ±3%（Renesas ISL99390）到典型 5%（AOS AOZ52178QI）〔已查證〕 |
| 5 | Turn 4「三.3」 | 感測線牽到 BGA 球柱正下方 | 接 CPU 專用 VCC_SENSE／VSS_SENSE 腳 |
| 6 | Turn 6「一.1」 | SVID 讓 CPU 在奈秒級調整電壓 | SVID 指令與電壓爬升是 µs 級 |
| 7 | Turn 6 對照表 | IMVP9 需應對奈秒級 di/dt | 奈秒級由封裝與腔體電容負責，VRM 管 µs 以上 |
| 8 | Turn 6 對照表 | IMVP8 用於第 8～11 代 | IMVP8 自第 6 代 Skylake 起；第 11 代已是 IMVP9；9.1＝ADL／RPL、9.2＝MTL 世代〔已查證，依廠商資料〕 |
| 9 | Turn 6「三.1」 | 控制器型號 RT3628AE、MP2979、ISL958xx 等 | RT3628AE（IMVP9.1）、RT3638AE（IMVP9.2）、MP2979A、ISL95869 確實存在；MP2980 未查到〔已查證〕 |
| 10 | Turn 6「三.2」 | SVID 長度嚴格匹配、禁止過孔 | 重點是參考地與遠離雜訊源；PDG 實際限制為 Intel NDA 文件，公開資料查不到〔仍待查〕 |
| 11 | Turn 5 全段 | Icc_max 45W 110–150 A、28W 80–110 A | coreboot 公開值：45W 120–160 A、28W 85–109 A、GT 55 A；45W 實需約 6 相〔已查證〕 |
| 12 | Turn 6「一.4」 | 只寫控制器依電流自主切相 | 補上 CPU 透過 SVID SetPS（PS0–PS4）主動告知〔已查證定義〕 |
| 13 | Turn 6「一.1」 | SVID 奈秒級調壓 | SetVID_Fast ≥ 10 mV/µs、Slow ≥ 2.5 mV/µs〔已查證〕 |

### 查證來源
- Richtek RT3628AE（IMVP9.1）：https://www.richtek.com/Products/Vcore/intel-vcore/RT3628AE
- Richtek RT3638AE（IMVP9.2）：https://richtek.com/Products/Vcore/intel-vcore/RT3638AE?sc_lang=en
- Richtek AN051（PS0–PS3 定義）：https://www.richtek.com/m/~/media/AN%20PDF/AN051_EN.pdf
- Renesas ISL95869（IMVP9）：https://www.renesas.com/en/products/isl95869
- Renesas ISL95855（IMVP8 三軌、PS4）：https://www.renesas.com/en/products/isl95855/part-details/isl95855irtz
- Renesas ISL99390（SPS ±3%）：https://www.renesas.com/en/products/isl99360 系列頁
- AOS AOZ52178QI（SPS 5 mV/A、典型 5%）：https://aosmd.com/sites/default/files/res/datasheets/AOZ52178QI.pdf
- AOS AOZ71026QI（IMVP8／9／9.1／9.2）：https://investor.aosmd.com/press-releases/press-release-details/2022/Alpha-and-Omega-Semiconductor-Unveils-Worlds-Lowest-Quiescent-Power-Notebook-Multiphase-VR-Controller/default.aspx
- onsemi NCP81538（IMVP9.2）：https://www.digikey.com.mx/en/products/detail/onsemi/NCP81538MNTXG/25902684
- MPS 處理器核心控制器（MP2949A、MP29439-A）：https://www.monolithicpower.com/products/power-management/multi-phase-controllers-intelli-phase/processor-core-power-controllers.html
- SetVID 爬升速率：Renesas ISL95831 規格書 https://www.farnell.com/datasheets/2712669.pdf
- IMVP9.1 與 Rocket Lake IMVP9：https://igorslab.de/en/power-consumption-and-load-peaks-intels-coming-alder-lake-s-and-raptor-lake-s-cpus-in-comparison-exclusively/2
- ADL／RPL VR 參數：coreboot `src/soc/intel/alderlake/vr_config.c` https://github.com/coreboot/coreboot/blob/main/src/soc/intel/alderlake/vr_config.c

## 相關筆記

- [[工作技術_DC-DC拓撲開關電流與輸入輸出電流關係_互動教學頁]]：站 00 的 Buck 前置知識；原稿 Turn 1 的 SEPIC／Flyback／Buck-Boost 也在此系列。
- [[工作技術_PoE_PD架構與互動教學頁]]：原稿 Turn 3 的 PoE PD 內容已在此系列完整整理。
- [[工作技術_GaN與傳統MOS效率發熱對比_DC-DC應用分析]]：開關元件損耗與 Power Loop 佈局，可作站 03 延伸。
- [[工作技術_PCB_Layout與Gerber審查檢查清單]]：站 09 的 VRM 檢查項可併入。
