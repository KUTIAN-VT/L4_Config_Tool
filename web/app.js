const state = {
  bridge: null,
  currentCode: "L4.INFO",
  deviceConnected: false,
  connectedDeviceIndex: -1,
  connectedDeviceSerial: "",
  lastOpenedDeviceSerial: "",
  selectedDeviceIndex: 0,
  deviceScanTimer: null,
  deviceScanPending: false,
  daemonConnected: false,
  openingDeviceIndex: null,
  openingDeviceSerial: "",
  allowAutoOpenDevice: true,
  firmwarePath: "",
  firmwareCheckPending: false,
  firmwareBusyKey: "",
  refreshTimer: null,
  persistSavedState: "",
  persistStatusMode: "clean",
  persistRebootPending: false,
  persistTargetScope: "local",
  persistForms: {
    local: { savedState: "", draftState: "", statusMode: "clean", rebootPending: false, synced: false },
    peer: { savedState: "", draftState: "", statusMode: "clean", rebootPending: false, synced: false },
  },
  profileTargetScope: "local",
  profileForms: {
    local: { text: "", metaText: "", read: false },
    peer: { text: "", metaText: "", read: false },
  },
  searchMatches: [],
  searchIndex: -1,
  statusMode: "offline",
  statusText: "",
  devices: [],
  lastOverview: null,
  lastMonitor: null,
  lastLog: null,
  mcsOptionsByRole: null,
  powerRanges: {
    local: { minidbRange: null, jsonRange: null, minidbRead: false, minidbPending: false, jsonRead: false, jsonPending: false },
    peer: { minidbRange: null, jsonRange: null, minidbRead: false, minidbPending: false, jsonRead: false, jsonPending: false },
  },
  monitorLog: {
    recording: false,
    stopIntent: false,
    rows: [],
    startedAt: null,
    sampleIndex: 0,
    markerIndex: 0,
    exported: true,
  },
  pendingLinkUi: { local: {}, peer: {} },
  pendingWidebandUi: null,
  linkConfigForms: {
    local: { synced: false, values: null },
    peer: { synced: false, values: null },
  },
  widebandForm: { synced: false, mode: "unknown" },
  dialogResolve: null,
  dialogReturnFocus: null,
  dialogToken: 0,
  preferences: {
    theme: "light",
    language: "zh",
    accent: "#3E7BE1",
  },
  appInfo: {
    version: "--",
    address: "127.0.0.1",
    port: 50000,
    qt: "--",
  },
};

const fallbackMcsOptionsByRole = {
  AP: [-2, -1, 0, 3, 5, 6, 7, 9],
  DEV: [0, 3, 5, 6, 7, 9, 10],
};

const fallbackPowerRange = Object.freeze({ min: 15, max: 27 });
const persistPowerEditableRange = Object.freeze({ min: 5, max: 32 });

const els = {
  topbar: document.querySelector(".topbar"),
  navButtons: Array.from(document.querySelectorAll(".nav-button")),
  settingsButton: document.querySelector("#settingsButton"),
  deviceSelect: document.querySelector("#deviceSelect"),
  windowButtons: Array.from(document.querySelectorAll("[data-window-action]")),
  deviceInfoPage: document.querySelector("#deviceInfoPage"),
  monitorPage: document.querySelector("#monitorPage"),
  linkConfigPage: document.querySelector("#linkConfigPage"),
  profilePage: document.querySelector("#profilePage"),
  persistPage: document.querySelector("#persistPage"),
  settingsPage: document.querySelector("#settingsPage"),
  firmwarePage: document.querySelector("#firmwarePage"),
  freqListInput: document.querySelector("#freqListInput"),
  uartBaudrateInput: document.querySelector("#uartBaudrateInput"),
  uartBaudrateToggle: document.querySelector("#uartBaudrateToggle"),
  emptyPage: document.querySelector("#emptyPage"),
  placeholderTitle: document.querySelector("#placeholderTitle"),
  placeholderText: document.querySelector("#placeholderText"),
  modeValue: document.querySelector("#modeValue"),
  localMacValue: document.querySelector("#localMacValue"),
  uptimeValue: document.querySelector("#uptimeValue"),
  firmwareValue: document.querySelector("#firmwareValue"),
  roleSegment: document.querySelector("#roleSegment"),
  pairTableBody: document.querySelector("#pairTableBody"),
  daemonStatus: document.querySelector("#daemonStatus"),
  daemonStatusText: document.querySelector("#daemonStatusText"),
  operationLog: document.querySelector("#operationLog"),
  appInfo: document.querySelector("#appInfo"),
  linkConfigStatus: document.querySelector("#linkConfigStatus"),
  monitorTableBody: document.querySelector("#monitorTableBody"),
  monitorRecordToggle: document.querySelector("#monitorRecordToggle"),
  monitorMarkButton: document.querySelector("#monitorMarkButton"),
  monitorExportButton: document.querySelector("#monitorExportButton"),
  firmwareFile: document.querySelector("#firmwareFile"),
  browseFirmware: document.querySelector("#browseFirmware"),
  firmwareFileName: document.querySelector("#firmwareFileName"),
  firmwareProgress: document.querySelector("#firmwareProgress"),
  firmwareProgressValue: document.querySelector("#firmwareProgressValue"),
  checkFirmwareUpdate: document.querySelector("#checkFirmwareUpdate"),
  startUpgrade: document.querySelector("#startUpgrade"),
  upgradeTargetHint: document.querySelector("#upgradeTargetHint"),
  persistClearButton: document.querySelector("#persistClearButton"),
  persistRebootButton: document.querySelector("#persistRebootButton"),
  persistStatus: document.querySelector("#persistStatus"),
  jsonEditor: document.querySelector("#jsonEditor"),
  configFileMeta: document.querySelector("#configFileMeta"),
  readConfigFile: document.querySelector("#readConfigFile"),
  writeConfigFile: document.querySelector("#writeConfigFile"),
  importConfigFile: document.querySelector("#importConfigFile"),
  exportConfigFile: document.querySelector("#exportConfigFile"),
  resetConfigFile: document.querySelector("#resetConfigFile"),
  configSearch: document.querySelector("#configSearch"),
  configSearchButton: document.querySelector("#configSearchButton"),
  configPrevButton: document.querySelector("#configPrevButton"),
  configNextButton: document.querySelector("#configNextButton"),
  configSearchStatus: document.querySelector("#configSearchStatus"),
  appDialog: document.querySelector("#appDialog"),
  dialogBackdrop: document.querySelector(".app-dialog-backdrop"),
  dialogPanel: document.querySelector(".app-dialog-panel"),
  dialogKicker: document.querySelector("#dialogKicker"),
  dialogTitle: document.querySelector("#dialogTitle"),
  dialogMessage: document.querySelector("#dialogMessage"),
  dialogCancel: document.querySelector("#dialogCancel"),
  dialogConfirm: document.querySelector("#dialogConfirm"),
  themeSegment: document.querySelector("#themeSegment"),
  languageSegment: document.querySelector("#languageSegment"),
  accentColorInput: document.querySelector("#accentColorInput"),
  accentColorText: document.querySelector("#accentColorText"),
  settingsVersionValue: document.querySelector("#settingsVersionValue"),
};

const modulePages = {
  "L4.INFO": els.deviceInfoPage,
  "L4.MONITOR": els.monitorPage,
  "L4.LINK": els.linkConfigPage,
  "L4.PROFILE": els.profilePage,
  "L4.PERSIST": els.persistPage,
  "L4.UPDATE": els.firmwarePage,
  "L4.SETTINGS": els.settingsPage,
};

const customSelects = new Map();
const slimScrollbars = [];
let slimScrollbarUpdateFrame = 0;
const channelOptionCount = 32;
const defaultChannelBaseMhz = 2400;
const defaultChannelStepMhz = 11;
const channelBandSplitMhz = 5000;
const linkUiPendingHoldMs = 3000;
const preferencesStorageKey = "l4-config-tool-web.preferences";
const defaultAccentColor = "#3E7BE1";
const persistFreqListMaxCount = 32;
const persistFreqMhzMax = Math.floor(0xffffffff / 1000);
const persistBaudrateMax = 0xffffffff;
const commonBaudrates = [9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600];
let baudrateMenu = null;
let baudrateMenuOpen = false;
let baudrateActiveIndex = -1;

const translations = {
  zh: {
    "app.title": "L4 配置工具",
    "app.brandTitle": "L4 配置工具",
    "app.aria": "L4 配置工具",
    "top.deviceAria": "打开设备",
    "window.controlsAria": "窗口控制",
    "window.minimize": "最小化",
    "window.maximize": "最大化",
    "window.close": "关闭",
    "sidebar.aria": "主导航",
    "nav.aria": "功能列表",
    "nav.infoTitle": "设备信息",
    "nav.infoMeta": "状态与对频管理",
    "nav.firmwareTitle": "固件升级",
    "nav.firmwareMeta": "本机/对端镜像升级",
    "nav.monitorTitle": "链路监控",
    "nav.monitorMeta": "链路指标与扫频",
    "nav.linkTitle": "链路配置",
    "nav.linkMeta": "即时生效，掉电丢失",
    "nav.profileTitle": "默认配置",
    "nav.profileMeta": "缺省参数，兜底生效",
    "nav.persistTitle": "持久配置",
    "nav.persistMeta": "非易失保存，重启生效",
    "nav.settingsTitle": "设置",
    "nav.settingsMeta": "外观、语言与版本",
    "content.aria": "详细配置",
    "status.logLabel": "运行日志",
    "status.barAria": "运行状态",
    "status.waitingOperation": "等待操作",
    "info.summaryAria": "设备信息摘要",
    "info.modeLabel": "工作模式",
    "info.localMacLabel": "本机 MAC",
    "info.uptimeLabel": "运行时间",
    "info.firmwareLabel": "固件版本",
    "info.roleLabel": "设备角色",
    "info.roleAria": "设备角色",
    "info.pairTitle": "对频管理",
    "info.pairAria": "对频管理",
    "info.peerDevice": "对端设备",
    "info.connectionStatus": "连接状态",
    "info.macAddress": "MAC 地址",
    "info.peerFirmwareVersion": "固件版本",
    "common.operation": "操作",
    "common.confirm": "确认",
    "common.cancel": "取消",
    "common.highRisk": "高风险操作",
    "common.operationDone": "操作完成",
    "common.operationFailed": "操作失败",
    "common.deviceRequired": "请先打开设备",
    "mode.singleUser": "1对1",
    "mode.multiUser": "1对多",
    "mode.relay": "中继",
    "mode.director": "导演模式",
    "mode.unknown": "未知",
    "linkState.idle": "空闲",
    "linkState.pairing": "对频中",
    "linkState.connected": "已连接",
    "linkState.unknown": "未知",
    "pair.query": "查询",
    "pair.set": "设置",
    "pair.start": "对频",
    "pair.stop": "停止",
    "monitor.linkTitle": "链路信息",
    "monitor.linkAria": "链路信息",
    "monitor.local": "本机",
    "monitor.peer": "对端",
    "monitor.sweepTitle": "环境扫频",
    "monitor.legendAria": "扫频图例",
    "monitor.weakInterference": "弱干扰",
    "monitor.strongInterference": "强干扰",
    "monitor.localSweepSignal": "本机扫频信号",
    "monitor.peerSweepSignal": "对端扫频信号",
    "monitor.localFrequency": "本机频点",
    "monitor.peerFrequency": "对端频点",
    "monitor.frequency": "频点",
    "monitor.bandwidth": "频宽",
    "monitor.txPower": "发射功率",
    "monitor.mcs": "调制编码",
    "monitor.rssi": "信号强度",
    "monitor.snr": "信噪比",
    "monitor.errorStats": "错误统计",
    "monitor.throughput": "吞吐率 (实际/理论)",
    "monitor.distance": "距离",
    "monitor.band2g": "2G 频段",
    "monitor.band5g": "5G 频段",
    "monitor.chart2gAria": "2G 频段环境扫频折线图",
    "monitor.chart5gAria": "5G 频段环境扫频折线图",
    "monitor.frequencyAxis": "频点",
    "monitor.interferenceAxis": "信号干扰强度 dBm",
    "monitor.linkNotReady": "链路未就绪",
    "monitor.recordActionsAria": "链路数据记录",
    "monitor.recordStart": "记录",
    "monitor.recordStop": "停止",
    "monitor.recordingActive": "录制中",
    "monitor.recordMark": "标记",
    "monitor.recordExport": "导出",
    "monitor.recordStarted": "已开始链路数据记录",
    "monitor.recordStopped": "已关闭链路数据记录，共 %s 条",
    "monitor.recordMarked": "已添加标记 %s",
    "monitor.recordNoData": "没有可导出的链路日志",
    "monitor.recordExported": "链路日志已导出",
    "monitor.recordDiscardTitle": "清空未导出日志",
    "monitor.recordDiscardMessage": "当前记录尚未导出，开始新记录会清空已有数据。",
    "monitor.recordDiscardConfirm": "开始新记录",
    "monitor.recordAutoStopped": "设备断开，已关闭记录",
    "link.targetPanelAria": "目标设备配置",
    "link.targetLabel": "目标设备",
    "link.targetAria": "目标设备",
    "link.localTarget": "本机",
    "link.peerTarget": "对端",
    "link.formAria": "链路配置参数",
    "link.bandLabel": "频段设置",
    "link.bandModeAria": "频段设置模式",
    "link.auto": "自动",
    "link.manual": "手动",
    "link.channelLabel": "信道设置",
    "link.channelAria": "信道",
    "link.channelModeAria": "信道设置模式",
    "link.bandwidthLabel": "频宽设置",
    "link.bandwidthModeAria": "频宽设置模式",
    "link.mcsModeAria": "MCS 设置模式",
    "link.powerLabel": "功率设置",
    "link.powerModeAria": "功率设置模式",
    "link.powerAria": "发射功率",
    "link.widebandFormAria": "带宽切换",
    "link.widebandLabel": "带宽切换",
    "link.widebandAria": "带宽切换",
    "link.defaultWideband": "默认",
    "link.switch": "切换",
    "link.defaultActive": "当前大带宽方向为DEV → AP",
    "link.switchActive": "当前大带宽切换方向为 AP → DEV",
    "link.unknownWideband": "状态未知",
    "link.notApplied": "未下发链路配置",
    "link.applying": "正在下发链路配置",
    "link.applied": "链路配置已下发",
    "link.failed": "链路配置下发失败",
    "profile.title": "JSON 配置编辑",
    "profile.notRead": "未读取",
    "profile.searchAria": "搜索配置项",
    "profile.searchPlaceholder": "搜索配置项",
    "profile.noResults": "无结果",
    "profile.search": "搜索",
    "profile.previous": "上一个",
    "profile.next": "下一个",
    "profile.actionsAria": "配置文件操作",
    "profile.targetAria": "目标设备",
    "profile.localTarget": "本机",
    "profile.peerTarget": "对端",
    "profile.readWriteAria": "读写",
    "profile.fileAria": "文件",
    "profile.restoreAria": "恢复",
    "profile.read": "读取",
    "profile.save": "保存",
    "profile.import": "导入",
    "profile.export": "导出",
    "profile.restoreFactory": "恢复出厂",
    "profile.writeTitle": "写入设备配置",
    "profile.writeMessage": "当前 JSON 会写入%s配置，原配置将被覆盖。",
    "profile.resetTitle": "恢复出厂配置",
    "profile.resetMessage": "%s配置将恢复为出厂默认值，当前设置会被覆盖。",
    "profile.parseError": "JSON 格式错误：%s",
    "persist.targetPanelAria": "目标设备配置",
    "persist.targetLabel": "目标设备",
    "persist.targetAria": "目标设备",
    "persist.localTarget": "本机",
    "persist.peerTarget": "对端",
    "persist.formAria": "持久配置参数",
    "persist.roleLabel": "角色配置",
    "persist.roleAria": "角色配置",
    "persist.unset": "未设置",
    "persist.peerMacLabel": "对端 Mac地址",
    "persist.bandLabel": "频段设置",
    "persist.bandAria": "持久频段设置",
    "persist.freqListLabel": "频点列表设置",
    "persist.freqListAria": "频点列表设置",
    "persist.freqPlaceholder": "2400,2411,2422",
    "persist.uartBaudrateLabel": "Mavlink串口波特率",
    "persist.uartBaudrateAria": "Mavlink串口波特率",
    "persist.uartBaudrateOptionsAria": "常见波特率",
    "persist.uartBaudratePlaceholder": "115200",
    "persist.powerLabel": "功率设置",
    "persist.powerAria": "功率设置模式",
    "persist.fixedPower": "固定值",
    "persist.range": "范围",
    "persist.fixedPowerPlaceholder": "固定功率",
    "persist.minPlaceholder": "最小",
    "persist.maxPlaceholder": "最大",
    "persist.fixedPowerAria": "固定功率",
    "persist.minPowerAria": "最小功率",
    "persist.maxPowerAria": "最大功率",
    "persist.clean": "配置已同步",
    "persist.dirty": "配置已修改，回车或失焦后写入",
    "persist.applying": "正在写入配置",
    "persist.pendingReboot": "配置已更新，等待重启生效",
    "persist.failed": "写入失败，请检查输入",
    "persist.clear": "清除配置",
    "persist.clearAction": "清除",
    "persist.clearTitle": "清除 MiniDB 持久配置",
    "persist.clearMessage": "%s 中的 MiniDB 持久配置将被清除。",
    "persist.reboot": "重启生效",
    "persist.rebootAction": "重启",
    "persist.rebootTitle": "重启设备使配置生效",
    "persist.rebootMessage": "%s 将立即重启，短时间内会断开连接。",
    "firmware.targetLabel": "升级目标",
    "firmware.targetAria": "升级目标",
    "firmware.localUpgrade": "本机升级",
    "firmware.remoteUpgrade": "对端升级",
    "firmware.localDevice": "--",
    "firmware.remoteSlot0": "--",
    "firmware.currentVersion": "当前版本：",
    "firmware.fileLabel": "升级文件",
    "firmware.filePlaceholder": "请选择 VT4*.img 固件文件",
    "firmware.browse": "选择文件",
    "firmware.progressLabel": "升级进度",
    "firmware.progressAria": "升级进度",
    "firmware.checkUpdate": "检查更新",
    "firmware.start": "开始升级",
    "firmware.selectedFile": "已选择固件文件",
    "firmware.selectFirst": "请先选择升级文件",
    "firmware.checking": "检查中",
    "firmware.downloading": "下载中",
    "firmware.updateTitle": "发现新固件",
    "firmware.updateMessage": "检查到新版本：%s。确认后将从服务器下载固件并开始升级。",
    "firmware.updateStart": "下载并升级",
    "firmware.upToDateTitle": "已是最新版本",
    "firmware.upToDateMessage": "当前固件已是最新版本：%s",
    "firmware.invalidVersionTitle": "当前版本异常",
    "firmware.invalidVersionMessage": "当前固件版本无法匹配 ThingsBoard 设备类型，请检查设备固件版本号。",
    "firmware.checkFailedTitle": "检查更新失败",
    "firmware.checkFailedMessage": "检查更新失败，请查看日志。",
    "firmware.startTitle": "开始固件升级",
    "firmware.startMessage": "升级过程中请保持供电并不要关闭工具。升级成功后将自动恢复配置文件出厂设置并重启设备。",
    "firmware.confirmKicker": "升级确认",
    "firmware.confirmStart": "开始升级",
    "firmware.remoteUnavailable": "对端设备未连接，不能对端升级",
    "empty.moduleNotReadyTitle": "未接入模块",
    "empty.moduleNotReadyText": "此模块暂未接入设备接口",
    "dialog.defaultKicker": "操作确认",
    "dialog.defaultTitle": "确认操作",
    "settings.formAria": "软件设置",
    "settings.themeLabel": "外观",
    "settings.themeLight": "浅色",
    "settings.themeDark": "深色",
    "settings.accentLabel": "主题颜色",
    "settings.languageLabel": "显示语言",
    "settings.languageZh": "中文",
    "settings.languageEn": "English",
    "settings.versionLabel": "软件版本号",
    "settings.saved": "软件设置已保存",
    "settings.saveFailed": "软件设置保存失败",
    "settings.readFailed": "软件设置读取失败",
    "empty.noDeviceData": "暂无设备数据",
    "empty.noSlotData": "暂无 slot 数据",
    "device.notFound": "未发现设备",
    "device.waiting": "等待设备",
    "device.selectToOpen": "选择设备打开",
    "device.defaultName": "L4 设备",
    "status.deviceOnline": "在线",
    "status.connectingDaemon": "正在连接 daemon",
    "status.daemonConnected": "l4_daemon 已连接",
    "status.daemonConnecting": "l4_daemon 连接中",
    "status.daemonDisconnected": "l4_daemon 未连接",
    "status.waitingDevice": "等待设备",
    "status.webChannelNotReady": "WebChannel 未就绪",
    "log.notInQt": "当前页面未运行在 Qt WebEngine 中",
  },
  en: {
    "app.title": "L4 Config Tool",
    "app.brandTitle": "L4 Config Tool",
    "app.aria": "L4 Config Tool",
    "top.deviceAria": "Open device",
    "window.controlsAria": "Window controls",
    "window.minimize": "Minimize",
    "window.maximize": "Maximize",
    "window.close": "Close",
    "sidebar.aria": "Primary navigation",
    "nav.aria": "Feature list",
    "nav.infoTitle": "Device Info",
    "nav.infoMeta": "Status and pairing",
    "nav.firmwareTitle": "Firmware",
    "nav.firmwareMeta": "Local/peer image upgrade",
    "nav.monitorTitle": "Link Monitor",
    "nav.monitorMeta": "Link metrics and sweep",
    "nav.linkTitle": "Link Config",
    "nav.linkMeta": "Immediate effect, lost on power-off",
    "nav.profileTitle": "Default Config",
    "nav.profileMeta": "Default config, fallback effect",
    "nav.persistTitle": "Persistent Config",
    "nav.persistMeta": "Non-volatile config, takes effect after reboot",
    "nav.settingsTitle": "Settings",
    "nav.settingsMeta": "Appearance, language, and version",
    "content.aria": "Detailed configuration",
    "status.logLabel": "Log",
    "status.barAria": "Runtime status",
    "status.waitingOperation": "Waiting for operation",
    "info.summaryAria": "Device summary",
    "info.modeLabel": "Work Mode",
    "info.localMacLabel": "Local MAC",
    "info.uptimeLabel": "Uptime",
    "info.firmwareLabel": "Firmware Version",
    "info.roleLabel": "Device Role",
    "info.roleAria": "Device role",
    "info.pairTitle": "Pairing Management",
    "info.pairAria": "Pairing management",
    "info.peerDevice": "Peer Device",
    "info.connectionStatus": "Connection Status",
    "info.macAddress": "MAC Address",
    "info.peerFirmwareVersion": "Firmware Version",
    "common.operation": "Action",
    "common.confirm": "Confirm",
    "common.cancel": "Cancel",
    "common.highRisk": "High-risk action",
    "common.operationDone": "Operation completed",
    "common.operationFailed": "Operation failed",
    "common.deviceRequired": "Open a device first",
    "mode.singleUser": "1V1",
    "mode.multiUser": "1VN",
    "mode.relay": "Relay",
    "mode.director": "Director mode",
    "mode.unknown": "Unknown",
    "linkState.idle": "Idle",
    "linkState.pairing": "Pairing",
    "linkState.connected": "Connected",
    "linkState.unknown": "Unknown",
    "pair.query": "Query",
    "pair.set": "Set",
    "pair.start": "Pair",
    "pair.stop": "Stop",
    "monitor.linkTitle": "Link Info",
    "monitor.linkAria": "Link info",
    "monitor.local": "Local",
    "monitor.peer": "Peer",
    "monitor.sweepTitle": "Environment Sweep",
    "monitor.legendAria": "Sweep legend",
    "monitor.weakInterference": "Weak",
    "monitor.strongInterference": "Strong",
    "monitor.localSweepSignal": "Local sweep",
    "monitor.peerSweepSignal": "Peer sweep",
    "monitor.localFrequency": "Local freq",
    "monitor.peerFrequency": "Peer freq",
    "monitor.frequency": "FREQ",
    "monitor.bandwidth": "BW",
    "monitor.txPower": "TX Power",
    "monitor.mcs": "MCS",
    "monitor.rssi": "RSSI",
    "monitor.snr": "SNR",
    "monitor.errorStats": "Errors",
    "monitor.throughput": "Throughput (Actual/Theoretical)",
    "monitor.distance": "Distance",
    "monitor.band2g": "2G Band",
    "monitor.band5g": "5G Band",
    "monitor.chart2gAria": "2G environment sweep line chart",
    "monitor.chart5gAria": "5G environment sweep line chart",
    "monitor.frequencyAxis": "Frequency",
    "monitor.interferenceAxis": "Interference dBm",
    "monitor.linkNotReady": "Link not ready",
    "monitor.recordActionsAria": "Link data recording",
    "monitor.recordStart": "Record",
    "monitor.recordStop": "Stop",
    "monitor.recordingActive": "Recording",
    "monitor.recordMark": "Mark",
    "monitor.recordExport": "Export",
    "monitor.recordStarted": "Link data recording started",
    "monitor.recordStopped": "Link data recording stopped, %s rows",
    "monitor.recordMarked": "Added marker %s",
    "monitor.recordNoData": "No link log data to export",
    "monitor.recordExported": "Link log exported",
    "monitor.recordDiscardTitle": "Clear unsaved log",
    "monitor.recordDiscardMessage": "The current log has not been exported. Starting a new log will clear it.",
    "monitor.recordDiscardConfirm": "Start new log",
    "monitor.recordAutoStopped": "Device disconnected; recording stopped",
    "link.targetPanelAria": "Target device config",
    "link.targetLabel": "Target Device",
    "link.targetAria": "Target device",
    "link.localTarget": "Local",
    "link.peerTarget": "Peer",
    "link.formAria": "Link configuration parameters",
    "link.bandLabel": "Band",
    "link.bandModeAria": "Band mode",
    "link.auto": "Auto",
    "link.manual": "Manual",
    "link.channelLabel": "Channel",
    "link.channelAria": "Channel",
    "link.channelModeAria": "Channel mode",
    "link.bandwidthLabel": "Bandwidth",
    "link.bandwidthModeAria": "Bandwidth mode",
    "link.mcsModeAria": "MCS mode",
    "link.powerLabel": "Power",
    "link.powerModeAria": "Power mode",
    "link.powerAria": "TX power",
    "link.widebandFormAria": "Bandwidth switch",
    "link.widebandLabel": "Bandwidth Switch",
    "link.widebandAria": "Bandwidth switch mode",
    "link.defaultWideband": "Default",
    "link.switch": "Switch",
    "link.defaultActive": "Current wideband direction: DEV -> AP",
    "link.switchActive": "Current wideband switch direction: AP -> DEV",
    "link.unknownWideband": "Unknown",
    "link.notApplied": "Link config not applied",
    "link.applying": "Applying link config",
    "link.applied": "Link config applied",
    "link.failed": "Failed to apply link config",
    "profile.title": "JSON Config Editor",
    "profile.notRead": "Not read",
    "profile.searchAria": "Search config items",
    "profile.searchPlaceholder": "Search config items",
    "profile.noResults": "None",
    "profile.search": "Search",
    "profile.previous": "Previous",
    "profile.next": "Next",
    "profile.actionsAria": "Config file actions",
    "profile.targetAria": "Target device",
    "profile.localTarget": "Local",
    "profile.peerTarget": "Peer",
    "profile.readWriteAria": "Read and write",
    "profile.fileAria": "File",
    "profile.restoreAria": "Restore",
    "profile.read": "Read",
    "profile.save": "Save",
    "profile.import": "Import",
    "profile.export": "Export",
    "profile.restoreFactory": "Factory Reset",
    "profile.writeTitle": "Write Device Config",
    "profile.writeMessage": "The current JSON will overwrite the config on %s.",
    "profile.resetTitle": "Factory Reset Config",
    "profile.resetMessage": "The config on %s will be restored to factory defaults.",
    "profile.parseError": "JSON parse error: %s",
    "persist.targetPanelAria": "Target device config",
    "persist.targetLabel": "Target Device",
    "persist.targetAria": "Target device",
    "persist.localTarget": "Local",
    "persist.peerTarget": "Peer",
    "persist.formAria": "Persistent configuration parameters",
    "persist.roleLabel": "Role",
    "persist.roleAria": "Role",
    "persist.unset": "Unset",
    "persist.peerMacLabel": "Peer MAC Address",
    "persist.bandLabel": "Band",
    "persist.bandAria": "Persistent band",
    "persist.freqListLabel": "Frequency List",
    "persist.freqListAria": "Persistent frequency list",
    "persist.freqPlaceholder": "2400,2411,2422",
    "persist.uartBaudrateLabel": "Mavlink UART Baudrate",
    "persist.uartBaudrateAria": "Mavlink UART baudrate",
    "persist.uartBaudrateOptionsAria": "Common baudrates",
    "persist.uartBaudratePlaceholder": "115200",
    "persist.powerLabel": "Power",
    "persist.powerAria": "Power mode",
    "persist.fixedPower": "Fixed",
    "persist.range": "Range",
    "persist.fixedPowerPlaceholder": "Fixed",
    "persist.minPlaceholder": "Min",
    "persist.maxPlaceholder": "Max",
    "persist.fixedPowerAria": "Fixed power",
    "persist.minPowerAria": "Minimum power",
    "persist.maxPowerAria": "Maximum power",
    "persist.clean": "Config synced",
    "persist.dirty": "Config changed; press Enter or blur to write",
    "persist.applying": "Writing config",
    "persist.pendingReboot": "Config updated; waiting for reboot to apply",
    "persist.failed": "Write failed; check input",
    "persist.clear": "Clear Config",
    "persist.clearAction": "Clear",
    "persist.clearTitle": "Clear MiniDB Persistent Config",
    "persist.clearMessage": "The MiniDB persistent configuration on %s will be cleared.",
    "persist.reboot": "Reboot to Apply",
    "persist.rebootAction": "Reboot",
    "persist.rebootTitle": "Reboot Device to Apply Config",
    "persist.rebootMessage": "%s will reboot immediately and disconnect briefly.",
    "firmware.targetLabel": "Upgrade Target",
    "firmware.targetAria": "Upgrade target",
    "firmware.localUpgrade": "Local Upgrade",
    "firmware.remoteUpgrade": "Peer Upgrade",
    "firmware.localDevice": "--",
    "firmware.remoteSlot0": "--",
    "firmware.currentVersion": "Current version: ",
    "firmware.fileLabel": "Upgrade File",
    "firmware.filePlaceholder": "Select a VT4*.img firmware file",
    "firmware.browse": "Browse",
    "firmware.progressLabel": "Upgrade Progress",
    "firmware.progressAria": "Upgrade progress",
    "firmware.checkUpdate": "Check Update",
    "firmware.start": "Start Upgrade",
    "firmware.selectedFile": "Firmware file selected",
    "firmware.selectFirst": "Select an upgrade file first",
    "firmware.checking": "Checking",
    "firmware.downloading": "Downloading",
    "firmware.updateTitle": "New Firmware Found",
    "firmware.updateMessage": "New version found: %s. Confirm to download the firmware and start the upgrade.",
    "firmware.updateStart": "Download and Upgrade",
    "firmware.upToDateTitle": "Already Up to Date",
    "firmware.upToDateMessage": "Current firmware is already up to date: %s",
    "firmware.invalidVersionTitle": "Invalid Current Version",
    "firmware.invalidVersionMessage": "The current firmware version does not match a ThingsBoard device type. Check the device firmware version.",
    "firmware.checkFailedTitle": "Update Check Failed",
    "firmware.checkFailedMessage": "Update check failed. Check the log.",
    "firmware.startTitle": "Start Firmware Upgrade",
    "firmware.startMessage": "Keep the device powered and do not close the tool during upgrade. After a successful upgrade, the tool will restore the config file to factory defaults and reboot the device.",
    "firmware.confirmKicker": "Upgrade confirmation",
    "firmware.confirmStart": "Start Upgrade",
    "firmware.remoteUnavailable": "The peer device is not connected, so peer upgrade is unavailable",
    "empty.moduleNotReadyTitle": "Module Not Connected",
    "empty.moduleNotReadyText": "This module is not connected to device APIs yet.",
    "dialog.defaultKicker": "Confirm Action",
    "dialog.defaultTitle": "Confirm Action",
    "settings.formAria": "Software settings",
    "settings.themeLabel": "Appearance",
    "settings.themeLight": "Light",
    "settings.themeDark": "Dark",
    "settings.accentLabel": "Theme color",
    "settings.languageLabel": "Language",
    "settings.languageZh": "中文",
    "settings.languageEn": "English",
    "settings.versionLabel": "Version",
    "settings.saved": "Settings saved",
    "settings.saveFailed": "Failed to save settings",
    "settings.readFailed": "Failed to read settings",
    "empty.noDeviceData": "No device data",
    "empty.noSlotData": "No slot data",
    "device.notFound": "No devices found",
    "device.waiting": "Waiting for device",
    "device.selectToOpen": "Select a device to open",
    "device.defaultName": "L4 device",
    "status.deviceOnline": "online",
    "status.connectingDaemon": "Connecting daemon",
    "status.daemonConnected": "l4_daemon connected",
    "status.daemonConnecting": "l4_daemon connecting",
    "status.daemonDisconnected": "l4_daemon disconnected",
    "status.waitingDevice": "Waiting for device",
    "status.webChannelNotReady": "WebChannel not ready",
    "log.notInQt": "This page is not running in Qt WebEngine",
  },
};

function t(key) {
  return translations[state.preferences.language]?.[key]
    ?? translations.zh[key]
    ?? key;
}

function setLocalizedText(element, key) {
  if (!element) {
    return;
  }
  element.dataset.i18n = key;
  element.textContent = t(key);
}

function setPlainText(element, text) {
  if (!element) {
    return;
  }
  delete element.dataset.i18n;
  element.textContent = text;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatTemplate(key, ...values) {
  let index = 0;
  return t(key).replace(/%s/g, () => String(values[index++] ?? ""));
}

function knownTextKey(value) {
  const text = String(value || "").trim();
  const map = {
    "未知": "mode.unknown",
    "空闲": "linkState.idle",
    "锁定": "linkState.idle",
    "对频中": "linkState.pairing",
    "已连接": "linkState.connected",
    "链路未就绪": "monitor.linkNotReady",
    "未设置": "persist.unset",
  };
  return map[text] || "";
}

function localizedKnownText(value, fallbackKey = "") {
  const key = knownTextKey(value);
  if (key) {
    return t(key);
  }
  const text = String(value || "").trim();
  return text || (fallbackKey ? t(fallbackKey) : "");
}

function isUnsetText(value) {
  const text = String(value || "").trim().toLowerCase();
  return text === "未设置" || text === "unset";
}

function modeDisplayText(data = {}) {
  const modeValue = Number(data.modeValue);
  const keys = {
    0: "mode.singleUser",
    1: "mode.multiUser",
    2: "mode.relay",
    3: "mode.director",
  };
  if (Object.prototype.hasOwnProperty.call(keys, modeValue)) {
    return t(keys[modeValue]);
  }
  return localizedKnownText(data.mode, "mode.unknown");
}

function linkStateDisplayText(slot = {}) {
  if (slot.paired) {
    return t("linkState.pairing");
  }
  const stateValue = Number(slot.stateValue);
  const keys = {
    0: "linkState.idle",
    1: "linkState.idle",
    2: "linkState.connected",
  };
  if (Object.prototype.hasOwnProperty.call(keys, stateValue)) {
    return t(keys[stateValue]);
  }
  return localizedKnownText(slot.state, "linkState.unknown");
}

function formatUptimeText(milliseconds, fallback = "--") {
  const value = Number(milliseconds);
  if (!Number.isFinite(value) || value < 0) {
    return fallback || "--";
  }

  const totalSeconds = Math.floor(value / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = String(Math.floor(totalSeconds / 3600) % 24).padStart(2, "0");
  const minutes = String(Math.floor(totalSeconds / 60) % 60).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return state.preferences.language === "en"
    ? `${days}d ${hours}:${minutes}:${seconds}`
    : `${days}天 ${hours}:${minutes}:${seconds}`;
}

function deviceOptionText(device) {
  const name = String(device?.name || "").trim();
  const match = name.match(/^设备(\d+):(.*)$/);
  if (match) {
    return state.preferences.language === "en"
      ? `Device ${match[1]}:${match[2]}`
      : name;
  }
  return name || `${t("device.defaultName")} ${device?.index ?? ""}`.trim();
}

function normalizedDeviceSerial(value) {
  return String(value || "").trim().toLowerCase();
}

function sameDeviceSerial(left, right) {
  const normalizedLeft = normalizedDeviceSerial(left);
  const normalizedRight = normalizedDeviceSerial(right);
  return !!normalizedLeft && normalizedLeft === normalizedRight;
}

function findDeviceBySerial(serial, devices = state.devices) {
  const normalizedSerial = normalizedDeviceSerial(serial);
  if (!normalizedSerial || !Array.isArray(devices)) {
    return null;
  }
  return devices.find((device) => normalizedDeviceSerial(device.serial) === normalizedSerial) || null;
}

function findDeviceByIndex(index, devices = state.devices) {
  if (!Array.isArray(devices)) {
    return null;
  }
  return devices.find((device) => Number(device.index) === Number(index)) || null;
}

function isConnectedDeviceSelection(index, serial) {
  return state.connectedDeviceSerial
    ? sameDeviceSerial(state.connectedDeviceSerial, serial)
    : state.connectedDeviceIndex === index;
}

function translateDeviceName(value) {
  return String(value || "").trim().replace(/^设备(\d+):(.*)$/g, "Device $1:$2");
}

function translateRuntimeStep(value) {
  const text = String(value || "").trim();
  const stepMap = {
    "频段模式": "band mode",
    "工作频段": "band",
    "信道模式": "channel mode",
    "工作信道": "channel",
    "频宽模式": "bandwidth mode",
    "工作频宽": "bandwidth",
    "MCS 模式": "MCS mode",
    "读取工作模式": "work mode read",
    "帧结构切换": "frame structure switch",
    "角色配置": "role config",
    "对端 MAC": "peer MAC",
    "频段配置": "band config",
    "功率配置": "power config",
    "频点列表": "frequency list",
  };
  return stepMap[text] || text;
}

function translateRuntimeMessage(message) {
  const raw = String(message || "").trim();
  if (!raw || state.preferences.language !== "en") {
    return raw;
  }

  const exact = {
    "[SDK] 未发现 L4 设备": "[SDK] No L4 device found",
    "[SDK] 当前设备已从列表中移除": "[SDK] Current device was removed from the list",
    "暂无设备数据": "No device data",
    "操作已提交": "Operation submitted",
    "主题设置无效": "Invalid theme setting",
    "语言设置无效": "Invalid language setting",
    "保存软件设置失败": "Failed to save software settings",
    "软件设置已保存": "Software settings saved",
    "设备序号无效": "Invalid device index",
    "Slot 无效": "Invalid slot",
    "用户 ID 无效": "Invalid user ID",
    "请输入 MAC 地址": "Enter a MAC address",
    "对频超时时间应在 1-32767 秒之间": "Pairing timeout must be between 1 and 32767 seconds",
    "配置读取模式无效": "Invalid config read mode",
    "配置内容为空": "Config content is empty",
    "已取消导入": "Import canceled",
    "配置文件已导入": "Config file imported",
    "已取消导出": "Export canceled",
    "写入配置文件失败": "Failed to write config file",
    "配置文件已导出": "Config file exported",
    "已取消选择": "Selection canceled",
    "已选择固件文件": "Firmware file selected",
    "固件升级正在进行": "Firmware upgrade is already running",
    "固件更新检查正在进行": "Firmware update check is already running",
    "当前版本异常": "Current firmware version is invalid",
    "未配置 ThingsBoard 服务器地址": "ThingsBoard server URL is not configured",
    "未配置对应 ThingsBoard 设备令牌": "The matching ThingsBoard device token is not configured",
    "ThingsBoard 服务器地址无效": "ThingsBoard server URL is invalid",
    "ThingsBoard 固件属性响应不是有效 JSON": "ThingsBoard firmware attributes response is not valid JSON",
    "服务器未返回固件版本": "The server did not return a firmware version",
    "ThingsBoard 固件标题不是 VT4*.img 可用文件名": "ThingsBoard firmware title cannot be used as a VT4*.img file name",
    "请先检查固件更新": "Check for firmware updates first",
    "固件大小校验失败": "Firmware size check failed",
    "固件校验失败": "Firmware checksum verification failed",
    "无法创建固件缓存目录": "Failed to create firmware cache directory",
    "写入固件缓存失败": "Failed to write firmware cache",
    "保存固件缓存失败": "Failed to save firmware cache",
    "请先打开设备": "Open a device first",
    "请先选择固件文件": "Select a firmware file first",
    "请选择以 VT4 开头的 .img 固件文件": "Select a .img firmware file whose name starts with VT4",
    "远程 Slot 无效": "Invalid remote slot",
    "窗口对象不可用": "Window object is unavailable",
    "窗口拖动不可用": "Window dragging is unavailable",
    "未知窗口操作": "Unknown window action",
    "程序正在关闭": "Application is closing",
    "daemon 尚未连接": "daemon is not connected",
    "打开设备失败": "Failed to open device",
    "设备尚未连接": "Device is not connected",
    "频段参数无效": "Invalid band parameter",
    "信道应在 0-255 之间": "Channel must be between 0 and 255",
    "频宽参数无效": "Invalid bandwidth parameter",
    "MCS 参数无效": "Invalid MCS parameter",
    "链路配置已下发": "Link config applied",
    "正在对频": "Pairing in progress",
    "已发送停止命令": "Stop command sent",
    "MAC 格式应为 11:22:33:44 或 11223344": "MAC format must be 11:22:33:44 or 11223344",
    "持久配置已读取": "Persistent config read",
    "角色参数无效": "Invalid role parameter",
    "对端 MAC 格式应为 11:22:33:44 或 11223344": "Peer MAC format must be 11:22:33:44 or 11223344",
    "当前设备角色不支持对端 MAC 配置": "Current device role does not support peer MAC configuration",
    "固定功率应在 10-27 dBm 之间": "Fixed power must be between 10 and 27 dBm",
    "功率范围应在 10-27 dBm，且最小值不大于最大值": "Power range must be 10-27 dBm and min must not exceed max",
    "频点列表数量应在 1-32 之间": "Frequency list must contain 1-32 items",
    "频点应为正整数 MHz": "Frequency must be a positive integer MHz",
    "读取频点列表失败": "Failed to read frequency list",
    "设备重启请求已发送": "Device reboot requested",
    "持久配置已写入，重启设备后可完全生效": "Persistent config written; restart the device for full effect",
    "没有可写入的持久配置": "No persistent config to write",
    "配置文件分片响应无效": "Invalid config file chunk response",
    "读取过程中配置文件总长度或 CRC 发生变化": "Config file total length or CRC changed during read",
    "配置文件分片长度超出总长度": "Config file chunk length exceeds total length",
    "配置文件读取未能继续推进": "Config file read did not progress",
    "配置文件 CRC 校验失败": "Config file CRC check failed",
    "配置文件已读取": "Config file read",
    "配置文件大小无效，最大 65535 字节": "Invalid config file size; maximum is 65535 bytes",
    "配置文件已写入设备": "Config file written to device",
    "固件升级完成": "Firmware upgrade completed",
    "升级文件不存在": "Upgrade file does not exist",
    "未找到 l4_ota_upgrade.exe": "l4_ota_upgrade.exe not found",
    "daemon 已退出": "daemon exited",
    "已连接现有 daemon": "Connected to existing daemon",
    "远端 daemon 暂不可连接": "Remote daemon is temporarily unreachable",
    "未找到 l4_daemon.exe": "l4_daemon.exe not found",
    "本机 daemon 已就绪": "Local daemon is ready",
    "daemon 正在初始化": "daemon is initializing",
  };
  if (exact[raw]) {
    return exact[raw];
  }

  const regexRules = [
    [/^\[SDK\] 刷新设备概览失败，sys=(.+) status=(.+)$/, (_, sys, status) => `[SDK] Failed to refresh device overview, sys=${sys} status=${status}`],
    [/^\[SDK\] 读取设备状态失败，错误码 (.+)$/, (_, code) => `[SDK] Failed to read device status, error code ${code}`],
    [/^\[daemon\] 进程退出，代码 (.+)$/, (_, code) => `[daemon] Process exited, code ${code}`],
    [/^\[daemon\] 已启动 (.+)$/, (_, args) => `[daemon] Started ${args}`],
    [/^启动 daemon 失败：(.+)$/, (_, reason) => `Failed to start daemon: ${reason}`],
    [/^\[OTA\] 开始升级：(.+)$/, (_, file) => `[OTA] Starting upgrade: ${file}`],
    [/^\[ThingsBoard\] 正在检查固件更新$/, () => "[ThingsBoard] Checking firmware update"],
    [/^\[ThingsBoard\] 正在检查固件更新：(.+)$/, (_, key) => `[ThingsBoard] Checking firmware update: ${key}`],
    [/^\[ThingsBoard\] 开始下载固件：(.+)$/, (_, version) => `[ThingsBoard] Downloading firmware: ${version}`],
    [/^当前固件已是最新版本：(.+)$/, (_, version) => `Current firmware is already up to date: ${version}`],
    [/^检查到新版本：(.+)$/, (_, version) => `New version found: ${version}`],
    [/^未配置设备令牌：(.+)$/, (_, key) => `Device token is not configured: ${key}`],
    [/^固件 (.+) 已下载：(.+)$/, (_, version, file) => `Firmware ${version} downloaded: ${file}`],
    [/^查询 ThingsBoard 固件属性失败，HTTP (.+)：(.+)$/, (_, code, reason) => `Failed to query ThingsBoard firmware attributes, HTTP ${code}: ${reason}`],
    [/^下载 ThingsBoard 固件失败，HTTP (.+)：(.+)$/, (_, code, reason) => `Failed to download ThingsBoard firmware, HTTP ${code}: ${reason}`],
    [/^查询 ThingsBoard 固件属性失败：(.+)$/, (_, reason) => `Failed to query ThingsBoard firmware attributes: ${reason}`],
    [/^下载 ThingsBoard 固件失败：(.+)$/, (_, reason) => `Failed to download ThingsBoard firmware: ${reason}`],
    [/^不支持的固件校验算法：(.+)$/, (_, algorithm) => `Unsupported firmware checksum algorithm: ${algorithm}`],
    [/^无法写入固件缓存：(.+)$/, (_, reason) => `Failed to write firmware cache: ${reason}`],
    [/^固件升级失败，退出代码 (.+)$/, (_, code) => `Firmware upgrade failed, exit code ${code}`],
    [/^连接 daemon 失败，错误码 (.+)$/, (_, code) => `Failed to connect daemon, error code ${code}`],
    [/^已打开设备 (.+)$/, (_, name) => `Opened device ${translateDeviceName(name)}`],
    [/^无法读取配置文件：(.+)$/, (_, reason) => `Failed to read config file: ${reason}`],
    [/^无法写入配置文件：(.+)$/, (_, reason) => `Failed to write config file: ${reason}`],
    [/^JSON 格式错误：(.+)$/, (_, reason) => `JSON parse error: ${reason}`],
    [/^(.+) 下发失败，错误码 (.+)$/, (_, step, code) => `Failed to apply ${translateRuntimeStep(step)}, error code ${code}`],
    [/^(.+) 写入失败，错误码 (.+)$/, (_, step, code) => `Failed to write ${translateRuntimeStep(step)}, error code ${code}`],
    [/^(.+) 已完成$/, (_, operation) => `${operation} completed`],
    [/^(.+) 失败，错误码 (.+)$/, (_, operation, code) => `${operation} failed, error code ${code}`],
    [/^读取(.+)失败，错误码 (.+)$/, (_, target, code) => `Failed to read ${translateRuntimeStep(target)}, error code ${code}`],
    [/^\[对频\] 对频成功$/, () => "[Pairing] Pairing succeeded"],
    [/^\[对频\] 对频超时$/, () => "[Pairing] Pairing timed out"],
    [/^\[对频\] 对频结束，错误码 (.+)$/, (_, code) => `[Pairing] Pairing ended, error code ${code}`],
  ];

  for (const [pattern, replacer] of regexRules) {
    const match = raw.match(pattern);
    if (match) {
      return replacer(...match);
    }
  }

  return raw.replace(/^设备(\d+):/g, "Device $1:");
}

function renderOperationLog() {
  if (!state.lastLog || !els.operationLog) {
    return;
  }
  const timeText = state.lastLog.time.toLocaleTimeString("zh-CN", { hour12: false });
  const lineText = `${timeText}  ${translateRuntimeMessage(state.lastLog.message)}`;
  setPlainText(els.operationLog, lineText);
  els.operationLog.title = lineText;
}

function refreshDeviceOptionTexts() {
  if (!Array.isArray(state.devices) || state.devices.length === 0 || !els.deviceSelect) {
    return;
  }

  Array.from(els.deviceSelect.options).forEach((option) => {
    if (option.dataset.deviceOption === "select-to-open") {
      option.textContent = t("device.selectToOpen");
      return;
    }
    const device = state.devices.find((item) => String(item.index) === option.value);
    if (device) {
      option.textContent = deviceOptionText(device);
    }
  });
  syncCustomSelect(els.deviceSelect);
}

function syncAllCustomSelects() {
  customSelects.forEach((_, select) => syncCustomSelect(select));
}

function updateUpgradeTargetHint() {
  const target = activeSegmentValue("[data-upgrade-target-group]", "local");
  const version = !state.deviceConnected ? "--" : target === "remote"
    ? peerUpgradeFirmwareVersion()
    : firmwareVersionText(state.lastOverview?.firmwareVersion);
  const displayText = `${t("firmware.currentVersion")}${version}`;
  setPlainText(els.upgradeTargetHint, displayText);
  els.upgradeTargetHint.title = version === "--" ? "" : displayText;
}

function firmwareVersionText(value) {
  const text = String(value ?? "").trim();
  return text || "--";
}

function peerUpgradeSlot() {
  const slots = Array.isArray(state.lastOverview?.slots) ? state.lastOverview.slots : [];
  return slots.find((slot) => Number(slot?.slot) === 0) || null;
}

function peerUpgradeFirmwareVersion() {
  return firmwareVersionText(peerUpgradeSlot()?.peerFirmwareVersion);
}

function currentUpgradeTarget() {
  return activeSegmentValue("[data-upgrade-target-group]", "local");
}

function currentUpgradeRemoteSlot() {
  return currentUpgradeTarget() === "remote" ? 0 : -1;
}

function currentUpgradeFirmwareVersion() {
  return currentUpgradeTarget() === "remote"
    ? peerUpgradeFirmwareVersion()
    : firmwareVersionText(state.lastOverview?.firmwareVersion);
}

function setFirmwareProgress(progress) {
  const value = Math.max(0, Math.min(100, Number(progress) || 0));
  els.firmwareProgress.style.width = `${value}%`;
  els.firmwareProgressValue.textContent = `${Math.round(value)}%`;
}

function hasRemoteUpgradeTarget() {
  const slot0 = peerUpgradeSlot();
  return Number(slot0?.stateValue) === 2 || String(slot0?.state || "").toLowerCase() === "connected";
}

function setUpgradeTarget(target) {
  const normalizedTarget = target === "remote" ? "remote" : "local";
  document.querySelectorAll("[data-upgrade-target]").forEach((button) => {
    button.classList.toggle("active", button.dataset.upgradeTarget === normalizedTarget);
  });
  updateUpgradeTargetHint();
}

function syncFirmwareControls() {
  const canRemoteUpgrade = state.deviceConnected && hasRemoteUpgradeTarget();
  const remoteButton = document.querySelector('[data-upgrade-target="remote"]');
  if (remoteButton) {
    remoteButton.disabled = !canRemoteUpgrade;
  }

  if (!canRemoteUpgrade && activeSegmentValue("[data-upgrade-target-group]", "local") === "remote") {
    setUpgradeTarget("local");
  } else {
    updateUpgradeTargetHint();
  }

  const target = currentUpgradeTarget();
  const targetUnavailable = target === "remote" && !canRemoteUpgrade;
  els.startUpgrade.disabled = state.firmwareCheckPending || !state.firmwarePath || targetUnavailable;
  if (els.checkFirmwareUpdate) {
    els.checkFirmwareUpdate.disabled = state.firmwareCheckPending || !state.deviceConnected || targetUnavailable;
    setLocalizedText(els.checkFirmwareUpdate, state.firmwareCheckPending ? state.firmwareBusyKey || "firmware.checking" : "firmware.checkUpdate");
  }
}

function widebandStatusKey(mode) {
  if (mode === "switch") {
    return "link.switchActive";
  }
  if (mode === "default") {
    return "link.defaultActive";
  }
  return "link.unknownWideband";
}

function normalizeWidebandMode(mode) {
  return mode === "default" || mode === "switch" ? mode : "unknown";
}

function syncWidebandMode(mode) {
  const normalized = normalizeWidebandMode(mode);
  document.querySelectorAll('[data-config-key="frameChange"]').forEach((segment) => {
    segment.querySelectorAll(".segment-button").forEach((button) => {
      button.classList.toggle("active", normalized !== "unknown" && button.dataset.frameChange === normalized);
    });
    const status = segment.closest(".config-row")?.querySelector(".wideband-status");
    setLocalizedText(status, widebandStatusKey(normalized));
  });
}

function setPendingWidebandUiValue(value) {
  state.pendingWidebandUi = {
    value: normalizeWidebandMode(value),
    expiresAt: Date.now() + linkUiPendingHoldMs,
  };
}

function pendingWidebandUiValue(actualValue) {
  const pending = state.pendingWidebandUi;
  if (!pending) {
    return null;
  }
  const actual = normalizeWidebandMode(actualValue);
  if (actual === pending.value || Date.now() > pending.expiresAt) {
    state.pendingWidebandUi = null;
    return null;
  }
  return pending.value;
}

function resetWidebandForm() {
  state.pendingWidebandUi = null;
  state.widebandForm = { synced: false, mode: "unknown" };
}

function renderWidebandForm() {
  syncWidebandMode(state.widebandForm.mode || "unknown");
}

function normalizeEndpointScope(scope) {
  return String(scope ?? "").trim().toLowerCase() === "peer" ? "peer" : "local";
}

function activeLinkEndpointScope() {
  return normalizeEndpointScope(activeSegmentValue("#linkConfigPage .direction-segment", "local"));
}

function setLinkEndpointScope(scope = "local") {
  const endpointScope = normalizeEndpointScope(scope);
  const group = document.querySelector("#linkConfigPage .direction-segment");
  if (!group) {
    return;
  }
  group.querySelectorAll(".segment-button").forEach((button) => {
    button.classList.toggle("active", normalizeEndpointScope(button.dataset.targetScope) === endpointScope);
  });
  renderLinkConfigForm(endpointScope);
}

function normalizePersistTargetScope(scope) {
  const normalized = String(scope ?? "").trim().toLowerCase();
  return normalized === "peer" || normalized === "remote" ? "peer" : "local";
}

function activePersistTargetScope() {
  return normalizePersistTargetScope(
    activeSegmentValue("#persistPage .persist-direction-segment", state.persistTargetScope || "local"),
  );
}

function currentPersistForm(scope = activePersistTargetScope()) {
  const normalizedScope = normalizePersistTargetScope(scope);
  if (!state.persistForms[normalizedScope]) {
    state.persistForms[normalizedScope] = {
      savedState: "",
      draftState: "",
      statusMode: "clean",
      rebootPending: false,
      synced: false,
    };
  }
  return state.persistForms[normalizedScope];
}

function persistTargetLabel(scope = activePersistTargetScope()) {
  return t(normalizePersistTargetScope(scope) === "peer" ? "persist.peerTarget" : "persist.localTarget");
}

function setPersistTargetScope(scope = "local", { restore = false } = {}) {
  const targetScope = normalizePersistTargetScope(scope);
  const group = document.querySelector("#persistPage .persist-direction-segment");
  if (!group) {
    return;
  }
  group.querySelectorAll(".segment-button").forEach((button) => {
    button.classList.toggle("active", normalizePersistTargetScope(button.dataset.persistTargetScope) === targetScope);
  });
  state.persistTargetScope = targetScope;
  if (restore) {
    restoreActivePersistForm(targetScope);
  }
  updatePersistPowerInputLimits();
}

function syncTargetDeviceControls() {
  const canUsePeerTarget = state.deviceConnected && hasRemoteUpgradeTarget();
  const linkPeerButton = document.querySelector('#linkConfigPage [data-target-scope="peer"]');
  const persistPeerButton = document.querySelector('#persistPage [data-persist-target-scope="peer"]');
  const profilePeerButton = document.querySelector('#profilePage [data-profile-target-scope="peer"]');
  [linkPeerButton, persistPeerButton, profilePeerButton].forEach((button) => {
    if (!button) {
      return;
    }
    button.disabled = !canUsePeerTarget;
    button.setAttribute("aria-disabled", canUsePeerTarget ? "false" : "true");
  });
  if (!canUsePeerTarget) {
    setLinkEndpointScope("local");
    setPersistTargetScope("local");
    if (activeProfileTargetScope() === "peer") {
      saveActiveProfileForm();
      setProfileTargetScope("local", { restore: true });
    } else {
      setProfileTargetScope("local");
    }
  }
}

function persistRequestOptions(scope = activePersistTargetScope()) {
  return { slot: 0, targetScope: normalizePersistTargetScope(scope) };
}

function activeProfileTargetScope() {
  return normalizePersistTargetScope(
    activeSegmentValue("#profilePage .profile-target-segment", state.profileTargetScope || "local"),
  );
}

function currentProfileForm(scope = activeProfileTargetScope()) {
  const normalizedScope = normalizePersistTargetScope(scope);
  if (!state.profileForms[normalizedScope]) {
    state.profileForms[normalizedScope] = { text: "", metaText: "", read: false };
  }
  return state.profileForms[normalizedScope];
}

function profileTargetLabel(scope = activeProfileTargetScope()) {
  return t(normalizePersistTargetScope(scope) === "peer" ? "profile.peerTarget" : "profile.localTarget");
}

function profileRequestOptions(scope = activeProfileTargetScope(), extra = {}) {
  return { ...extra, slot: 0, targetScope: normalizePersistTargetScope(scope) };
}

function saveActiveProfileForm() {
  if (!els.jsonEditor) {
    return;
  }
  const form = currentProfileForm();
  form.text = els.jsonEditor.value;
  form.metaText = els.configFileMeta?.textContent || form.metaText || "";
}

function restoreProfileForm(scope = activeProfileTargetScope()) {
  const form = currentProfileForm(scope);
  if (els.jsonEditor) {
    els.jsonEditor.value = form.text || "";
  }
  if (form.metaText) {
    setPlainText(els.configFileMeta, form.metaText);
  } else {
    setLocalizedText(els.configFileMeta, "profile.notRead");
  }
  resetConfigSearch();
}

function setProfileTargetScope(scope = "local", { restore = false } = {}) {
  const targetScope = normalizePersistTargetScope(scope);
  const group = document.querySelector("#profilePage .profile-target-segment");
  if (!group) {
    return;
  }
  group.querySelectorAll(".segment-button").forEach((button) => {
    button.classList.toggle("active", normalizePersistTargetScope(button.dataset.profileTargetScope) === targetScope);
  });
  state.profileTargetScope = targetScope;
  if (restore) {
    restoreProfileForm(targetScope);
  }
}

function saveActivePersistForm() {
  const scope = activePersistTargetScope();
  const form = currentPersistForm(scope);
  form.draftState = capturePersistState();
  form.statusMode = state.persistStatusMode;
  form.rebootPending = state.persistRebootPending;
}

function resetPersistFormUi() {
  els.persistPage?.querySelectorAll(".segment[data-persist-key]").forEach((segment) => setSegmentToUnset(segment));
  els.persistPage?.querySelectorAll("[data-persist-input]").forEach((input) => {
    input.value = "";
    input.classList.remove("invalid");
  });
  syncPersistUnsetButtons();
}

function restoreActivePersistForm(scope = activePersistTargetScope()) {
  const form = currentPersistForm(scope);
  if (form.draftState) {
    restorePersistState(form.draftState);
  } else {
    resetPersistFormUi();
  }
  state.persistSavedState = form.savedState || capturePersistState();
  state.persistStatusMode = form.statusMode || "clean";
  state.persistRebootPending = !!form.rebootPending;
  setPersistStatus(currentPersistStatusMode());
}

function requestPersistConfig(scope = activePersistTargetScope()) {
  if (state.deviceConnected) {
    bridgeCall("getPersistConfig", persistRequestOptions(scope));
  }
}

function targetScopeForEndpointScope(endpointScope) {
  return normalizeEndpointScope(endpointScope) === "local" ? "peer" : "local";
}

function targetScopeForLinkActions(endpointScope, actions = []) {
  const normalizedActions = Array.isArray(actions) ? actions : [];
  const powerOnly = normalizedActions.length > 0
    && normalizedActions.every((action) => ["powerAuto", "power"].includes(action));
  return powerOnly ? normalizeEndpointScope(endpointScope) : targetScopeForEndpointScope(endpointScope);
}

function defaultLinkConfigValues() {
  return {
    bandMode: "auto",
    band: "2g",
    channelMode: "auto",
    channel: 7,
    channels: [],
    bandwidthMode: "auto",
    bandwidth: 2,
    mcsMode: "auto",
    mcs: 6,
    powerAuto: "auto",
    power: 20,
  };
}

function ensureLinkConfigForm(endpointScope) {
  const scope = normalizeEndpointScope(endpointScope);
  if (!state.linkConfigForms[scope]) {
    state.linkConfigForms[scope] = { synced: false, values: null };
  }
  if (!state.linkConfigForms[scope].values) {
    state.linkConfigForms[scope].values = defaultLinkConfigValues();
  }
  return state.linkConfigForms[scope];
}

function resetLinkConfigForms() {
  state.linkConfigForms = {
    local: { synced: false, values: null },
    peer: { synced: false, values: null },
  };
  resetWidebandForm();
}

function setPendingLinkUiValue(endpointScope, key, value) {
  const scope = normalizeEndpointScope(endpointScope);
  if (!state.pendingLinkUi[scope]) {
    state.pendingLinkUi[scope] = {};
  }
  state.pendingLinkUi[scope][key] = {
    value: String(value ?? ""),
    expiresAt: Date.now() + linkUiPendingHoldMs,
  };
}

function pendingLinkUiValue(endpointScope, key, actualValue) {
  const scope = normalizeEndpointScope(endpointScope);
  const pending = state.pendingLinkUi[scope]?.[key];
  if (!pending) {
    return null;
  }
  const actual = String(actualValue ?? "");
  if (actual === pending.value || Date.now() > pending.expiresAt) {
    delete state.pendingLinkUi[scope][key];
    return null;
  }
  return pending.value;
}

function clearPendingLinkUiValues() {
  state.pendingLinkUi = { local: {}, peer: {} };
  state.pendingWidebandUi = null;
}

function selectValueIfPresent(select, value) {
  if (!select) {
    return false;
  }
  const text = String(value ?? "");
  const option = Array.from(select.options).find((item) => item.value === text);
  if (!option) {
    return false;
  }
  select.value = option.value;
  syncCustomSelect(select);
  return true;
}

function uniqueNumberList(values) {
  const seen = new Set();
  const list = [];
  (Array.isArray(values) ? values : []).forEach((value) => {
    const number = Number(value);
    if (!Number.isInteger(number) || seen.has(number)) {
      return;
    }
    seen.add(number);
    list.push(number);
  });
  return list;
}

function staticMcsOptions() {
  return uniqueNumberList(Array.from(document.querySelector("#mcsSelect")?.options || [], (option) => option.value));
}

function normalizePowerRange(minValue, maxValue) {
  const min = Number(minValue);
  const max = Number(maxValue);
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 5 || max > 32 || min > max) {
    return null;
  }
  return { min, max };
}

function clonePowerRange(range) {
  return range ? { min: range.min, max: range.max } : null;
}

function ensureScopedPowerRange(scope = "local") {
  const normalizedScope = normalizePersistTargetScope(scope);
  if (!state.powerRanges[normalizedScope]) {
    state.powerRanges[normalizedScope] = {
      minidbRange: null,
      jsonRange: null,
      minidbRead: false,
      minidbPending: false,
      jsonRead: false,
      jsonPending: false,
    };
  }
  return state.powerRanges[normalizedScope];
}

function currentPowerRange(scope = activeLinkEndpointScope()) {
  const scoped = ensureScopedPowerRange(scope);
  return clonePowerRange(scoped.minidbRange)
    || clonePowerRange(scoped.jsonRange)
    || { ...fallbackPowerRange };
}

function powerRangeText(range = currentPowerRange()) {
  return `${range.min}-${range.max} dBm`;
}

function powerRangePayload(scope = activeLinkEndpointScope()) {
  const range = currentPowerRange(scope);
  return {
    powerRangeMin: range.min,
    powerRangeMax: range.max,
  };
}

function persistPowerRangePayload() {
  return {
    powerRangeMin: persistPowerEditableRange.min,
    powerRangeMax: persistPowerEditableRange.max,
  };
}

function normalizeDeviceRole(role) {
  const text = String(role ?? "").trim().toUpperCase();
  return text === "AP" || text === "DEV" ? text : "";
}

function objectValueIgnoreCase(object, key) {
  if (!object || typeof object !== "object" || Array.isArray(object)) {
    return undefined;
  }
  const entry = Object.entries(object).find(([name]) => name.toLowerCase() === key.toLowerCase());
  return entry ? entry[1] : undefined;
}

function configWithMcsRoles(config) {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return null;
  }
  if (objectValueIgnoreCase(config, "ap") || objectValueIgnoreCase(config, "dev")) {
    return config;
  }
  for (const value of Object.values(config)) {
    const matched = configWithMcsRoles(value);
    if (matched) {
      return matched;
    }
  }
  return null;
}

function localDeviceRole() {
  const overviewRole = normalizeDeviceRole(state.lastOverview?.role);
  if (overviewRole) {
    return overviewRole;
  }
  const active = els.roleSegment?.querySelector(".segment-button.active");
  return normalizeDeviceRole(active?.dataset.role);
}

function configMcsOptionsForRole(config, role) {
  const key = role === "AP" ? "ap" : "dev";
  const roleConfig = objectValueIgnoreCase(config, key);
  const table = roleConfig?.mcs?.slot?.mcs_tab;
  return uniqueNumberList(Array.isArray(table) ? table.map((item) => item?.mcs) : []);
}

function parseMcsOptionsByRole(text) {
  try {
    const parsed = JSON.parse(String(text || ""));
    const config = configWithMcsRoles(parsed) || parsed;
    const apOptions = configMcsOptionsForRole(config, "AP");
    const devOptions = configMcsOptionsForRole(config, "DEV");
    return {
      AP: apOptions.length ? apOptions : [...fallbackMcsOptionsByRole.AP],
      DEV: devOptions.length ? devOptions : [...fallbackMcsOptionsByRole.DEV],
    };
  } catch {
    return {
      AP: [...fallbackMcsOptionsByRole.AP],
      DEV: [...fallbackMcsOptionsByRole.DEV],
    };
  }
}

function powerRangeFromConfigNode(node) {
  if (!node || typeof node !== "object" || Array.isArray(node)) {
    return null;
  }

  const power = objectValueIgnoreCase(node, "power");
  const range = objectValueIgnoreCase(power, "pwr_range");
  if (Array.isArray(range) && range.length >= 2) {
    const normalized = normalizePowerRange(range[0], range[1]);
    if (normalized) {
      return normalized;
    }
  }

  for (const value of Object.values(node)) {
    const matched = powerRangeFromConfigNode(value);
    if (matched) {
      return matched;
    }
  }
  return null;
}

function parsePowerRangeFromDefaultConfig(text) {
  try {
    const parsed = JSON.parse(String(text || ""));
    return powerRangeFromConfigNode(parsed);
  } catch {
    return null;
  }
}

function powerRangeFromPersistPower(power) {
  if (!power || typeof power !== "object" || power.set !== true || power.mode !== "range") {
    return null;
  }
  return normalizePowerRange(power.min, power.max);
}

function updateMinidbPowerRangeFromPersistData(data) {
  const scope = normalizePersistTargetScope(data?.targetScope || activePersistTargetScope());
  const scoped = ensureScopedPowerRange(scope);
  if (!data || !Object.prototype.hasOwnProperty.call(data, "power")) {
    return false;
  }
  scoped.minidbRange = powerRangeFromPersistPower(data.power);
  scoped.minidbRead = true;
  scoped.minidbPending = false;
  return true;
}

function updateDefaultConfigCache(data, { updateMcs = true } = {}) {
  if (!data || typeof data.text !== "string") {
    return false;
  }
  const scope = normalizePersistTargetScope(data.targetScope || "local");
  const scoped = ensureScopedPowerRange(scope);
  scoped.jsonRange = parsePowerRangeFromDefaultConfig(data.text);
  scoped.jsonRead = true;
  scoped.jsonPending = false;
  if (updateMcs) {
    state.mcsOptionsByRole = parseMcsOptionsByRole(data.text);
  }
  return true;
}

function resetDefaultConfigCache() {
  state.mcsOptionsByRole = null;
  Object.values(state.powerRanges).forEach((rangeState) => {
    rangeState.minidbRange = null;
    rangeState.jsonRange = null;
    rangeState.minidbRead = false;
    rangeState.minidbPending = false;
    rangeState.jsonRead = false;
    rangeState.jsonPending = false;
  });
}

function currentMcsOptionsByRole() {
  return state.mcsOptionsByRole || {
    AP: [...fallbackMcsOptionsByRole.AP],
    DEV: [...fallbackMcsOptionsByRole.DEV],
  };
}

function mcsRoleForEndpoint(endpointScope = activeLinkEndpointScope()) {
  const role = localDeviceRole();
  const scope = normalizeEndpointScope(endpointScope);
  if (role === "AP") {
    return scope === "local" ? "DEV" : "AP";
  }
  if (role === "DEV") {
    return scope === "local" ? "AP" : "DEV";
  }
  return "";
}

function mcsOptionsForEndpoint(endpointScope = activeLinkEndpointScope()) {
  const byRole = currentMcsOptionsByRole();
  const role = mcsRoleForEndpoint(endpointScope);
  if (role && Array.isArray(byRole[role]) && byRole[role].length) {
    return [...byRole[role]];
  }
  return uniqueNumberList([
    ...staticMcsOptions(),
    ...byRole.AP,
    ...byRole.DEV,
  ]);
}

function refreshMcsOptionsForEndpoint(endpointScope = activeLinkEndpointScope(), { preferredValue } = {}) {
  const select = document.querySelector("#mcsSelect");
  if (!select) {
    return;
  }
  const options = mcsOptionsForEndpoint(endpointScope);
  if (!options.length) {
    return;
  }
  const current = String(select.value ?? "");
  const preferred = preferredValue !== undefined ? String(preferredValue) : current;
  const optionTexts = options.map((value) => String(value));
  const nextValue = optionTexts.includes(preferred)
    ? preferred
    : optionTexts.includes(current) ? current : optionTexts[0];

  select.replaceChildren(...options.map((value) => {
    const option = document.createElement("option");
    option.value = String(value);
    option.textContent = String(value);
    return option;
  }));
  select.value = nextValue;
  syncCustomSelect(select);
}

function refreshPowerOptions(endpointScope = activeLinkEndpointScope(), { preferredValue } = {}) {
  const select = document.querySelector("#powerSelect");
  if (!select) {
    return;
  }

  const range = currentPowerRange(endpointScope);
  const options = [];
  for (let value = range.min; value <= range.max; value += 1) {
    options.push(value);
  }
  if (!options.length) {
    return;
  }

  const current = String(select.value ?? "");
  const preferred = preferredValue !== undefined ? String(preferredValue) : current;
  const optionTexts = options.map((value) => String(value));
  let nextValue = optionTexts.includes(preferred)
    ? preferred
    : optionTexts.includes(current) ? current : "";
  if (!nextValue) {
    const numericPreferred = Number(preferred);
    const bounded = Number.isFinite(numericPreferred)
      ? Math.min(Math.max(Math.round(numericPreferred), range.min), range.max)
      : options[0];
    nextValue = String(bounded);
  }

  select.replaceChildren(...options.map((value) => {
    const option = document.createElement("option");
    option.value = String(value);
    option.textContent = `${value} dBm`;
    return option;
  }));
  select.value = nextValue;
  syncCustomSelect(select);
}

function updatePersistPowerInputLimits() {
  const range = persistPowerEditableRange;
  ["fixedPowerInput", "minPowerInput", "maxPowerInput"].forEach((id) => {
    const input = document.querySelector(`#${id}`);
    if (!input) {
      return;
    }
    input.min = String(range.min);
    input.max = String(range.max);
  });
}

function refreshLinkLimitControls(endpointScope = activeLinkEndpointScope()) {
  const values = ensureLinkConfigForm(endpointScope).values || defaultLinkConfigValues();
  refreshMcsOptionsForEndpoint(endpointScope, { preferredValue: values.mcs ?? 6 });
  refreshPowerOptions(endpointScope, { preferredValue: values.power ?? document.querySelector("#powerSelect")?.value ?? 20 });
  updatePersistPowerInputLimits();
}

function requestDefaultConfigForLinkLimits(endpointScope = activeLinkEndpointScope(), { force = false } = {}) {
  const scope = normalizePersistTargetScope(endpointScope);
  const scoped = ensureScopedPowerRange(scope);
  if (scope === activeLinkEndpointScope()) {
    refreshLinkLimitControls(scope);
  }
  if (!state.deviceConnected || scoped.jsonPending || (!force && scoped.jsonRead)) {
    return;
  }
  scoped.jsonPending = true;
  bridgeCall("readConfigFile", profileRequestOptions(scope, { mode: 0 })).then((response) => {
    if (!response.ok) {
      scoped.jsonPending = false;
      appendLog(response.message);
      if (scope === activeLinkEndpointScope()) {
        refreshLinkLimitControls(scope);
      }
    }
  });
}

function requestDefaultConfigForMcsOptions(endpointScope = activeLinkEndpointScope()) {
  requestDefaultConfigForLinkLimits(endpointScope, { force: true });
}

function requestPowerRangeSources(scope = activeLinkEndpointScope()) {
  const normalizedScope = normalizePersistTargetScope(scope);
  const scoped = ensureScopedPowerRange(normalizedScope);
  requestDefaultConfigForLinkLimits(normalizedScope);
  if (state.deviceConnected && !scoped.minidbRead && !scoped.minidbPending) {
    scoped.minidbPending = true;
    requestPersistConfig(normalizedScope);
  }
}

function requestAvailablePowerRangeSources() {
  if (!state.deviceConnected) {
    return;
  }
  requestPowerRangeSources("local");
  if (hasRemoteUpgradeTarget()) {
    requestPowerRangeSources("peer");
  }
}

function powerInPersistEditableRange(value) {
  const number = Number(value);
  const range = persistPowerEditableRange;
  return Number.isInteger(number) && number >= range.min && number <= range.max;
}

function validatePersistPowerInputs(showMessage = false) {
  const powerMode = activeSegmentValue('[data-persist-key="powerMode"]', "unset");
  if (powerMode === "fixed") {
    if (!powerInPersistEditableRange(document.querySelector("#fixedPowerInput")?.value)) {
      if (showMessage) {
        appendLog(`固定功率应在 ${powerRangeText(persistPowerEditableRange)} 之间`);
      }
      return false;
    }
  } else if (powerMode === "range") {
    const minPower = Number(document.querySelector("#minPowerInput")?.value);
    const maxPower = Number(document.querySelector("#maxPowerInput")?.value);
    if (!powerInPersistEditableRange(minPower) || !powerInPersistEditableRange(maxPower) || minPower > maxPower) {
      if (showMessage) {
        appendLog(`功率范围应在 ${powerRangeText(persistPowerEditableRange)}，且最小值不大于最大值`);
      }
      return false;
    }
  }
  return true;
}

function syncConfigMode(configKey, mode) {
  const segment = document.querySelector(`[data-config-key="${configKey}"]`);
  if (!segment) {
    return;
  }
  setSegmentValue(segment, mode);
  const target = segment.dataset.target;
  if (target) {
    const control = document.querySelector(`#${target}`);
    if (control) {
      control.disabled = mode !== "manual";
      syncCustomSelect(control);
    }
  }
}

function bandValueFromSnapshot(data) {
  const band = Number(data?.workBand);
  if (band === 1) {
    return "2g";
  }
  if (band === 2) {
    return "5g";
  }
  const name = String(data?.workBandName || "").trim().toLowerCase();
  return ["2g", "5g"].includes(name) ? name : "";
}

function linkConfigModeFromAuto(autoValue) {
  const value = Number(autoValue);
  if (!Number.isFinite(value)) {
    return "";
  }
  return value === 0 ? "manual" : "auto";
}

function captureLinkConfigForm(endpointScope = activeLinkEndpointScope()) {
  const form = ensureLinkConfigForm(endpointScope);
  const previous = form.values || defaultLinkConfigValues();
  return {
    ...previous,
    bandMode: activeSegmentValue('[data-config-key="bandMode"]', "auto"),
    band: document.querySelector("#bandSelect")?.value || "2g",
    channelMode: activeSegmentValue('[data-config-key="channelMode"]', "auto"),
    channel: Number(document.querySelector("#channelSelect")?.value || 0),
    bandwidthMode: activeSegmentValue('[data-config-key="bandwidthMode"]', "auto"),
    bandwidth: Number(document.querySelector("#bandwidthSelect")?.value || 2),
    mcsMode: activeSegmentValue('[data-config-key="mcsMode"]', "auto"),
    mcs: Number(document.querySelector("#mcsSelect")?.value || 6),
    powerAuto: activeSegmentValue('[data-config-key="powerAuto"]', "auto"),
    power: Number(document.querySelector("#powerSelect")?.value || 20),
  };
}

function saveLinkConfigForm(endpointScope = activeLinkEndpointScope()) {
  const form = ensureLinkConfigForm(endpointScope);
  form.values = captureLinkConfigForm(endpointScope);
}

function renderLinkConfigForm(endpointScope = activeLinkEndpointScope()) {
  const values = ensureLinkConfigForm(endpointScope).values || defaultLinkConfigValues();
  syncConfigMode("bandMode", values.bandMode || "auto");
  selectValueIfPresent(document.querySelector("#bandSelect"), values.band || "2g");
  const selectedChannel = updateChannelSelect(
    Array.isArray(values.channels) ? values.channels : [],
    values.channel ?? 7,
    values.band || "2g");
  if (Number.isInteger(selectedChannel) && selectedChannel >= 0) {
    values.channel = selectedChannel;
  }
  syncConfigMode("channelMode", values.channelMode || "auto");
  syncConfigMode("bandwidthMode", values.bandwidthMode || "auto");
  selectValueIfPresent(document.querySelector("#bandwidthSelect"), values.bandwidth ?? 2);
  refreshMcsOptionsForEndpoint(endpointScope, { preferredValue: values.mcs ?? 6 });
  syncConfigMode("mcsMode", values.mcsMode || "auto");
  selectValueIfPresent(document.querySelector("#mcsSelect"), values.mcs ?? 6);
  syncConfigMode("powerAuto", values.powerAuto || "auto");
  refreshPowerOptions(endpointScope, { preferredValue: values.power ?? 20 });
  selectValueIfPresent(document.querySelector("#powerSelect"), values.power ?? 20);
}

function refreshChannelSelectForCurrentBand(endpointScope = activeLinkEndpointScope()) {
  const form = ensureLinkConfigForm(endpointScope);
  const values = form.values || defaultLinkConfigValues();
  const band = document.querySelector("#bandSelect")?.value || values.band || "2g";
  const currentChannel = Number(document.querySelector("#channelSelect")?.value ?? values.channel ?? 7);
  const selectedChannel = updateChannelSelect(
    Array.isArray(values.channels) ? values.channels : [],
    Number.isInteger(currentChannel) ? currentChannel : values.channel ?? 7,
    band);
  values.band = band;
  if (Number.isInteger(selectedChannel) && selectedChannel >= 0) {
    values.channel = selectedChannel;
  }
  form.values = values;
  return selectedChannel;
}

function hasSnapshotField(data, key) {
  return Object.prototype.hasOwnProperty.call(data, key);
}

function hasLinkConfigSnapshot(data) {
  if (!data || typeof data !== "object") {
    return false;
  }
  const power = data.power && typeof data.power === "object" ? data.power : null;
  if (power && power.ready !== false
      && (hasSnapshotField(power, "powerAuto") || hasSnapshotField(power, "power"))) {
    return true;
  }
  return [
    "bandAuto",
    "workBand",
    "channelAuto",
    "workChannel",
    "rx",
    "tx",
    "bandwidthValue",
    "mcs",
    "txMcs",
    "rxMcs",
  ].some((key) => hasSnapshotField(data, key));
}

function linkConfigValuesFromSnapshot(data, { flatFallback = false } = {}) {
  if (!hasLinkConfigSnapshot(data)) {
    return null;
  }
  const hasReceiverConfig = [
    "bandAuto",
    "workBand",
    "channelAuto",
    "workChannel",
    "rx",
    "tx",
    "bandwidthValue",
    "mcs",
    "txMcs",
    "rxMcs",
  ].some((key) => hasSnapshotField(data, key));
  const values = {};
  if (hasReceiverConfig) {
    const bandMode = linkConfigModeFromAuto(data.bandAuto);
    if (bandMode) {
      values.bandMode = bandMode;
    }
    const bandValue = bandValueFromSnapshot(data);
    if (bandValue) {
      values.band = bandValue;
    }
    const channelMode = linkConfigModeFromAuto(data.channelAuto);
    if (channelMode) {
      values.channelMode = channelMode;
    }
    if (hasSnapshotField(data, "workChannel")) {
      values.channel = data.workChannel;
    }
    if (Array.isArray(data.channels)) {
      values.channels = Array.isArray(data.channels) ? data.channels : [];
    }
    values.bandwidthMode = "auto";
    const bandwidth = data.bandwidthValue ?? data.rx?.bandwidthValue ?? data.tx?.bandwidthValue;
    if (bandwidth !== undefined && bandwidth !== null) {
      values.bandwidth = bandwidth;
    }
    values.mcsMode = "auto";
    const mcs = flatFallback ? (data.txMcs ?? data.rxMcs) : (data.mcs ?? data.rxMcs ?? data.txMcs);
    if (mcs !== undefined && mcs !== null) {
      values.mcs = mcs;
    }
  }
  const power = data.power && typeof data.power === "object" ? data.power : null;
  if (power && power.ready !== false) {
    if (hasSnapshotField(power, "powerAuto")) {
      values.powerAuto = power.powerAuto ? "auto" : "manual";
    }
    if (hasSnapshotField(power, "power")) {
      values.power = Number(power.power);
    }
  }
  return values;
}

function valuesWithPendingLinkUi(endpointScope, values) {
  const next = { ...values };
  [
    "bandMode",
    "band",
    "channelMode",
    "channel",
    "bandwidthMode",
    "bandwidth",
    "mcsMode",
    "mcs",
    "powerAuto",
    "power",
  ].forEach((key) => {
    if (!hasSnapshotField(next, key)) {
      return;
    }
    const pending = pendingLinkUiValue(endpointScope, key, next[key]);
    if (pending !== null) {
      next[key] = pending;
    }
  });
  return next;
}

function updateLinkConfigFormFromSnapshot(endpointScope, snapshot, options = {}) {
  const power = snapshot && typeof snapshot === "object" && snapshot.power && typeof snapshot.power === "object"
    ? snapshot.power
    : null;
  const hasPowerSnapshot = power && power.ready !== false
    && (hasSnapshotField(power, "powerAuto") || hasSnapshotField(power, "power"));
  if (snapshot && typeof snapshot === "object" && snapshot.ready === false && !hasPowerSnapshot) {
    return false;
  }
  const values = linkConfigValuesFromSnapshot(snapshot, options);
  if (!values) {
    return false;
  }
  const form = ensureLinkConfigForm(endpointScope);
  form.values = {
    ...form.values,
    ...valuesWithPendingLinkUi(endpointScope, values),
  };
  form.synced = true;
  return true;
}

function updateWidebandFormFromSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object" || snapshot.ready === false) {
    return false;
  }
  if (!hasSnapshotField(snapshot, "widebandMode")) {
    return false;
  }
  const mode = normalizeWidebandMode(snapshot.widebandMode);
  const pending = pendingWidebandUiValue(mode);
  state.widebandForm = {
    synced: true,
    mode: pending ?? mode,
  };
  return true;
}

function syncLinkConfigFromSnapshot(data, { force = false } = {}) {
  if (!data || typeof data !== "object") {
    return;
  }

  saveLinkConfigForm(activeLinkEndpointScope());
  let updated = false;
  let widebandUpdated = false;
  const scopedConfig = data.linkConfig && typeof data.linkConfig === "object" ? data.linkConfig : null;
  if (scopedConfig) {
    updated = updateLinkConfigFormFromSnapshot("local", scopedConfig.local, { force }) || updated;
    updated = updateLinkConfigFormFromSnapshot("peer", scopedConfig.peer, { force }) || updated;
    widebandUpdated = updateWidebandFormFromSnapshot(scopedConfig.wideband) || widebandUpdated;
  } else {
    updated = updateLinkConfigFormFromSnapshot("peer", data, { force, flatFallback: true }) || updated;
    widebandUpdated = updateWidebandFormFromSnapshot(data) || widebandUpdated;
  }

  if (updated) {
    renderLinkConfigForm(activeLinkEndpointScope());
  }
  if (widebandUpdated) {
    renderWidebandForm();
  }
}

function rememberPendingLinkUi(payload) {
  const actions = Array.isArray(payload.actions) ? payload.actions : [];
  if (actions.includes("frameChange")) {
    const widebandMode = payload.frameChange === "switch" ? "switch" : "default";
    setPendingWidebandUiValue(widebandMode);
    state.widebandForm = { synced: state.widebandForm.synced, mode: widebandMode };
  }
  const endpointActions = actions.filter((action) => action !== "frameChange");
  if (endpointActions.length === 0) {
    return;
  }
  const endpointScope = normalizeEndpointScope(payload.endpointScope);
  const form = ensureLinkConfigForm(endpointScope);
  const values = { ...form.values };
  if (endpointActions.includes("bandMode")) {
    setPendingLinkUiValue(endpointScope, "bandMode", payload.bandMode);
    values.bandMode = payload.bandMode;
  }
  if (endpointActions.includes("band")) {
    setPendingLinkUiValue(endpointScope, "band", payload.band);
    values.band = payload.band;
  }
  if (endpointActions.includes("channelMode")) {
    setPendingLinkUiValue(endpointScope, "channelMode", payload.channelMode);
    values.channelMode = payload.channelMode;
  }
  if (endpointActions.includes("channel")) {
    setPendingLinkUiValue(endpointScope, "channel", payload.channel);
    values.channel = payload.channel;
  }
  if (endpointActions.includes("bandwidthMode")) {
    setPendingLinkUiValue(endpointScope, "bandwidthMode", payload.bandwidthMode);
    values.bandwidthMode = payload.bandwidthMode;
  }
  if (endpointActions.includes("bandwidth")) {
    setPendingLinkUiValue(endpointScope, "bandwidth", payload.bandwidth);
    values.bandwidth = payload.bandwidth;
  }
  if (endpointActions.includes("mcsMode")) {
    setPendingLinkUiValue(endpointScope, "mcsMode", payload.mcsMode);
    values.mcsMode = payload.mcsMode;
  }
  if (endpointActions.includes("mcs")) {
    setPendingLinkUiValue(endpointScope, "mcs", payload.mcs);
    values.mcs = payload.mcs;
  }
  if (endpointActions.includes("powerAuto")) {
    const powerAutoMode = payload.powerAuto ? "auto" : "manual";
    setPendingLinkUiValue(endpointScope, "powerAuto", powerAutoMode);
    values.powerAuto = powerAutoMode;
  }
  if (endpointActions.includes("power")) {
    setPendingLinkUiValue(endpointScope, "power", payload.power);
    values.power = payload.power;
  }
  form.values = values;
}

function updateWidebandStatuses() {
  document.querySelectorAll("[data-config-key=\"frameChange\"]").forEach((segment) => {
    const active = segment.querySelector(".segment-button.active");
    const status = segment.closest(".config-row")?.querySelector(".wideband-status");
    setLocalizedText(status, widebandStatusKey(active?.dataset.frameChange || "unknown"));
  });
}

function normalizeAccentColor(value) {
  const text = typeof value === "string" ? value.trim() : "";
  const match = text.match(/^#?([0-9a-fA-F]{6})$/);
  return match ? `#${match[1].toUpperCase()}` : defaultAccentColor;
}

function isCompleteAccentColor(value) {
  return /^#?[0-9a-fA-F]{6}$/.test(typeof value === "string" ? value.trim() : "");
}

function hexToRgb(hex) {
  const value = normalizeAccentColor(hex).slice(1);
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function mixChannel(from, to, amount) {
  return Math.round(from + (to - from) * amount);
}

function mixHex(hex, target, amount) {
  const rgb = hexToRgb(hex);
  return `#${[mixChannel(rgb.r, target, amount), mixChannel(rgb.g, target, amount), mixChannel(rgb.b, target, amount)]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

function rgbaFromHex(hex, alpha) {
  const rgb = hexToRgb(hex);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function contrastColor(hex) {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#101010" : "#ffffff";
}

function applyAccentColor(accent) {
  const color = normalizeAccentColor(accent);
  const isDark = state.preferences.theme === "dark";
  const root = document.documentElement;

  state.preferences.accent = color;
  root.style.setProperty("--blue", color);
  root.style.setProperty("--accent-fill", color);
  root.style.setProperty("--blue-hover", mixHex(color, isDark ? 255 : 0, isDark ? 0.2 : 0.12));
  root.style.setProperty("--blue-active", mixHex(color, isDark ? 255 : 0, isDark ? 0.32 : 0.22));
  root.style.setProperty("--accent-fill-hover", mixHex(color, isDark ? 255 : 0, isDark ? 0.2 : 0.12));
  root.style.setProperty("--blue-soft", rgbaFromHex(color, isDark ? 0.16 : 0.1));
  root.style.setProperty("--blue-ring", rgbaFromHex(color, isDark ? 0.28 : 0.2));
  root.style.setProperty("--blue-border", rgbaFromHex(color, 0.32));
  root.style.setProperty("--blue-border-strong", rgbaFromHex(color, 0.48));
  root.style.setProperty("--blue-gradient", rgbaFromHex(color, isDark ? 0.26 : 0.34));
  root.style.setProperty("--blue-grid", rgbaFromHex(color, isDark ? 0.05 : 0.04));
  root.style.setProperty("--cyan", mixHex(color, 255, isDark ? 0.34 : 0.22));
  root.style.setProperty("--accent-control-text", contrastColor(color));
}

function renderAccentControl() {
  const color = normalizeAccentColor(state.preferences.accent);
  if (els.accentColorInput) {
    els.accentColorInput.value = color;
  }
  if (els.accentColorText && document.activeElement !== els.accentColorText) {
    els.accentColorText.value = color;
  }
}

function normalizePreferences(value) {
  const preferences = value && typeof value === "object" ? value : {};
  return {
    theme: preferences.theme === "dark" ? "dark" : "light",
    language: preferences.language === "en" ? "en" : "zh",
    accent: normalizeAccentColor(preferences.accent),
  };
}

function loadPreferences() {
  try {
    const raw = window.localStorage?.getItem(preferencesStorageKey);
    return normalizePreferences(raw ? JSON.parse(raw) : null);
  } catch (error) {
    return normalizePreferences(null);
  }
}

function loadInitialPreferences() {
  return normalizePreferences(window.__L4_INITIAL_PREFERENCES || loadPreferences());
}

function savePreferences() {
  try {
    window.localStorage?.setItem(preferencesStorageKey, JSON.stringify(state.preferences));
  } catch (error) {
    // Local storage can be unavailable in embedded or restricted contexts.
  }
}

function setSettingSegmentValue(segment, value) {
  if (!segment) {
    return;
  }
  segment.querySelectorAll(".segment-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.settingValue === value);
  });
}

function renderAppInfo() {
  const version = state.appInfo.version || "--";
  const address = state.appInfo.address || "127.0.0.1";
  const port = state.appInfo.port || 50000;

  if (els.appInfo) {
    els.appInfo.textContent = `${version} · ${address}:${port}`;
  }
  if (els.settingsVersionValue) {
    els.settingsVersionValue.textContent = version;
  }
}

function renderSettingsState() {
  setSettingSegmentValue(els.themeSegment, state.preferences.theme);
  setSettingSegmentValue(els.languageSegment, state.preferences.language);
  renderAccentControl();
  renderAppInfo();
}

function applyTheme(theme) {
  state.preferences.theme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = state.preferences.theme;
  applyAccentColor(state.preferences.accent);
  renderSettingsState();
}

function refreshNavDatasetTitles() {
  [...els.navButtons, els.settingsButton].forEach((button) => {
    if (!button) {
      return;
    }
    const title = button.querySelector(".nav-title")?.textContent.trim();
    if (title) {
      button.dataset.title = title;
    }
  });
}

function applyLanguage(language) {
  state.preferences.language = language === "en" ? "en" : "zh";
  document.documentElement.lang = state.preferences.language === "en" ? "en" : "zh-CN";
  document.title = t("app.title");

  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((node) => {
    node.title = t(node.dataset.i18nTitle);
  });
  document.querySelectorAll("[data-i18n-aria-label]").forEach((node) => {
    node.setAttribute("aria-label", t(node.dataset.i18nAriaLabel));
  });
  if (els.freqListInput) {
    els.freqListInput.placeholder = t("persist.freqPlaceholder");
    els.freqListInput.setAttribute("aria-label", t("persist.freqListAria"));
  }
  if (els.uartBaudrateInput) {
    els.uartBaudrateInput.placeholder = t("persist.uartBaudratePlaceholder");
    els.uartBaudrateInput.setAttribute("aria-label", t("persist.uartBaudrateAria"));
  }

  refreshNavDatasetTitles();
  if (els.deviceSelect?.disabled && els.deviceSelect.options.length === 1 && !els.deviceSelect.value) {
    const option = els.deviceSelect.options[0];
    const optionKey = option.dataset.deviceOption === "not-found"
      ? "device.notFound"
      : option.dataset.deviceOption === "select-to-open"
        ? "device.selectToOpen"
        : "device.waiting";
    option.textContent = t(optionKey);
    syncCustomSelect(els.deviceSelect);
  }
  if (!state.deviceConnected) {
    setEmptySummary();
  } else if (state.lastOverview) {
    renderOverview(state.lastOverview);
  }
  if (state.lastMonitor) {
    renderMonitor(state.lastMonitor, { record: false });
  }
  setDaemonStatus(state.daemonConnected, state.statusMode === "warning"
    ? t("status.daemonConnecting")
    : t("status.daemonDisconnected"));
  renderSettingsState();
  renderOperationLog();
  refreshDeviceOptionTexts();
  syncTargetDeviceControls();
  updateUpgradeTargetHint();
  updateWidebandStatuses();
  updatePersistDirtyState();
  updateSearchStatus();
  renderMonitorLogControls();
  syncAllCustomSelects();
  scheduleSlimScrollbarUpdate();
}

function initializePreferences() {
  state.preferences = loadInitialPreferences();
  applyTheme(state.preferences.theme);
  applyLanguage(state.preferences.language);
  savePreferences();
  document.documentElement.dataset.uiReady = "true";
}

function preferencesPayload() {
  return {
    theme: state.preferences.theme,
    language: state.preferences.language,
    accent: state.preferences.accent,
  };
}

async function persistPreferencesToBridge(reportFailure = true) {
  if (!state.bridge || typeof state.bridge.setUserPreferences !== "function") {
    return;
  }

  const response = await bridgeCall("setUserPreferences", preferencesPayload());
  if (!response.ok && reportFailure) {
    appendLog(response.message || t("settings.saveFailed"));
  }
}

async function loadPreferencesFromBridge() {
  if (!state.bridge || typeof state.bridge.getUserPreferences !== "function") {
    return;
  }

  const response = await bridgeCall("getUserPreferences");
  if (!response.ok) {
    appendLog(response.message || t("settings.readFailed"));
    return;
  }

  const data = responseData(response);
  const nextPreferences = {
    theme: data.hasTheme ? data.theme : state.preferences.theme,
    language: data.hasLanguage ? data.language : state.preferences.language,
    accent: data.hasAccent ? data.accent : state.preferences.accent,
  };
  state.preferences = normalizePreferences(nextPreferences);
  applyTheme(state.preferences.theme);
  applyLanguage(state.preferences.language);
  savePreferences();

  if (!data.hasTheme || !data.hasLanguage || !data.hasAccent) {
    await persistPreferencesToBridge(false);
  }
}

function updateAccentPreference(value, options = {}) {
  if (!isCompleteAccentColor(value)) {
    if (options.commit) {
      renderAccentControl();
    }
    return;
  }

  applyAccentColor(value);
  renderAccentControl();
  savePreferences();
  persistPreferencesToBridge();
  if (options.report) {
    appendLog(t("settings.saved"));
  }
}

function applySettingChange(button) {
  const segment = button.closest("[data-setting-key]");
  const key = segment?.dataset.settingKey;
  const value = button.dataset.settingValue;
  if (!key || !value) {
    return;
  }

  if (key === "theme") {
    applyTheme(value);
  } else if (key === "language") {
    applyLanguage(value);
  }
  savePreferences();
  persistPreferencesToBridge();
  appendLog(t("settings.saved"));
}

function hasScrollableOverflow(target) {
  const rect = target.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && target.scrollHeight > target.clientHeight + 1;
}

function isPageScrollTarget(target) {
  return target.classList.contains("monitor-page")
    || target.classList.contains("link-config-page")
    || target.classList.contains("profile-page")
    || target.classList.contains("persist-page")
    || target.classList.contains("settings-page")
    || target.classList.contains("firmware-page");
}

function updateSlimScrollbar(meta) {
  const { target, rail, thumb } = meta;
  if (!hasScrollableOverflow(target)) {
    rail.classList.remove("visible");
    rail.hidden = true;
    return;
  }

  const rect = target.getBoundingClientRect();
  const shellRect = document.querySelector(".app-window")?.getBoundingClientRect();
  const railInset = 10;
  const railHeight = Math.max(0, rect.height - railInset * 2);
  const maxScroll = Math.max(1, target.scrollHeight - target.clientHeight);
  const thumbHeight = Math.max(44, Math.min(railHeight, railHeight * (target.clientHeight / target.scrollHeight)));
  const thumbTravel = Math.max(0, railHeight - thumbHeight);
  const thumbTop = (target.scrollTop / maxScroll) * thumbTravel;
  const targetRightEdge = isPageScrollTarget(target) ? rect.right + 10 : rect.right - 6;
  const shellRightLimit = shellRect ? shellRect.right - 10 : window.innerWidth - 8;
  const railRightEdge = Math.min(targetRightEdge, shellRightLimit);

  rail.hidden = false;
  rail.classList.add("visible");
  rail.style.left = `${Math.round(railRightEdge - 12)}px`;
  rail.style.top = `${Math.round(rect.top + railInset)}px`;
  rail.style.height = `${Math.round(railHeight)}px`;
  thumb.style.height = `${Math.round(thumbHeight)}px`;
  thumb.style.transform = `translateY(${Math.round(thumbTop)}px)`;
}

function updateSlimScrollbars() {
  slimScrollbarUpdateFrame = 0;
  slimScrollbars.forEach(updateSlimScrollbar);
}

function scheduleSlimScrollbarUpdate() {
  if (slimScrollbarUpdateFrame) {
    return;
  }
  slimScrollbarUpdateFrame = window.requestAnimationFrame(updateSlimScrollbars);
}

function createSlimScrollbar(target) {
  if (!target || target.dataset.slimScrollbarReady) {
    return;
  }

  target.dataset.slimScrollbarReady = "true";
  target.classList.add("slim-scroll-native");

  const rail = document.createElement("div");
  rail.className = "slim-scrollbar";
  rail.hidden = true;

  const thumb = document.createElement("div");
  thumb.className = "slim-scrollbar-thumb";
  rail.append(thumb);
  document.body.append(rail);

  const meta = {
    target,
    rail,
    thumb,
    dragging: false,
    dragStartY: 0,
    dragStartScrollTop: 0,
  };
  slimScrollbars.push(meta);

  target.addEventListener("scroll", () => updateSlimScrollbar(meta), { passive: true });

  thumb.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    meta.dragging = true;
    meta.dragStartY = event.clientY;
    meta.dragStartScrollTop = target.scrollTop;
    thumb.classList.add("dragging");
    thumb.setPointerCapture?.(event.pointerId);
  });

  thumb.addEventListener("pointermove", (event) => {
    if (!meta.dragging) {
      return;
    }
    const railHeight = Math.max(1, rail.getBoundingClientRect().height);
    const thumbHeight = Math.max(1, thumb.getBoundingClientRect().height);
    const maxScroll = Math.max(1, target.scrollHeight - target.clientHeight);
    const thumbTravel = Math.max(1, railHeight - thumbHeight);
    target.scrollTop = meta.dragStartScrollTop + ((event.clientY - meta.dragStartY) / thumbTravel) * maxScroll;
  });

  const stopDrag = (event) => {
    if (!meta.dragging) {
      return;
    }
    meta.dragging = false;
    thumb.classList.remove("dragging");
    thumb.releasePointerCapture?.(event.pointerId);
  };
  thumb.addEventListener("pointerup", stopDrag);
  thumb.addEventListener("pointercancel", stopDrag);
}

function initializeSlimScrollbars() {
  document
    .querySelectorAll(".monitor-page, .link-config-page, .profile-page, .persist-page, .settings-page, .firmware-page, .device-page > .section-panel")
    .forEach(createSlimScrollbar);

  window.addEventListener("resize", scheduleSlimScrollbarUpdate);
  if (typeof ResizeObserver !== "undefined") {
    const resizeObserver = new ResizeObserver(scheduleSlimScrollbarUpdate);
    slimScrollbars.forEach(({ target }) => resizeObserver.observe(target));
  }
  scheduleSlimScrollbarUpdate();
}

function closeCustomSelects(exceptSelect = null) {
  customSelects.forEach((meta, select) => {
    if (select === exceptSelect) {
      return;
    }
    meta.root.classList.remove("open");
    meta.button.setAttribute("aria-expanded", "false");
    meta.list.hidden = true;
  });
}

function positionBaudrateMenu() {
  if (!baudrateMenuOpen || !baudrateMenu || !els.uartBaudrateInput) {
    return;
  }

  const combo = els.uartBaudrateInput.closest(".baudrate-combo");
  const rect = (combo || els.uartBaudrateInput).getBoundingClientRect();
  const maxHeight = Math.max(92, Math.min(220, window.innerHeight - rect.bottom - 12));
  baudrateMenu.style.left = `${rect.left}px`;
  baudrateMenu.style.top = `${rect.bottom + 4}px`;
  baudrateMenu.style.width = `${rect.width}px`;
  baudrateMenu.style.maxHeight = `${maxHeight}px`;
}

function closeBaudrateMenu() {
  baudrateMenuOpen = false;
  baudrateActiveIndex = -1;
  els.uartBaudrateInput?.closest(".baudrate-combo")?.classList.remove("open");
  if (els.uartBaudrateToggle) {
    els.uartBaudrateToggle.setAttribute("aria-expanded", "false");
  }
  if (baudrateMenu) {
    baudrateMenu.hidden = true;
  }
}

function setBaudrateActiveIndex(index) {
  if (!baudrateMenu) {
    return;
  }

  const options = Array.from(baudrateMenu.querySelectorAll(".baudrate-option"));
  const nextIndex = Math.max(0, Math.min(options.length - 1, index));
  baudrateActiveIndex = nextIndex;
  options.forEach((option, optionIndex) => {
    const active = optionIndex === nextIndex;
    option.classList.toggle("selected", active);
    option.setAttribute("aria-selected", String(active));
    if (active) {
      option.scrollIntoView({ block: "nearest" });
    }
  });
}

function syncBaudrateOptions() {
  if (!baudrateMenu || !els.uartBaudrateInput) {
    return;
  }

  const currentValue = baudrateTextFromDom();
  const options = Array.from(baudrateMenu.querySelectorAll(".baudrate-option"));
  const selectedIndex = options.findIndex((option) => option.dataset.value === currentValue);
  if (selectedIndex >= 0) {
    setBaudrateActiveIndex(selectedIndex);
    return;
  }
  baudrateActiveIndex = -1;
  options.forEach((option) => {
    option.classList.remove("selected");
    option.setAttribute("aria-selected", "false");
  });
}

function selectBaudrateOption(value) {
  if (!els.uartBaudrateInput) {
    return;
  }

  els.uartBaudrateInput.value = String(value);
  els.uartBaudrateInput.classList.remove("invalid");
  updatePersistDirtyState();
  closeBaudrateMenu();
  applyPersistConfig(["uartBaudrate"]);
  els.uartBaudrateInput.focus({ preventScroll: true });
}

function openBaudrateMenu() {
  if (!baudrateMenu || !els.uartBaudrateInput) {
    return;
  }

  closeCustomSelects();
  baudrateMenuOpen = true;
  els.uartBaudrateInput.closest(".baudrate-combo")?.classList.add("open");
  els.uartBaudrateToggle?.setAttribute("aria-expanded", "true");
  baudrateMenu.hidden = false;
  positionBaudrateMenu();
  syncBaudrateOptions();
}

function toggleBaudrateMenu() {
  if (baudrateMenuOpen) {
    closeBaudrateMenu();
  } else {
    openBaudrateMenu();
  }
}

function positionCustomSelectList(meta) {
  const rect = meta.button.getBoundingClientRect();
  const maxHeight = Math.max(92, Math.min(220, window.innerHeight - rect.bottom - 12));
  meta.list.style.left = `${rect.left}px`;
  meta.list.style.top = `${rect.bottom + 4}px`;
  meta.list.style.width = `${rect.width}px`;
  meta.list.style.maxHeight = `${maxHeight}px`;
}

function setCustomSelectOpen(select, open) {
  const meta = customSelects.get(select);
  if (!meta || (open && select.disabled)) {
    return;
  }
  if (open) {
    closeCustomSelects(select);
    closeBaudrateMenu();
    meta.root.classList.add("open");
    meta.button.setAttribute("aria-expanded", "true");
    meta.list.hidden = false;
    positionCustomSelectList(meta);
    return;
  }
  meta.root.classList.remove("open");
  meta.button.setAttribute("aria-expanded", "false");
  meta.list.hidden = true;
}

function syncCustomSelect(select) {
  const meta = customSelects.get(select);
  if (!meta) {
    return;
  }

  const options = Array.from(select.options);
  const selected = options.find((option) => option.value === select.value) || options[select.selectedIndex] || options[0];
  meta.label.textContent = selected?.textContent || "";
  meta.button.disabled = select.disabled;
  meta.root.classList.toggle("disabled", select.disabled);
  meta.button.setAttribute("aria-disabled", String(select.disabled));

  meta.list.innerHTML = "";
  options.forEach((option) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "custom-select-option";
    item.setAttribute("role", "option");
    item.dataset.value = option.value;
    item.textContent = option.textContent;
    item.disabled = option.disabled;
    const isSelected = option === selected;
    item.classList.toggle("selected", isSelected);
    item.setAttribute("aria-selected", String(isSelected));
    item.addEventListener("click", () => {
      if (select.disabled || option.disabled) {
        return;
      }
      select.value = option.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      syncCustomSelect(select);
      setCustomSelectOpen(select, false);
    });
    meta.list.append(item);
  });

  if (select.disabled) {
    setCustomSelectOpen(select, false);
  }
}

function createCustomSelect(select) {
  if (!select || customSelects.has(select)) {
    return;
  }

  const root = document.createElement("div");
  root.className = `custom-select ${select.classList.contains("device-select") ? "custom-select-device" : "custom-select-config"}`;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "custom-select-button";
  button.setAttribute("aria-haspopup", "listbox");
  button.setAttribute("aria-expanded", "false");
  const label = document.createElement("span");
  label.className = "custom-select-label";
  button.append(label);

  const list = document.createElement("div");
  list.className = "custom-select-list";
  list.setAttribute("role", "listbox");
  list.hidden = true;
  document.body.append(list);
  root.append(button);
  select.classList.add("native-select-hidden");
  select.insertAdjacentElement("afterend", root);
  select.closest(".device-select-wrap")?.classList.add("custom-select-ready");

  const meta = { root, button, label, list };
  customSelects.set(select, meta);

  button.addEventListener("click", () => setCustomSelectOpen(select, !root.classList.contains("open")));
  button.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setCustomSelectOpen(select, false);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setCustomSelectOpen(select, !root.classList.contains("open"));
    }
  });
  select.addEventListener("change", () => syncCustomSelect(select));
  new MutationObserver(() => syncCustomSelect(select)).observe(select, {
    attributes: true,
    childList: true,
    subtree: true,
  });
  syncCustomSelect(select);
}

function initializeCustomSelects() {
  document.querySelectorAll("select.device-select, select.config-select").forEach(createCustomSelect);
  document.addEventListener("click", (event) => {
    const keepOpen = Array.from(customSelects.values()).some((meta) => {
      return meta.root.contains(event.target) || meta.list.contains(event.target);
    }) || !!event.target.closest(".baudrate-combo") || !!event.target.closest(".baudrate-menu");
    if (!keepOpen) {
      closeCustomSelects();
      closeBaudrateMenu();
    }
  });
  window.addEventListener("resize", () => {
    customSelects.forEach((meta) => {
      if (!meta.list.hidden) {
        positionCustomSelectList(meta);
      }
    });
    positionBaudrateMenu();
  });
}

function initializeBaudrateCombo() {
  if (!els.uartBaudrateInput || !els.uartBaudrateToggle) {
    return;
  }

  baudrateMenu = document.createElement("div");
  baudrateMenu.className = "baudrate-menu";
  baudrateMenu.setAttribute("role", "listbox");
  baudrateMenu.hidden = true;
  commonBaudrates.forEach((baudrate) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "baudrate-option";
    option.dataset.value = String(baudrate);
    option.setAttribute("role", "option");
    option.textContent = String(baudrate);
    option.addEventListener("pointerdown", (event) => event.preventDefault());
    option.addEventListener("click", () => selectBaudrateOption(baudrate));
    baudrateMenu.append(option);
  });
  document.body.append(baudrateMenu);

  els.uartBaudrateToggle.setAttribute("aria-haspopup", "listbox");
  els.uartBaudrateToggle.setAttribute("aria-expanded", "false");
  els.uartBaudrateToggle.addEventListener("click", toggleBaudrateMenu);
  els.uartBaudrateInput.addEventListener("click", openBaudrateMenu);
  els.uartBaudrateInput.addEventListener("input", () => {
    if (baudrateMenuOpen) {
      syncBaudrateOptions();
    }
  });
  els.uartBaudrateInput.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!baudrateMenuOpen) {
        openBaudrateMenu();
      }
      setBaudrateActiveIndex(baudrateActiveIndex < 0 ? 0 : baudrateActiveIndex + 1);
    } else if (event.key === "ArrowUp" && baudrateMenuOpen) {
      event.preventDefault();
      setBaudrateActiveIndex(baudrateActiveIndex < 0 ? commonBaudrates.length - 1 : baudrateActiveIndex - 1);
    } else if (event.key === "Enter" && baudrateMenuOpen && baudrateActiveIndex >= 0) {
      event.preventDefault();
      selectBaudrateOption(commonBaudrates[baudrateActiveIndex]);
    } else if (event.key === "Escape") {
      closeBaudrateMenu();
    }
  });
  document.addEventListener("scroll", positionBaudrateMenu, true);
}

function channelFrequencyMhz(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    return null;
  }
  return number >= 100000 ? number / 1000 : number;
}

function channelFrequencyLabel(value) {
  const mhz = channelFrequencyMhz(value);
  if (mhz === null) {
    return "--";
  }
  const rounded = Math.round(mhz);
  if (Math.abs(mhz - rounded) < 0.05) {
    return String(rounded);
  }
  return mhz.toFixed(1).replace(/\.0$/, "");
}

function defaultChannelFrequency(index) {
  return defaultChannelBaseMhz + index * defaultChannelStepMhz;
}

function channelOptionsFromSnapshot(channels = []) {
  const options = [];
  if (!Array.isArray(channels)) {
    return options;
  }
  channels.forEach((item, fallbackIndex) => {
    const index = Number(item?.index ?? fallbackIndex);
    const frequency = channelFrequencyMhz(item?.frequency);
    if (Number.isInteger(index) && index >= 0 && frequency !== null) {
      options.push({ index, frequency });
    }
  });
  return options.sort((left, right) => left.index - right.index);
}

function defaultChannelOptions() {
  const options = [];
  for (let index = 0; index < channelOptionCount; index += 1) {
    options.push({ index, frequency: defaultChannelFrequency(index) });
  }
  return options;
}

function channelOptionsForBand(options, band) {
  if (band === "2g") {
    return options.filter((item) => item.frequency < channelBandSplitMhz);
  }
  if (band === "5g") {
    return options.filter((item) => item.frequency >= channelBandSplitMhz);
  }
  return options;
}

function updateChannelSelect(channels = [], selectedChannel, band = "2g") {
  const select = document.querySelector("#channelSelect");
  if (!select) {
    return null;
  }

  const previousValue = select.value || "7";
  const selectedIndex = Number(selectedChannel);
  const channelOptions = channelOptionsFromSnapshot(channels);
  const sourceOptions = channelOptions.length ? channelOptions : defaultChannelOptions();
  const filteredOptions = channelOptionsForBand(sourceOptions, band);
  const options = filteredOptions.length ? filteredOptions : sourceOptions;
  const optionValues = new Set(options.map((item) => String(item.index)));
  const preferredValue = Number.isInteger(selectedIndex) && selectedIndex >= 0
    ? String(selectedIndex)
    : previousValue;
  const nextValue = optionValues.has(preferredValue)
    ? preferredValue
    : optionValues.has(previousValue)
      ? previousValue
      : String(options[0]?.index ?? 0);

  select.innerHTML = "";
  const separator = state.preferences.language === "en" ? ": " : "：";
  options.forEach(({ index, frequency }) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `${index}${separator}${channelFrequencyLabel(frequency)}`;
    select.append(option);
  });

  select.value = nextValue;
  syncCustomSelect(select);
  return Number(select.value);
}

function initializeChannelSelect() {
  updateChannelSelect([], 7, "2g");
}

function bridgeCall(method, payload) {
  return new Promise((resolve) => {
    if (!state.bridge || typeof state.bridge[method] !== "function") {
      resolve({ ok: false, code: -1, message: t("status.webChannelNotReady"), data: {} });
      return;
    }
    if (payload === undefined) {
      state.bridge[method](resolve);
    } else {
      state.bridge[method](payload, resolve);
    }
  });
}

function responseData(response) {
  if (response && typeof response === "object" && "data" in response) {
    return response.data || {};
  }
  return response || {};
}

function appendLog(message) {
  const text = String(message || "").trim();
  if (!text) {
    return;
  }
  state.lastLog = {
    time: new Date(),
    message: text,
  };
  renderOperationLog();
}

function dialogFocusableElements() {
  if (!els.appDialog || els.appDialog.hidden) {
    return [];
  }
  return Array
    .from(els.appDialog.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"))
    .filter((item) => !item.disabled && item.getAttribute("aria-hidden") !== "true");
}

function closeAppDialog(confirmed) {
  if (!els.appDialog || typeof state.dialogResolve !== "function") {
    return;
  }

  const resolve = state.dialogResolve;
  const returnFocus = state.dialogReturnFocus;
  const token = state.dialogToken;
  state.dialogResolve = null;
  state.dialogReturnFocus = null;
  els.appDialog.classList.remove("open");

  window.setTimeout(() => {
    if (state.dialogToken === token && !state.dialogResolve) {
      els.appDialog.hidden = true;
      els.appDialog.removeAttribute("data-tone");
    }
  }, 170);

  resolve(!!confirmed);
  if (returnFocus && typeof returnFocus.focus === "function") {
    window.setTimeout(() => returnFocus.focus({ preventScroll: true }), 0);
  }
}

function handleDialogKeydown(event) {
  if (!els.appDialog || els.appDialog.hidden) {
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    closeAppDialog(false);
    return;
  }

  if (event.key === "Enter" && !event.target.closest("button")) {
    event.preventDefault();
    closeAppDialog(true);
    return;
  }

  if (event.key !== "Tab") {
    return;
  }

  const focusable = dialogFocusableElements();
  if (focusable.length === 0) {
    event.preventDefault();
    els.dialogPanel?.focus();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function showConfirmDialog(options = {}) {
  if (!els.appDialog || !els.dialogConfirm || !els.dialogCancel) {
    return Promise.resolve(false);
  }

  if (typeof state.dialogResolve === "function") {
    closeAppDialog(false);
  }

  const {
    title = t("dialog.defaultTitle"),
    message = "",
    kicker = t("dialog.defaultKicker"),
    confirmText = t("common.confirm"),
    cancelText = t("common.cancel"),
    tone = "default",
    showCancel = true,
  } = options;

  return new Promise((resolve) => {
    state.dialogToken += 1;
    state.dialogResolve = resolve;
    state.dialogReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    setPlainText(els.dialogKicker, kicker);
    setPlainText(els.dialogTitle, title);
    setPlainText(els.dialogMessage, message);
    els.dialogMessage.hidden = !message;
    setPlainText(els.dialogConfirm, confirmText);
    setPlainText(els.dialogCancel, cancelText);
    els.dialogCancel.hidden = !showCancel;
    els.dialogCancel.disabled = !showCancel;
    els.appDialog.dataset.tone = tone;
    els.appDialog.hidden = false;

    closeCustomSelects();
    window.requestAnimationFrame(() => {
      els.appDialog.classList.add("open");
      els.dialogConfirm.focus({ preventScroll: true });
    });
  });
}

function showInfoDialog(options = {}) {
  return showConfirmDialog({
    ...options,
    confirmText: options.confirmText || t("common.confirm"),
    showCancel: false,
  });
}

function initializeAppDialog() {
  if (!els.appDialog) {
    return;
  }
  els.dialogConfirm?.addEventListener("click", () => closeAppDialog(true));
  els.dialogCancel?.addEventListener("click", () => closeAppDialog(false));
  els.dialogBackdrop?.addEventListener("click", () => closeAppDialog(false));
  els.appDialog.addEventListener("keydown", handleDialogKeydown);
}

function setDaemonStatus(connected, hint = "") {
  state.daemonConnected = !!connected;
  const stateName = connected ? "connected" : state.statusMode === "warning" ? "connecting" : "offline";
  els.daemonStatus.dataset.state = stateName;
  els.daemonStatusText.textContent = connected ? t("status.daemonConnected") : (hint || t("status.daemonDisconnected"));
}

function setStatus(mode, text) {
  state.statusMode = mode;
  state.statusText = text;
  if (!state.daemonConnected) {
    setDaemonStatus(false, mode === "warning" ? t("status.daemonConnecting") : t("status.daemonDisconnected"));
  }
}

function setEmptySummary() {
  els.modeValue.textContent = "--";
  els.localMacValue.textContent = "--";
  els.uptimeValue.textContent = "--";
  els.firmwareValue.textContent = "--";
  els.firmwareValue.title = "";
  updateUpgradeTargetHint();
  els.roleSegment.querySelectorAll(".segment-button").forEach((button) => {
    button.classList.remove("active");
  });
  els.pairTableBody.innerHTML = `<tr><td colspan="5" class="empty-cell">${t("empty.noDeviceData")}</td></tr>`;
  clearMonitorView(t("empty.noDeviceData"));
}

function syncPowerInputs(button) {
  const row = button.closest(".config-row");
  const fixedInput = row?.querySelector(".power-fixed-input");
  const rangeInputs = row?.querySelectorAll(".power-range-input") ?? [];
  if (!fixedInput) {
    return;
  }

  const powerMode = button.dataset.power;
  fixedInput.disabled = powerMode !== "fixed";
  if (fixedInput.disabled) {
    fixedInput.value = "";
  }
  rangeInputs.forEach((input) => {
    input.disabled = powerMode !== "range";
    if (input.disabled) {
      input.value = "";
    }
  });
}

function capturePersistState() {
  if (!els.persistPage) {
    return "";
  }

  const segments = Array.from(els.persistPage.querySelectorAll(".segment[data-persist-key]")).map((segment) => {
    const key = segment.dataset.persistKey || segment.getAttribute("aria-label");
    const active = segment.querySelector(".segment-button.active");
    return [key, active?.dataset.value || active?.dataset.power || active?.textContent.trim() || ""];
  });
  const inputs = Array.from(els.persistPage.querySelectorAll("[data-persist-input]")).map((input) => [
    input.id,
    input.disabled ? "" : input.value.trim(),
  ]);
  return JSON.stringify({ segments, inputs });
}

function restorePersistState(serializedState) {
  if (!serializedState || !els.persistPage) {
    return false;
  }
  try {
    const saved = JSON.parse(serializedState);
    const segments = Array.isArray(saved.segments) ? saved.segments : [];
    segments.forEach(([key, value]) => {
      const segment = els.persistPage.querySelector(`.segment[data-persist-key="${key}"]`);
      if (segment) {
        setSegmentValue(segment, value || "unset");
      }
    });
    const inputs = Array.isArray(saved.inputs) ? saved.inputs : [];
    inputs.forEach(([id, value]) => {
      const input = document.querySelector(`#${id}`);
      if (input && !input.disabled) {
        input.value = value || "";
      }
    });
    syncPersistUnsetButtons();
    return true;
  } catch (error) {
    return false;
  }
}

function setPersistFormStatus(scope, mode) {
  const normalizedScope = normalizePersistTargetScope(scope);
  const form = currentPersistForm(normalizedScope);
  form.statusMode = ["clean", "dirty", "applying", "pendingReboot", "failed"].includes(mode) ? mode : "clean";
  if (normalizedScope === activePersistTargetScope()) {
    setPersistStatus(form.statusMode);
  }
}

function setPersistStatus(mode) {
  if (!els.persistStatus) {
    return;
  }

  const normalizedMode = ["clean", "dirty", "applying", "pendingReboot", "failed"].includes(mode) ? mode : "clean";
  state.persistStatusMode = normalizedMode;
  currentPersistForm().statusMode = normalizedMode;
  setLocalizedText(els.persistStatus, `persist.${normalizedMode}`);
  els.persistStatus.classList.toggle("dirty", ["dirty", "applying"].includes(normalizedMode));
  els.persistStatus.classList.toggle("pending-reboot", normalizedMode === "pendingReboot");
  els.persistStatus.classList.toggle("failed", normalizedMode === "failed");
}

function currentPersistStatusMode() {
  const form = currentPersistForm();
  const isDirty = capturePersistState() !== (form.savedState || state.persistSavedState);
  if (form.rebootPending || state.persistRebootPending) {
    return "pendingReboot";
  }
  return isDirty ? "dirty" : "clean";
}

function updatePersistDirtyState() {
  if (!els.persistStatus || state.persistStatusMode === "applying") {
    return;
  }

  setPersistStatus(currentPersistStatusMode());
}

function setSegmentToUnset(segment) {
  const unsetButton = segment.querySelector("[data-unset]");
  if (!unsetButton) {
    return;
  }

  segment.querySelectorAll(".segment-button").forEach((button) => button.classList.remove("active"));
  unsetButton.classList.add("active");
  if (unsetButton.dataset.power) {
    syncPowerInputs(unsetButton);
  }
  syncPersistUnsetButton(segment);
}

function syncPersistUnsetButton(segment) {
  if (!segment || !segment.closest("#persistPage")) {
    return;
  }
  const unsetButton = segment.querySelector("[data-unset]");
  if (!unsetButton) {
    return;
  }

  const active = segment.querySelector(".segment-button.active");
  const activeIsUnset = active === unsetButton
    || active?.dataset.value === "unset"
    || active?.dataset.power === "unset";
  unsetButton.disabled = !activeIsUnset;
  unsetButton.setAttribute("aria-disabled", unsetButton.disabled ? "true" : "false");
}

function syncPersistUnsetButtons() {
  els.persistPage?.querySelectorAll(".segment[data-persist-key]").forEach(syncPersistUnsetButton);
}

function clearPersistConfigView() {
  resetPersistFormUi();
  state.persistRebootPending = false;
  state.persistSavedState = capturePersistState();
  Object.values(state.persistForms).forEach((form) => {
    form.savedState = state.persistSavedState;
    form.draftState = state.persistSavedState;
    form.statusMode = "clean";
    form.rebootPending = false;
    form.synced = false;
  });
  setPersistStatus("clean");
}

function updateSearchStatus() {
  if (!els.configSearchStatus) {
    return;
  }

  const total = state.searchMatches.length;
  if (total === 0) {
    setLocalizedText(els.configSearchStatus, "profile.noResults");
    return;
  }

  const current = total > 0 && state.searchIndex >= 0 ? state.searchIndex + 1 : 0;
  setPlainText(els.configSearchStatus, `${current}/${total}`);
}

function resetConfigSearch() {
  state.searchMatches = [];
  state.searchIndex = -1;
  updateSearchStatus();
}

function clearConfigFileView() {
  resetDefaultConfigCache();
  refreshLinkLimitControls(activeLinkEndpointScope());
  if (els.jsonEditor) {
    els.jsonEditor.value = "";
  }
  Object.values(state.profileForms).forEach((form) => {
    form.text = "";
    form.metaText = "";
    form.read = false;
  });
  setLocalizedText(els.configFileMeta, "profile.notRead");
  resetConfigSearch();
}

function collectSearchMatches() {
  const query = els.configSearch?.value.trim() || "";
  resetConfigSearch();

  if (!query || !els.jsonEditor) {
    return;
  }

  const source = els.jsonEditor.value.toLocaleLowerCase();
  const needle = query.toLocaleLowerCase();
  let index = source.indexOf(needle);
  while (index !== -1) {
    state.searchMatches.push({ start: index, end: index + query.length });
    index = source.indexOf(needle, index + Math.max(needle.length, 1));
  }

  if (state.searchMatches.length > 0) {
    state.searchIndex = 0;
  }
  updateSearchStatus();
}

function editorLineHeight() {
  const computed = window.getComputedStyle(els.jsonEditor);
  const lineHeight = Number.parseFloat(computed.lineHeight);
  if (Number.isFinite(lineHeight) && lineHeight > 0) {
    return lineHeight;
  }

  const fontSize = Number.parseFloat(computed.fontSize);
  return Number.isFinite(fontSize) && fontSize > 0 ? fontSize * 1.55 : 20;
}

function lineIndexAtOffset(text, offset) {
  const prefix = text.slice(0, Math.max(0, offset));
  return (prefix.match(/\n/g) || []).length;
}

function centerEditorOnOffset(offset) {
  if (!els.jsonEditor) {
    return;
  }

  window.requestAnimationFrame(() => {
    const editor = els.jsonEditor;
    const computed = window.getComputedStyle(editor);
    const paddingTop = Number.parseFloat(computed.paddingTop) || 0;
    const lineHeight = editorLineHeight();
    const lineTop = paddingTop + lineIndexAtOffset(editor.value, offset) * lineHeight;
    const centeredTop = lineTop - (editor.clientHeight - lineHeight) / 2;
    const maxScroll = Math.max(0, editor.scrollHeight - editor.clientHeight);
    editor.scrollTop = Math.max(0, Math.min(maxScroll, centeredTop));
  });
}

function selectSearchMatch() {
  const match = state.searchMatches[state.searchIndex];
  if (!match || !els.jsonEditor) {
    return;
  }

  try {
    els.jsonEditor.focus({ preventScroll: true });
  } catch (error) {
    els.jsonEditor.focus();
  }
  els.jsonEditor.setSelectionRange(match.start, match.end);
  centerEditorOnOffset(match.start);
}

function searchConfig() {
  collectSearchMatches();
  selectSearchMatch();
}

function moveSearchResult(delta) {
  if (state.searchMatches.length === 0) {
    searchConfig();
    return;
  }

  const total = state.searchMatches.length;
  state.searchIndex = (state.searchIndex + delta + total) % total;
  updateSearchStatus();
  selectSearchMatch();
}

function activeSegmentValue(selector, fallback = "") {
  const active = document.querySelector(`${selector} .segment-button.active`);
  return active?.dataset.value
    ?? active?.dataset.mode
    ?? active?.dataset.targetScope
    ?? active?.dataset.frameChange
    ?? active?.dataset.upgradeTarget
    ?? fallback;
}

function activeSegmentText(selector, fallback = "") {
  return document.querySelector(`${selector} .segment-button.active`)?.textContent.trim() || fallback;
}

function requestCurrentSnapshot(force = false) {
  if (!state.deviceConnected) {
    return;
  }
  if (force || state.monitorLog.recording || state.currentCode === "L4.MONITOR" || state.currentCode === "L4.LINK") {
    bridgeCall("getMonitorSnapshot", { slot: 0, user: 0 });
  }
}

function startRefresh() {
  if (state.refreshTimer || !state.deviceConnected) {
    return;
  }
  const interval = state.currentCode === "L4.MONITOR" || state.monitorLog.recording ? 1000 : 0;
  if (!interval) {
    return;
  }
  state.refreshTimer = window.setInterval(() => {
    requestCurrentSnapshot();
  }, interval);
}

function stopRefresh() {
  if (!state.refreshTimer) {
    return;
  }
  window.clearInterval(state.refreshTimer);
  state.refreshTimer = null;
}

function startDeviceScan() {
  if (state.deviceScanTimer) {
    return;
  }
  requestDeviceScan();
  state.deviceScanTimer = window.setInterval(requestDeviceScan, 1000);
}

function requestDeviceScan() {
  if (!state.bridge || state.deviceScanPending) {
    return;
  }

  state.deviceScanPending = true;
  bridgeCall("listDevices", { autoOpen: false }).then((response) => {
    if (response && response.ok === false) {
      state.deviceScanPending = false;
    }
  });

  window.setTimeout(() => {
    state.deviceScanPending = false;
  }, 900);
}

function openSelectedDevice(devices) {
  if (!state.bridge || !Array.isArray(devices) || devices.length === 0) {
    return;
  }

  const index = els.deviceSelect.value === "" ? NaN : Number(els.deviceSelect.value);
  if (!Number.isInteger(index) || index < 0) {
    return;
  }
  const device = findDeviceByIndex(index, devices);
  const serial = String(device?.serial || "");
  const canAutoOpen = state.allowAutoOpenDevice || sameDeviceSerial(state.lastOpenedDeviceSerial, serial);
  if (!canAutoOpen) {
    return;
  }
  if (state.deviceConnected && isConnectedDeviceSelection(index, serial)) {
    return;
  }
  if (sameDeviceSerial(state.openingDeviceSerial, serial) || state.openingDeviceIndex === index) {
    return;
  }

  state.openingDeviceIndex = index;
  state.openingDeviceSerial = serial;
  bridgeCall("openDevice", { index, serial }).then((response) => {
    if (response && response.ok === false) {
      state.openingDeviceIndex = null;
      state.openingDeviceSerial = "";
    }
  });
}

function renderDevices(response) {
  const data = responseData(response);
  const devices = Array.isArray(data.devices) ? data.devices : [];
  state.devices = devices;
  state.deviceScanPending = false;
  els.deviceSelect.innerHTML = "";
  if (devices.length === 0) {
    state.deviceConnected = false;
    state.connectedDeviceIndex = -1;
    state.connectedDeviceSerial = "";
    const option = document.createElement("option");
    option.value = "";
    option.dataset.deviceOption = "not-found";
    option.textContent = t("device.notFound");
    els.deviceSelect.append(option);
    els.deviceSelect.disabled = true;
    syncCustomSelect(els.deviceSelect);
    setDaemonStatus(!!data.hostConnected);
    setStatus(data.hostConnected ? "warning" : "offline", data.hostConnected ? t("device.notFound") : t("status.daemonDisconnected"));
    clearConfigFileView();
    clearPersistConfigView();
    setEmptySummary();
    syncTargetDeviceControls();
    return;
  }

  setDaemonStatus(true);
  const reconnectDevice = !state.deviceConnected ? findDeviceBySerial(state.lastOpenedDeviceSerial, devices) : null;
  const requireManualSelection = !state.deviceConnected && !state.allowAutoOpenDevice && !reconnectDevice;
  if (requireManualSelection) {
    const option = document.createElement("option");
    option.value = "";
    option.dataset.deviceOption = "select-to-open";
    option.textContent = t("device.selectToOpen");
    els.deviceSelect.append(option);
  }
  devices.forEach((device) => {
    const option = document.createElement("option");
    option.value = String(device.index);
    option.textContent = deviceOptionText(device);
    els.deviceSelect.append(option);
  });
  els.deviceSelect.disabled = false;

  const connectedDevice = findDeviceBySerial(state.connectedDeviceSerial, devices);
  const previousValue = els.deviceSelect.value || String(state.selectedDeviceIndex);
  const hasPrevious = devices.some((device) => String(device.index) === previousValue);
  if (connectedDevice) {
    els.deviceSelect.value = String(connectedDevice.index);
  } else if (reconnectDevice) {
    els.deviceSelect.value = String(reconnectDevice.index);
  } else if (requireManualSelection) {
    els.deviceSelect.value = "";
  } else {
    els.deviceSelect.value = hasPrevious ? previousValue : String(devices[0].index);
  }
  state.selectedDeviceIndex = els.deviceSelect.value === "" ? -1 : Number(els.deviceSelect.value);
  syncCustomSelect(els.deviceSelect);
  openSelectedDevice(devices);
}

function renderConnection(stateMap) {
  const previousDeviceIndex = state.connectedDeviceIndex;
  const previousDeviceSerial = state.connectedDeviceSerial;
  setDaemonStatus(!!(stateMap.daemonConnected || stateMap.hostConnected));
  state.deviceConnected = !!stateMap.deviceConnected;
  state.connectedDeviceIndex = state.deviceConnected ? Number(stateMap.deviceIndex) : -1;
  state.connectedDeviceSerial = state.deviceConnected ? String(stateMap.deviceSerial || "") : "";
  renderMonitorLogControls();
  syncTargetDeviceControls();
  if (state.deviceConnected) {
    const deviceChanged = previousDeviceSerial && state.connectedDeviceSerial
      ? !sameDeviceSerial(previousDeviceSerial, state.connectedDeviceSerial)
      : previousDeviceIndex !== state.connectedDeviceIndex;
    if (deviceChanged) {
      resetLinkConfigForms();
      clearPendingLinkUiValues();
      clearConfigFileView();
      clearPersistConfigView();
    }
    els.deviceSelect.value = String(stateMap.deviceIndex);
    syncCustomSelect(els.deviceSelect);
    state.selectedDeviceIndex = Number(stateMap.deviceIndex);
    state.openingDeviceIndex = null;
    state.openingDeviceSerial = "";
    state.allowAutoOpenDevice = false;
    state.lastOpenedDeviceSerial = state.connectedDeviceSerial || state.lastOpenedDeviceSerial;
    setStatus("online", `${stateMap.deviceName || t("device.defaultName")} ${t("status.deviceOnline")}`);
    startRefresh();
    requestCurrentSnapshot(true);
    requestPowerRangeSources("local");
    requestDefaultConfigForLinkLimits(activeLinkEndpointScope());
    if (state.currentCode === "L4.PERSIST") {
      requestPersistConfig();
    }
    return;
  }

  state.openingDeviceIndex = null;
  state.openingDeviceSerial = "";
  stopMonitorRecording(true);
  resetLinkConfigForms();
  clearPendingLinkUiValues();
  clearConfigFileView();
  clearPersistConfigView();
  syncTargetDeviceControls();
  stopRefresh();
  state.lastOverview = null;
  state.lastMonitor = null;
  syncFirmwareControls();
  setEmptySummary();
  if (stateMap.daemonConnected || stateMap.hostConnected) {
    setStatus("warning", t("status.waitingDevice"));
  } else {
    setStatus("offline", t("status.daemonDisconnected"));
  }
}

function renderOverview(data) {
  if (!state.deviceConnected) {
    syncTargetDeviceControls();
    return;
  }
  if (state.connectedDeviceSerial && data.deviceSerial
      && !sameDeviceSerial(state.connectedDeviceSerial, String(data.deviceSerial))) {
    return;
  }

  state.lastOverview = data;
  syncTargetDeviceControls();
  if (data.deviceSerial) {
    state.connectedDeviceSerial = String(data.deviceSerial);
  }
  els.modeValue.textContent = modeDisplayText(data);
  els.localMacValue.textContent = data.localMac || "--";
  els.uptimeValue.textContent = formatUptimeText(data.uptime, data.uptimeText || "--");
  els.firmwareValue.textContent = data.firmwareVersion || "--";
  els.firmwareValue.title = [data.softwareVersion, data.hardwareVersion, data.compileTime]
    .filter(Boolean)
    .join(" / ");

  const role = data.role || "";
  els.roleSegment.querySelectorAll(".segment-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.role === role);
  });
  refreshMcsOptionsForEndpoint(activeLinkEndpointScope());

  renderPairTable(visibleSlotsForMode(data));
  requestAvailablePowerRangeSources();
  syncFirmwareControls();
  startRefresh();
}

function numericText(value, suffix = "", digits = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return "--";
  }
  return `${number.toFixed(digits)}${suffix}`;
}

function qualityErrorText(quality) {
  if (!quality || typeof quality !== "object") {
    return "--";
  }
  const err = Number(quality.ldpcErr);
  const total = Number(quality.ldpcNum);
  if (!Number.isFinite(err) || !Number.isFinite(total)) {
    return "--";
  }
  return `${err}/${total}`;
}

function qualitySnrText(quality) {
  if (!quality || typeof quality !== "object") {
    return "--";
  }
  return numericText(quality.snrDb, "", 1);
}

function qualityRssiText(quality) {
  if (!quality || typeof quality !== "object") {
    return "--";
  }
  const gainA = quality.gainA ?? "--";
  const gainB = quality.gainB ?? "--";
  return `${gainA}/${gainB}`;
}

function throughputText(realValue, phyValue) {
  const real = Number(realValue);
  const phy = Number(phyValue);
  if (!Number.isFinite(real) || !Number.isFinite(phy)) {
    return "--";
  }
  return `${(real / 1000).toFixed(0)}/${(phy / 1000).toFixed(0)} Kbps`;
}

function distanceText(value) {
  return numericText(value, " m");
}

function frequencyText(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    return "--";
  }
  return numericText(number / 1000);
}

function bandwidthText(value) {
  const text = String(value ?? "").trim();
  if (!text || text === "未知") {
    return "--";
  }
  return text;
}

const monitorCsvBaseColumns = [
  "时间",
  "采样序号",
  "对频状态",
  "工作频点",
  "频宽",
  "发射功率",
  "调制编码",
  "信号强度",
  "信噪比",
  "错误统计",
  "吞吐率 (实际/理论)",
  "距离",
];

function safeJsonString(value) {
  try {
    return JSON.stringify(value ?? {});
  } catch (error) {
    return "";
  }
}

function monitorCsvTimestamp(date) {
  const pad = (value, length = 2) => String(value).padStart(length, "0");
  return [
    date.getFullYear(),
    "-",
    pad(date.getMonth() + 1),
    "-",
    pad(date.getDate()),
    " ",
    pad(date.getHours()),
    ":",
    pad(date.getMinutes()),
    ":",
    pad(date.getSeconds()),
  ].join("");
}

function monitorPairStatusText(data = {}) {
  const slots = Array.isArray(data.slots) ? data.slots : [];
  const slotIndex = Number(data.slot ?? 0);
  const slot = slots.find((item) => Number(item?.slot) === slotIndex);
  if (slot) {
    return linkStateDisplayText(slot);
  }
  if (data.linkReady || data.linkConnected) {
    return t("linkState.connected");
  }
  return t("monitor.linkNotReady");
}

function normalizeMonitorSweepChannel(item, fallbackIndex) {
  const index = Number(item?.index ?? fallbackIndex);
  const frequencyMhz = channelFrequencyMhz(item?.frequency);
  if (!Number.isInteger(index) || index < 0 || frequencyMhz === null) {
    return null;
  }
  const roundedFrequency = Number(frequencyMhz.toFixed(3));
  const frequencyLabel = channelFrequencyLabel(roundedFrequency);
  return {
    key: `${index}|${roundedFrequency}`,
    index,
    frequencyMhz: roundedFrequency,
    header: `${index}:${frequencyLabel}MHz`,
    power: item?.power ?? "",
  };
}

function monitorSweepChannels(channels = []) {
  if (!Array.isArray(channels)) {
    return [];
  }
  return channels
    .map((item, fallbackIndex) => normalizeMonitorSweepChannel(item, fallbackIndex))
    .filter(Boolean);
}

function monitorSweepPowerMap(channels = []) {
  const powers = new Map();
  monitorSweepChannels(channels).forEach((item) => {
    powers.set(item.key, item.power);
  });
  return powers;
}

function monitorSideLogData(data, side) {
  const rx = data.rx || {};
  const tx = data.tx || {};
  const isLocal = side === "local";
  return {
    frequency: frequencyText(isLocal ? tx.frequency : rx.frequency),
    bandwidth: bandwidthText(isLocal ? tx.bandwidth : rx.bandwidth),
    txPower: numericText(isLocal ? data.currentPower : data.peerTxPower, " dBm"),
    mcs: isLocal ? data.txMcs ?? "--" : data.rxMcs ?? "--",
    rssi: qualityRssiText(isLocal ? data.userQuality : data.peerQuality),
    snr: qualitySnrText(isLocal ? data.userQuality : data.peerQuality),
    error: qualityErrorText(isLocal ? data.peerQuality : data.userQuality),
    throughput: isLocal
      ? throughputText(data.txThroughput, data.txPhyThroughput)
      : throughputText(data.rxThroughput, data.rxPhyThroughput),
    distance: distanceText(data.distance),
    sweepColumns: monitorSweepChannels(isLocal ? data.channels : data.peerChannels),
    sweepPowers: monitorSweepPowerMap(isLocal ? data.channels : data.peerChannels),
  };
}

function recordMonitorSnapshot(data) {
  if (!state.monitorLog.recording) {
    return;
  }

  const timestamp = new Date();
  state.monitorLog.sampleIndex += 1;
  const sampleIndex = state.monitorLog.sampleIndex;
  state.monitorLog.rows.push({
    timestamp: monitorCsvTimestamp(timestamp),
    sampleIndex,
    pairStatus: monitorPairStatusText(data),
    local: monitorSideLogData(data, "local"),
    peer: monitorSideLogData(data, "peer"),
  });
  state.monitorLog.exported = false;
  renderMonitorLogControls();
}

function csvEscape(value) {
  if (value === undefined || value === null) {
    return "";
  }
  const text = typeof value === "object" ? safeJsonString(value) : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function collectMonitorSweepColumns(samples) {
  const columns = new Map();
  samples.forEach((sample) => {
    ["local", "peer"].forEach((side) => {
      (sample?.[side]?.sweepColumns || []).forEach((column) => {
        if (!columns.has(column.key)) {
          columns.set(column.key, column);
        }
      });
    });
  });
  return Array.from(columns.values())
    .sort((left, right) => left.index - right.index || left.frequencyMhz - right.frequencyMhz);
}

function monitorSampleCsvRow(sample, side, sweepColumns, includeGroupColumns) {
  const sideData = sample?.[side] || {};
  let groupColumns = ["", "", ""];
  if (sample?.marker && side === "peer") {
    groupColumns = [sample.marker, "", ""];
  } else if (includeGroupColumns) {
    groupColumns = [sample.timestamp, sample.sampleIndex, sample.pairStatus];
  }
  return [
    ...groupColumns,
    sideData.frequency ?? "",
    sideData.bandwidth ?? "",
    sideData.txPower ?? "",
    sideData.mcs ?? "",
    sideData.rssi ?? "",
    sideData.snr ?? "",
    sideData.error ?? "",
    sideData.throughput ?? "",
    sideData.distance ?? "",
    ...sweepColumns.map((column) => sideData.sweepPowers?.get(column.key) ?? ""),
  ];
}

function monitorRowsToCsv(samples) {
  const sweepColumns = collectMonitorSweepColumns(samples);
  const header = [...monitorCsvBaseColumns, ...sweepColumns.map((column) => column.header)];
  const body = [];
  samples.forEach((sample) => {
    body.push(monitorSampleCsvRow(sample, "local", sweepColumns, true));
    body.push(monitorSampleCsvRow(sample, "peer", sweepColumns, false));
  });
  return [header, ...body]
    .map((row) => row.map(csvEscape).join(","))
    .join("\r\n") + "\r\n";
}

function compactDateTime(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "_",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
}

function monitorLogDefaultFileName() {
  return `l4_link_log_${compactDateTime(state.monitorLog.startedAt || new Date())}.csv`;
}

function monitorRecordStopIntent() {
  return Boolean(state.monitorLog.recording && state.monitorLog.stopIntent);
}

function setMonitorRecordStopIntent(active) {
  const nextActive = Boolean(active && state.monitorLog.recording);
  if (state.monitorLog.stopIntent === nextActive) {
    return;
  }
  state.monitorLog.stopIntent = nextActive;
  renderMonitorLogControls();
}

function handleMonitorRecordIntentEvent(event) {
  const active = event.type === "mouseenter" || event.type === "mousemove" || event.type === "focus";
  setMonitorRecordStopIntent(active);
}

function renderMonitorLogControls() {
  const log = state.monitorLog;
  const hasRows = log.rows.length > 0;
  const toggle = els.monitorRecordToggle;
  if (toggle) {
    const stopIntent = monitorRecordStopIntent();
    const labelKey = log.recording
      ? stopIntent ? "monitor.recordStop" : "monitor.recordingActive"
      : "monitor.recordStart";
    const actionKey = log.recording ? "monitor.recordStop" : "monitor.recordStart";
    const label = toggle.querySelector("[data-monitor-record-label]");
    const icon = toggle.querySelector("use");
    toggle.disabled = false;
    toggle.classList.toggle("recording", log.recording);
    toggle.classList.toggle("stop-intent", stopIntent);
    toggle.setAttribute("aria-label", t(actionKey));
    toggle.title = t(actionKey);
    if (label) {
      setPlainText(label, t(labelKey));
    }
    if (icon) {
      icon.setAttribute("href", log.recording && stopIntent ? "#icon-stop" : "#icon-record");
    }
  }

  if (els.monitorMarkButton) {
    els.monitorMarkButton.disabled = !log.recording;
  }
  if (els.monitorExportButton) {
    els.monitorExportButton.disabled = log.recording || !hasRows;
  }
}

function resetMonitorLogForRecording() {
  state.monitorLog.rows = [];
  state.monitorLog.startedAt = new Date();
  state.monitorLog.sampleIndex = 0;
  state.monitorLog.markerIndex = 0;
  state.monitorLog.stopIntent = false;
  state.monitorLog.exported = false;
}

function stopMonitorRecording(auto = false) {
  if (!state.monitorLog.recording) {
    return;
  }
  state.monitorLog.recording = false;
  state.monitorLog.stopIntent = false;
  appendLog(auto
    ? t("monitor.recordAutoStopped")
    : formatTemplate("monitor.recordStopped", state.monitorLog.rows.length));
  if (state.currentCode !== "L4.MONITOR") {
    stopRefresh();
  }
  renderMonitorLogControls();
}

async function handleMonitorRecordToggle() {
  if (state.monitorLog.recording) {
    stopMonitorRecording(false);
    return;
  }
  if (!state.deviceConnected) {
    appendLog(t("common.deviceRequired"));
    renderMonitorLogControls();
    return;
  }
  if (state.monitorLog.rows.length > 0 && !state.monitorLog.exported) {
    const confirmed = await showConfirmDialog({
      title: t("monitor.recordDiscardTitle"),
      message: t("monitor.recordDiscardMessage"),
      confirmText: t("monitor.recordDiscardConfirm"),
      tone: "warning",
    });
    if (!confirmed) {
      return;
    }
  }

  resetMonitorLogForRecording();
  state.monitorLog.recording = true;
  appendLog(t("monitor.recordStarted"));
  startRefresh();
  if (state.lastMonitor) {
    recordMonitorSnapshot(state.lastMonitor);
  }
  renderMonitorLogControls();
}

function addMonitorMarker() {
  if (!state.monitorLog.recording) {
    return;
  }
  const lastSample = state.monitorLog.rows[state.monitorLog.rows.length - 1];
  if (!lastSample) {
    appendLog(t("monitor.recordNoData"));
    renderMonitorLogControls();
    return;
  }
  state.monitorLog.markerIndex += 1;
  const marker = `Flag_${state.monitorLog.markerIndex}`;
  lastSample.marker = marker;
  state.monitorLog.exported = false;
  appendLog(formatTemplate("monitor.recordMarked", marker));
  renderMonitorLogControls();
}

async function exportMonitorLogCsv() {
  if (state.monitorLog.recording || state.monitorLog.rows.length === 0) {
    appendLog(t("monitor.recordNoData"));
    renderMonitorLogControls();
    return;
  }

  const response = await bridgeCall("exportMonitorLogCsv", {
    text: monitorRowsToCsv(state.monitorLog.rows),
    defaultFileName: monitorLogDefaultFileName(),
  });
  if (response.ok) {
    state.monitorLog.exported = true;
    appendLog(response.message || t("monitor.recordExported"));
  } else if (response.code !== -499) {
    appendLog(response.message || t("common.operationFailed"));
  }
  renderMonitorLogControls();
}

function renderMonitor(data, options = {}) {
  state.lastMonitor = data;
  syncLinkConfigFromSnapshot(data);
  if (options.record !== false) {
    recordMonitorSnapshot(data);
  }

  if (!els.monitorTableBody) {
    return;
  }

  if (!data.linkReady) {
    clearMonitorView(localizedKnownText(data.message, "monitor.linkNotReady"));
    return;
  }

  const rx = data.rx || {};
  const tx = data.tx || {};
  const selfRows = [
    {
      name: t("monitor.local"),
      snr: qualitySnrText(data.userQuality),
      rssi: qualityRssiText(data.userQuality),
      mcs: data.txMcs ?? "--",
      txp: numericText(data.currentPower, " dBm"),
      err: qualityErrorText(data.peerQuality),
      tp: throughputText(data.txThroughput, data.txPhyThroughput),
      freq: frequencyText(tx.frequency),
      bw: bandwidthText(tx.bandwidth),
      disc: distanceText(data.distance),
    },
    {
      name: t("monitor.peer"),
      snr: qualitySnrText(data.peerQuality),
      rssi: qualityRssiText(data.peerQuality),
      mcs: data.rxMcs ?? "--",
      txp: numericText(data.peerTxPower, " dBm"),
      err: qualityErrorText(data.userQuality),
      tp: throughputText(data.rxThroughput, data.rxPhyThroughput),
      freq: frequencyText(rx.frequency),
      bw: bandwidthText(rx.bandwidth),
      disc: distanceText(data.distance),
    },
  ];

  els.monitorTableBody.innerHTML = selfRows.map((row) => `
    <tr>
      <td>${row.name}</td>
      <td>${row.freq}</td>
      <td>${row.bw}</td>
      <td>${row.txp}</td>
      <td>${row.mcs}</td>
      <td>${row.rssi}</td>
      <td>${row.snr}</td>
      <td>${row.err}</td>
      <td>${row.tp}</td>
      <td>${row.disc}</td>
    </tr>
  `).join("");

  renderSweepCharts(
    Array.isArray(data.channels) ? data.channels : [],
    Array.isArray(data.peerChannels) ? data.peerChannels : [],
    {
      local: {
        frequency: tx.frequency,
        bandwidthMhz: tx.bandwidthMhz,
      },
      peer: {
        frequency: rx.frequency,
        bandwidthMhz: rx.bandwidthMhz,
      },
    }
  );
  scheduleSlimScrollbarUpdate();
}

function clearMonitorView(message = t("monitor.linkNotReady")) {
  if (els.monitorTableBody) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 10;
    cell.className = "empty-cell";
    cell.textContent = message;
    row.append(cell);
    els.monitorTableBody.replaceChildren(row);
  }
  renderSweepCharts([], [], {});
  scheduleSlimScrollbarUpdate();
}

function sweepGroups(channels = []) {
  const validChannels = channels
    .map((item) => ({
      frequency: Number(item.frequency),
      power: Number(item.power),
    }))
    .filter((item) => Number.isFinite(item.frequency) && Number.isFinite(item.power) && item.frequency > 0)
    .sort((left, right) => left.frequency - right.frequency);

  return [
    validChannels.filter((item) => item.frequency < 4000000),
    validChannels.filter((item) => item.frequency >= 4000000),
  ];
}

const sweepPlot = {
  top: 10,
  left: 72,
  width: 1020,
  height: 214,
  bottom: 224,
  tickY: 244,
  maxBandwidthMhz: 40,
  minIndicatorWidth: 6,
  indicatorBorderWidth: 1.5,
};

const svgNamespace = "http://www.w3.org/2000/svg";

function sweepFrequencyMHz(item) {
  return item.frequency / 1000;
}

function sweepFrequencyLabel(frequency) {
  const rounded = Math.round(frequency);
  if (Math.abs(frequency - rounded) < 0.05) {
    return String(rounded);
  }
  return frequency.toFixed(1).replace(/\.0$/, "");
}

function uniqueSweepFrequencies(group) {
  return Array.from(new Set(group.map((item) => item.frequency)))
    .sort((left, right) => left - right)
    .map((frequency) => frequency / 1000);
}

function sweepIndicatorMeta(indicator) {
  const frequency = Number(indicator?.frequency);
  const bandwidthMhz = Number(indicator?.bandwidthMhz);
  if (!Number.isFinite(frequency) || !Number.isFinite(bandwidthMhz) || frequency <= 0 || bandwidthMhz <= 0) {
    return null;
  }

  const center = frequency / 1000;
  const halfWidth = bandwidthMhz / 2;
  return {
    center,
    left: center - halfWidth,
    right: center + halfWidth,
    bandwidthMhz,
  };
}

function sweepIndicatorsByBand(indicators = {}) {
  const local = sweepIndicatorMeta(indicators.local);
  const peer = sweepIndicatorMeta(indicators.peer);
  return [
    {
      local: local && local.center < 4000 ? local : null,
      peer: peer && peer.center < 4000 ? peer : null,
    },
    {
      local: local && local.center >= 4000 ? local : null,
      peer: peer && peer.center >= 4000 ? peer : null,
    },
  ];
}

function sweepRangeFrom(frequencies, indicators) {
  const padding = sweepPlot.maxBandwidthMhz / 2;
  if (frequencies.length) {
    return {
      minFreq: Math.min(...frequencies) - padding,
      maxFreq: Math.max(...frequencies) + padding,
    };
  }

  const indicatorCenters = ["local", "peer"]
    .map((key) => indicators?.[key]?.center)
    .filter((frequency) => Number.isFinite(frequency));
  if (!indicatorCenters.length) {
    return { minFreq: 0, maxFreq: 0 };
  }

  return {
    minFreq: Math.min(...indicatorCenters) - padding,
    maxFreq: Math.max(...indicatorCenters) + padding,
  };
}

function sweepXPosition(frequency, minFreq, maxFreq) {
  return sweepPlot.left + ((frequency - minFreq) / Math.max(maxFreq - minFreq, 1)) * sweepPlot.width;
}

function sweepCoordinate(value) {
  return value.toFixed(2);
}

function sweepIndicatorGeometry(indicator, minFreq, maxFreq) {
  const left = sweepXPosition(indicator.left, minFreq, maxFreq);
  const right = sweepXPosition(indicator.right, minFreq, maxFreq);
  const center = (left + right) / 2;
  const width = Math.max(Math.abs(right - left), sweepPlot.minIndicatorWidth);
  return {
    x: center - width / 2,
    width,
  };
}

function setSweepRectGeometry(rect, x, y, width, height) {
  rect.setAttribute("x", sweepCoordinate(x));
  rect.setAttribute("y", sweepCoordinate(y));
  rect.setAttribute("width", sweepCoordinate(width));
  rect.setAttribute("height", sweepCoordinate(height));
}

function appendSweepIndicatorBorder(layer, key, geometry) {
  const className = key === "local" ? "chart-indicator-border-local" : "chart-indicator-border-peer";
  const borderWidth = sweepPlot.indicatorBorderWidth;
  const top = sweepPlot.top;
  const bottom = sweepPlot.top + sweepPlot.height;
  const left = geometry.x;
  const right = geometry.x + geometry.width;
  const segments = [
    [left, top, geometry.width, borderWidth],
    [left, bottom - borderWidth, geometry.width, borderWidth],
    [left, top, borderWidth, sweepPlot.height],
    [right - borderWidth, top, borderWidth, sweepPlot.height],
  ];

  segments.forEach(([x, y, width, height]) => {
    const segment = document.createElementNS(svgNamespace, "rect");
    segment.setAttribute("class", className);
    setSweepRectGeometry(segment, x, y, width, height);
    layer.append(segment);
  });
}

function renderSweepIndicators(svg, indicators, minFreq, maxFreq) {
  if (!svg) {
    return;
  }

  const firstGrid = svg.querySelector(".chart-grid");
  let fillLayer = svg.querySelector(".chart-indicator-fills");
  let borderLayer = svg.querySelector(".chart-indicator-borders");
  if (!fillLayer) {
    fillLayer = document.createElementNS(svgNamespace, "g");
    fillLayer.setAttribute("class", "chart-indicator-fills");
    svg.insertBefore(fillLayer, firstGrid);
  }
  if (!borderLayer) {
    borderLayer = document.createElementNS(svgNamespace, "g");
    borderLayer.setAttribute("class", "chart-indicator-borders");
  }
  svg.append(borderLayer);
  fillLayer.replaceChildren();
  borderLayer.replaceChildren();

  ["local", "peer"].forEach((key) => {
    const indicator = indicators?.[key];
    if (!indicator) {
      return;
    }

    const geometry = sweepIndicatorGeometry(indicator, minFreq, maxFreq);
    const fillRect = document.createElementNS(svgNamespace, "rect");
    fillRect.setAttribute("class", key === "local" ? "chart-indicator-fill-local" : "chart-indicator-fill-peer");
    setSweepRectGeometry(fillRect, geometry.x, sweepPlot.top, geometry.width, sweepPlot.height);
    fillLayer.append(fillRect);

    appendSweepIndicatorBorder(borderLayer, key, geometry);
  });
}

function renderSweepXAxis(svg, frequencies, minFreq, maxFreq) {
  if (!svg) {
    return;
  }

  svg.querySelectorAll(".chart-x-grid, .chart-x-tick").forEach((element) => element.remove());
  if (!frequencies.length) {
    return;
  }

  const firstAxis = svg.querySelector(".chart-axis");
  const frequencyLabel = svg.querySelector(".chart-frequency-label");
  const firstDataLine = svg.querySelector(".chart-line-local");

  frequencies.forEach((frequency) => {
    const x = sweepXPosition(frequency, minFreq, maxFreq);
    const grid = document.createElementNS(svgNamespace, "line");
    grid.setAttribute("class", "chart-grid chart-x-grid");
    grid.setAttribute("x1", x.toFixed(1));
    grid.setAttribute("y1", String(sweepPlot.top));
    grid.setAttribute("x2", x.toFixed(1));
    grid.setAttribute("y2", String(sweepPlot.bottom));
    svg.insertBefore(grid, firstAxis);

    const tick = document.createElementNS(svgNamespace, "text");
    tick.setAttribute("class", "chart-tick chart-x-tick");
    tick.setAttribute("x", x.toFixed(1));
    tick.setAttribute("y", String(sweepPlot.tickY));
    tick.setAttribute("transform", `rotate(-55 ${x.toFixed(1)} ${sweepPlot.tickY})`);
    tick.textContent = sweepFrequencyLabel(frequency);
    svg.insertBefore(tick, frequencyLabel || firstDataLine);
  });
}

function setSweepLinePoints(line, group, minFreq, maxFreq) {
  if (!line) {
    return;
  }
  if (group.length < 2) {
    line.setAttribute("points", "");
    return;
  }

  const points = group.map((item) => {
    const freq = sweepFrequencyMHz(item);
    const power = item.power;
    const x = sweepXPosition(freq, minFreq, maxFreq);
    const y = sweepPlot.bottom - ((Math.max(Math.min(power, -40), -115) + 115) / 75) * sweepPlot.height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  line.setAttribute("points", points);
}

function renderSweepCharts(localChannels = [], peerChannels = [], indicators = {}) {
  const charts = Array.from(document.querySelectorAll(".band-chart"));
  const localGroups = sweepGroups(localChannels);
  const peerGroups = sweepGroups(peerChannels);
  const indicatorGroups = sweepIndicatorsByBand(indicators);

  localGroups.forEach((localGroup, index) => {
    const chart = charts[index];
    const localLine = chart?.querySelector(".chart-line-local");
    const peerLine = chart?.querySelector(".chart-line-remote");
    const peerGroup = peerGroups[index] || [];
    const combinedGroup = localGroup.concat(peerGroup);
    const svg = chart?.querySelector(".sweep-chart");
    const bandIndicators = indicatorGroups[index] || {};
    const frequencies = uniqueSweepFrequencies(combinedGroup);
    if (!frequencies.length && !bandIndicators.local && !bandIndicators.peer) {
      renderSweepXAxis(svg, [], 0, 0);
      renderSweepIndicators(svg, {}, 0, 0);
      setSweepLinePoints(localLine, [], 0, 0);
      setSweepLinePoints(peerLine, [], 0, 0);
      return;
    }

    const { minFreq, maxFreq } = sweepRangeFrom(frequencies, bandIndicators);
    renderSweepXAxis(svg, frequencies, minFreq, maxFreq);
    renderSweepIndicators(svg, bandIndicators, minFreq, maxFreq);
    setSweepLinePoints(localLine, localGroup, minFreq, maxFreq);
    setSweepLinePoints(peerLine, peerGroup, minFreq, maxFreq);
  });
}

function isOneToOneMode(data) {
  const modeValue = Number(data.modeValue);
  if (Number.isInteger(modeValue) && modeValue === 0) {
    return true;
  }

  const modeText = String(data.mode || "").replace(/\s+/g, "");
  return modeText === "1对1" || modeText === "单用户";
}

function visibleSlotsForMode(data) {
  const slots = Array.isArray(data.slots) ? data.slots : [];
  if (!isOneToOneMode(data)) {
    return slots;
  }

  const slot0 = slots.find((slot) => Number(slot.slot) === 0);
  return slot0 ? [slot0] : slots.slice(0, 1);
}

function stateClass(slot) {
  if (slot.paired) {
    return "pairing";
  }
  if (slot.stateValue === 2) {
    return "connected";
  }
  return "idle";
}

function renderPairTable(slots) {
  if (!slots.length) {
    els.pairTableBody.innerHTML = `<tr><td colspan="5" class="empty-cell">${t("empty.noSlotData")}</td></tr>`;
    return;
  }

  els.pairTableBody.innerHTML = slots.map((slot) => {
    const mac = slot.peerMac && !isUnsetText(slot.peerMac) ? slot.peerMac : "";
    const peerFirmwareVersion = slot.peerFirmwareVersion || "--";
    const firmwareText = escapeHtml(peerFirmwareVersion);
    const pairing = !!slot.paired;
    return `
      <tr data-slot="${slot.slot}">
        <td>slot${slot.slot}</td>
        <td><span class="link-state ${stateClass(slot)}">${linkStateDisplayText(slot)}</span></td>
        <td class="peer-firmware-version" title="${firmwareText}">${firmwareText}</td>
        <td>
          <input class="pair-mac-input" type="text" value="${mac}" placeholder="11:22:33:44" ${state.deviceConnected ? "" : "disabled"}>
        </td>
        <td>
          <div class="pair-actions">
            <button class="pair-button" type="button" data-action="query" ${state.deviceConnected ? "" : "disabled"}>${t("pair.query")}</button>
            <button class="pair-button" type="button" data-action="set" ${state.deviceConnected ? "" : "disabled"}>${t("pair.set")}</button>
            <button class="pair-button ${pairing ? "danger" : ""}" type="button" data-action="${pairing ? "stop" : "pair"}" ${state.deviceConnected ? "" : "disabled"}>${pairing ? t("pair.stop") : t("pair.start")}</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function renderPairUpdate(data) {
  if (Number.isInteger(data.slot)) {
    const stateValue = Number(data.stateValue);
    let rerenderPairTable = false;
    if (state.lastOverview && Array.isArray(state.lastOverview.slots)) {
      const slot = state.lastOverview.slots.find((item) => Number(item?.slot) === data.slot);
      if (slot) {
        if (Number.isInteger(stateValue)) {
          slot.stateValue = stateValue;
          if (typeof data.state === "string") {
            slot.state = data.state;
          }
          if (stateValue !== 2) {
            slot.peerFirmwareVersion = "";
          }
          rerenderPairTable = true;
        }
        if (Object.prototype.hasOwnProperty.call(data, "paired")) {
          slot.paired = !!data.paired;
          rerenderPairTable = true;
        }
        if (typeof data.mac === "string") {
          slot.peerMac = isUnsetText(data.mac) ? "" : data.mac;
          rerenderPairTable = true;
        }
      }
    }
    if (rerenderPairTable) {
      renderPairTable(visibleSlotsForMode(state.lastOverview));
    }

    const row = els.pairTableBody.querySelector(`tr[data-slot="${data.slot}"]`);
    if (row && data.mac) {
      const input = row.querySelector(".pair-mac-input");
      if (input) {
        input.value = isUnsetText(data.mac) ? "" : data.mac;
      }
    }
  }
  if (data.status) {
    appendLog(data.status);
  }
  syncTargetDeviceControls();
  syncFirmwareControls();
  if (state.deviceConnected && data.event !== "linkState") {
    bridgeCall("getOverview");
  }
}

function renderOperation(response) {
  const ok = !!response.ok;
  const data = responseData(response);
  const message = response.message || (ok ? t("common.operationDone") : t("common.operationFailed"));
  appendLog(message);
  if (data.operation === "pair.setMac" && ok) {
    bridgeCall("getOverview");
  }
  if (data.operation === "link.setConfig") {
    if (!ok) {
      clearPendingLinkUiValues();
    }
    setLocalizedText(els.linkConfigStatus, ok ? "link.applied" : "link.failed");
    els.linkConfigStatus.classList.toggle("dirty", !ok);
    requestCurrentSnapshot();
  }
  if (data.operation === "config.read") {
    const configScope = normalizePersistTargetScope(data.targetScope || "local");
    ensureScopedPowerRange(configScope).jsonPending = false;
    const endpointScope = activeLinkEndpointScope();
    if (ok && updateDefaultConfigCache(data, { updateMcs: configScope === "local" })) {
      refreshLinkLimitControls(endpointScope);
    } else if (!ok) {
      refreshLinkLimitControls(endpointScope);
    }
  }
  if (data.operation === "persist.get") {
    const scope = normalizePersistTargetScope(data.targetScope || activePersistTargetScope());
    const scoped = ensureScopedPowerRange(scope);
    scoped.minidbPending = false;
    if (!ok) {
      scoped.minidbRead = true;
      scoped.minidbRange = null;
      refreshLinkLimitControls(activeLinkEndpointScope());
    }
  }
  if (data.operation === "persist.set") {
    const scope = normalizePersistTargetScope(data.targetScope || activePersistTargetScope());
    const form = currentPersistForm(scope);
    if (!ok) {
      setPersistFormStatus(scope, "failed");
    } else if (Array.isArray(data.steps) && data.steps.length === 0) {
      setPersistFormStatus(scope, scope === activePersistTargetScope() ? currentPersistStatusMode() : form.statusMode);
    } else {
      form.rebootPending = true;
      if (scope === activePersistTargetScope()) {
        state.persistRebootPending = true;
      }
      setPersistFormStatus(scope, "pendingReboot");
    }
  }
  if (data.operation === "persist.reset") {
    const scope = normalizePersistTargetScope(data.targetScope || activePersistTargetScope());
    const form = currentPersistForm(scope);
    if (ok) {
      form.rebootPending = true;
      if (scope === activePersistTargetScope()) {
        state.persistRebootPending = true;
      }
      setPersistFormStatus(scope, "pendingReboot");
    } else {
      setPersistFormStatus(scope, "failed");
    }
  }
  if (data.operation === "persist.reboot") {
    const scope = normalizePersistTargetScope(data.targetScope || activePersistTargetScope());
    const form = currentPersistForm(scope);
    if (ok) {
      form.rebootPending = false;
      if (scope === activePersistTargetScope()) {
        state.persistRebootPending = false;
      }
    }
    setPersistFormStatus(scope, ok ? "clean" : "failed");
  }
  if (data.operation === "firmware.upgrade") {
    if (ok) {
      els.startUpgrade.disabled = true;
    } else {
      syncFirmwareControls();
    }
  }
  if (data.operation === "firmware.checkUpdate") {
    state.firmwareCheckPending = false;
    state.firmwareBusyKey = "";
    if (ok && data.updateAvailable) {
      syncFirmwareControls();
      confirmOnlineFirmwareUpgrade(data);
    } else if (ok) {
      syncFirmwareControls();
      showFirmwareUpToDateDialog(data, message);
    } else {
      syncFirmwareControls();
      if (message === "当前版本异常" || message.startsWith("当前版本异常")) {
        showFirmwareInvalidVersionDialog(message);
      } else {
        showFirmwareCheckFailedDialog(data, message);
      }
    }
  }
  if (data.operation === "firmware.downloadUpdate") {
    state.firmwareCheckPending = false;
    state.firmwareBusyKey = "";
    if (ok) {
      state.firmwarePath = data.path || "";
      if (data.fileName) {
        setPlainText(els.firmwareFileName, data.fileName);
      } else {
        setLocalizedText(els.firmwareFileName, "firmware.selectedFile");
      }
      setFirmwareProgress(0);
      syncFirmwareControls();
      startFirmwareUpgradeFromCurrentSelection();
    } else {
      syncFirmwareControls();
    }
  }
  if (data.operation === "firmware.postUpgrade") {
    syncFirmwareControls();
  }
}

function setSegmentValue(container, value) {
  if (!container) {
    return;
  }
  const normalizedValue = String(value ?? "").trim().toLowerCase();
  const target = Array.from(container.querySelectorAll(".segment-button")).find((button) => {
    const values = [
      button.dataset.value,
      button.dataset.mode,
      button.dataset.frameChange,
      button.dataset.power,
      button.textContent.trim(),
      button.dataset.i18n ? translations.zh[button.dataset.i18n] : "",
      button.dataset.i18n ? translations.en[button.dataset.i18n] : "",
    ];
    return values.some((item) => String(item ?? "").trim().toLowerCase() === normalizedValue);
  });
  if (!target) {
    return;
  }
  container.querySelectorAll(".segment-button").forEach((button) => button.classList.remove("active"));
  target.classList.add("active");
  if (target.dataset.power) {
    syncPowerInputs(target);
  }
  syncPersistUnsetButton(container);
}

function collectLinkConfig(actions = []) {
  const endpointScope = activeLinkEndpointScope();
  const payload = {
    slot: 0,
    endpointScope,
    targetScope: targetScopeForLinkActions(endpointScope, actions),
    channelDirection: "rx",
    bandMode: activeSegmentValue('[data-config-key="bandMode"]', "auto"),
    band: document.querySelector("#bandSelect")?.value || "2g",
    channelMode: activeSegmentValue('[data-config-key="channelMode"]', "auto"),
    channel: Number(document.querySelector("#channelSelect")?.value || 0),
    bandwidthMode: activeSegmentValue('[data-config-key="bandwidthMode"]', "auto"),
    bandwidth: Number(document.querySelector("#bandwidthSelect")?.value || 2),
    mcsMode: activeSegmentValue('[data-config-key="mcsMode"]', "auto"),
    mcs: Number(document.querySelector("#mcsSelect")?.value || 6),
    powerAuto: activeSegmentValue('[data-config-key="powerAuto"]', "auto") === "auto",
    power: Number(document.querySelector("#powerSelect")?.value || 20),
    frameChange: activeSegmentValue('[data-config-key="frameChange"]', "default"),
    ...powerRangePayload(endpointScope),
  };
  if (Array.isArray(actions) && actions.length > 0) {
    payload.actions = actions;
  }
  return payload;
}

async function sendLinkConfig(actions) {
  if (!state.deviceConnected) {
    appendLog(t("common.deviceRequired"));
    return;
  }
  const payload = collectLinkConfig(actions);
  rememberPendingLinkUi(payload);
  setLocalizedText(els.linkConfigStatus, "link.applying");
  els.linkConfigStatus.classList.add("dirty");
  const response = await bridgeCall("setLinkConfig", payload);
  if (response && response.ok === false) {
    clearPendingLinkUiValues();
  }
}

function persistPowerInputComplete() {
  const powerMode = activeSegmentValue('[data-persist-key="powerMode"]', "unset");
  if (powerMode === "fixed") {
    return (document.querySelector("#fixedPowerInput")?.value.trim() || "") !== "";
  }
  if (powerMode === "range") {
    return (document.querySelector("#minPowerInput")?.value.trim() || "") !== ""
      && (document.querySelector("#maxPowerInput")?.value.trim() || "") !== "";
  }
  return true;
}

function freqListTextFromDom() {
  return els.freqListInput?.value.trim() || "";
}

function formatFreqListText(values = []) {
  return Array.isArray(values) ? values.map((value) => String(value).trim()).filter(Boolean).join(",") : "";
}

function parseFreqListText(text) {
  const raw = String(text || "").trim();
  if (!raw) {
    return { ok: false, reason: "empty", values: [] };
  }

  const tokens = raw.split(/[，,]/).map((item) => item.trim());
  if (tokens.length > persistFreqListMaxCount) {
    return { ok: false, reason: "count", values: [] };
  }

  const values = [];
  for (const token of tokens) {
    if (!/^[1-9]\d*$/.test(token) || Number(token) > persistFreqMhzMax) {
      return { ok: false, reason: "invalid", values: [] };
    }
    values.push(Number(token));
  }
  return { ok: true, reason: "", values };
}

function validateFreqListValues(markInvalid = false) {
  const validation = parseFreqListText(freqListTextFromDom());
  if (markInvalid) {
    els.freqListInput?.classList.toggle("invalid", !validation.ok);
  }
  return validation;
}

function updateFreqListDirtyState() {
  els.freqListInput?.classList.remove("invalid");
  updatePersistDirtyState();
}

function baudrateTextFromDom() {
  return els.uartBaudrateInput?.value.trim() || "";
}

function parseBaudrateText(text) {
  const raw = String(text || "").trim();
  if (!raw) {
    return { ok: true, empty: true, value: null };
  }
  if (!/^[1-9]\d*$/.test(raw)) {
    return { ok: false, empty: false, value: null };
  }

  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value > persistBaudrateMax) {
    return { ok: false, empty: false, value: null };
  }
  return { ok: true, empty: false, value };
}

function validateBaudrateValue(markInvalid = false) {
  const validation = parseBaudrateText(baudrateTextFromDom());
  if (markInvalid) {
    els.uartBaudrateInput?.classList.toggle("invalid", !validation.ok);
  }
  return validation;
}

function updateBaudrateDirtyState() {
  els.uartBaudrateInput?.classList.remove("invalid");
  updatePersistDirtyState();
}

function renderFreqListItems(values = []) {
  if (!els.freqListInput) {
    return;
  }
  els.freqListInput.value = formatFreqListText(values);
  els.freqListInput.classList.remove("invalid");
}

function persistSavedSegmentValue(key) {
  try {
    const saved = JSON.parse(currentPersistForm().savedState || state.persistSavedState || "{}");
    const match = Array.isArray(saved.segments)
      ? saved.segments.find(([savedKey]) => savedKey === key)
      : null;
    return match ? String(match[1] ?? "") : "";
  } catch (error) {
    return "";
  }
}

function persistSavedInputValue(id) {
  try {
    const saved = JSON.parse(currentPersistForm().savedState || state.persistSavedState || "{}");
    const match = Array.isArray(saved.inputs)
      ? saved.inputs.find(([savedId]) => savedId === id)
      : null;
    return match ? String(match[1] ?? "") : "";
  } catch (error) {
    return "";
  }
}

function collectPersistConfig(fields = []) {
  const payload = { slot: 0, targetScope: activePersistTargetScope() };
  const selectedFields = Array.isArray(fields) ? fields : [fields];
  const includeAll = selectedFields.length === 0 || selectedFields.includes("all");

  if (includeAll || selectedFields.includes("role")) {
    payload.role = activeSegmentValue('[data-persist-key="role"]', "unset");
  }
  if (includeAll || selectedFields.includes("peerMac")) {
    payload.peerMac = document.querySelector("#peerMacInput")?.value.trim() || "";
  }
  if (includeAll || selectedFields.includes("band")) {
    payload.band = activeSegmentValue('[data-persist-key="band"]', "unset");
  }
  if (includeAll || selectedFields.includes("power")) {
    const powerMode = activeSegmentValue('[data-persist-key="powerMode"]', "unset");
    payload.powerMode = powerMode;
    Object.assign(payload, persistPowerRangePayload());
    if (powerMode === "fixed") {
      payload.fixedPower = Number(document.querySelector("#fixedPowerInput")?.value || 0);
    } else if (powerMode === "range") {
      payload.minPower = Number(document.querySelector("#minPowerInput")?.value || 0);
      payload.maxPower = Number(document.querySelector("#maxPowerInput")?.value || 0);
    }
  }
  if (includeAll || selectedFields.includes("freqList")) {
    payload.freqListMhz = validateFreqListValues(false).values;
  }
  if (includeAll || selectedFields.includes("uartBaudrate")) {
    const validation = validateBaudrateValue(false);
    if (!validation.empty) {
      payload.uartBaudrate = validation.value;
    }
  }

  return payload;
}

function persistFieldChanged(field) {
  if (field === "role") {
    return activeSegmentValue('[data-persist-key="role"]', "unset") !== persistSavedSegmentValue("role");
  }
  if (field === "band") {
    return activeSegmentValue('[data-persist-key="band"]', "unset") !== persistSavedSegmentValue("band");
  }
  if (field === "peerMac") {
    return (document.querySelector("#peerMacInput")?.value.trim() || "") !== persistSavedInputValue("peerMacInput");
  }
  if (field === "power") {
    const powerMode = activeSegmentValue('[data-persist-key="powerMode"]', "unset");
    if (powerMode !== persistSavedSegmentValue("powerMode")) {
      return true;
    }
    if (powerMode === "fixed") {
      return (document.querySelector("#fixedPowerInput")?.value.trim() || "") !== persistSavedInputValue("fixedPowerInput");
    }
    if (powerMode === "range") {
      return (document.querySelector("#minPowerInput")?.value.trim() || "") !== persistSavedInputValue("minPowerInput")
        || (document.querySelector("#maxPowerInput")?.value.trim() || "") !== persistSavedInputValue("maxPowerInput");
    }
  }
  if (field === "freqList") {
    return freqListTextFromDom() !== persistSavedInputValue("freqListInput");
  }
  if (field === "uartBaudrate") {
    return baudrateTextFromDom() !== persistSavedInputValue("uartBaudrateInput");
  }
  return capturePersistState() !== (currentPersistForm().savedState || state.persistSavedState);
}

function persistPayloadHasWritableField(payload) {
  return Object.keys(payload).some((key) => key !== "slot" && key !== "targetScope");
}

function persistSavedStateObject() {
  try {
    const saved = JSON.parse(currentPersistForm().savedState || state.persistSavedState || "{}");
    return {
      segments: Array.isArray(saved.segments) ? saved.segments : [],
      inputs: Array.isArray(saved.inputs) ? saved.inputs : [],
    };
  } catch (error) {
    return { segments: [], inputs: [] };
  }
}

function setSavedStateValue(items, key, value) {
  const existing = items.find((item) => item[0] === key);
  if (existing) {
    existing[1] = value;
  } else {
    items.push([key, value]);
  }
}

function updatePersistSavedStateForData(data) {
  const saved = persistSavedStateObject();
  if (Object.prototype.hasOwnProperty.call(data, "role")) {
    setSavedStateValue(saved.segments, "role", activeSegmentValue('[data-persist-key="role"]', "unset"));
  }
  if (Object.prototype.hasOwnProperty.call(data, "band")) {
    setSavedStateValue(saved.segments, "band", activeSegmentValue('[data-persist-key="band"]', "unset"));
  }
  if (Object.prototype.hasOwnProperty.call(data, "peerMac")
      || Object.prototype.hasOwnProperty.call(data, "apMac")
      || Object.prototype.hasOwnProperty.call(data, "devMac")) {
    setSavedStateValue(saved.inputs, "peerMacInput", document.querySelector("#peerMacInput")?.value.trim() || "");
  }
  if (Object.prototype.hasOwnProperty.call(data, "power")) {
    setSavedStateValue(saved.segments, "powerMode", activeSegmentValue('[data-persist-key="powerMode"]', "unset"));
    setSavedStateValue(saved.inputs, "fixedPowerInput", document.querySelector("#fixedPowerInput")?.disabled ? "" : document.querySelector("#fixedPowerInput")?.value.trim() || "");
    setSavedStateValue(saved.inputs, "minPowerInput", document.querySelector("#minPowerInput")?.disabled ? "" : document.querySelector("#minPowerInput")?.value.trim() || "");
    setSavedStateValue(saved.inputs, "maxPowerInput", document.querySelector("#maxPowerInput")?.disabled ? "" : document.querySelector("#maxPowerInput")?.value.trim() || "");
  }
  if (Object.prototype.hasOwnProperty.call(data, "freqList")) {
    setSavedStateValue(saved.inputs, "freqListInput", freqListTextFromDom());
  }
  if (Object.prototype.hasOwnProperty.call(data, "uartBaudrate")) {
    setSavedStateValue(saved.inputs, "uartBaudrateInput", baudrateTextFromDom());
  }
  const serialized = JSON.stringify(saved);
  const form = currentPersistForm(data.targetScope);
  form.savedState = serialized;
  form.draftState = capturePersistState();
  form.synced = true;
  state.persistSavedState = serialized;
}

async function applyPersistConfig(fields = []) {
  if (!state.deviceConnected) {
    appendLog(t("common.deviceRequired"));
    updatePersistDirtyState();
    return;
  }
  const selectedFields = Array.isArray(fields) ? fields : [fields];
  if (selectedFields.includes("power") && !persistPowerInputComplete()) {
    updatePersistDirtyState();
    return;
  }
  if (selectedFields.includes("power") && !validatePersistPowerInputs(true)) {
    updatePersistDirtyState();
    return;
  }
  if (selectedFields.includes("freqList")) {
    const validation = validateFreqListValues(true);
    if (!validation.ok) {
      setPersistStatus("failed");
      return;
    }
  }
  if (selectedFields.includes("uartBaudrate")) {
    const validation = validateBaudrateValue(true);
    if (!validation.ok) {
      setPersistStatus("failed");
      return;
    }
  }
  if (selectedFields.length > 0 && !selectedFields.some((field) => persistFieldChanged(field))) {
    updatePersistDirtyState();
    return;
  }

  const payload = collectPersistConfig(selectedFields);
  if (!persistPayloadHasWritableField(payload)) {
    updatePersistDirtyState();
    return;
  }
  if (!currentPersistForm().rebootPending && !state.persistRebootPending) {
    setPersistStatus("applying");
  }
  const response = await bridgeCall("setPersistConfig", payload);
  if (response && response.ok === false) {
    setPersistStatus("failed");
  }
}

function renderPersistConfig(data) {
  const targetScope = normalizePersistTargetScope(data.targetScope || activePersistTargetScope());
  const powerRangeUpdated = updateMinidbPowerRangeFromPersistData(data);
  if (powerRangeUpdated) {
    refreshLinkLimitControls(activeLinkEndpointScope());
  }
  if (targetScope !== activePersistTargetScope()) {
    return;
  }
  if (Object.prototype.hasOwnProperty.call(data, "role")) {
    const role = data.role || {};
    setSegmentValue(document.querySelector('[data-persist-key="role"]'), role.set ? role.text : "unset");
  }
  if (Object.prototype.hasOwnProperty.call(data, "band")) {
    const band = data.band || {};
    setSegmentValue(document.querySelector('[data-persist-key="band"]'), band.set ? band.text : "unset");
  }
  const peerMac = data.peerMac || data.devMac || data.apMac;
  if (peerMac) {
    document.querySelector("#peerMacInput").value = peerMac.set ? peerMac.text : "";
  }
  if (Object.prototype.hasOwnProperty.call(data, "power")) {
    const power = data.power || {};
    if (power.set) {
      setSegmentValue(document.querySelector('[data-persist-key="powerMode"]'), power.mode);
      document.querySelector("#fixedPowerInput").value = power.mode === "fixed" ? power.fixed ?? "" : "";
      document.querySelector("#minPowerInput").value = power.mode === "range" ? power.min ?? "" : "";
      document.querySelector("#maxPowerInput").value = power.mode === "range" ? power.max ?? "" : "";
    } else {
      setSegmentValue(document.querySelector('[data-persist-key="powerMode"]'), "unset");
      document.querySelector("#fixedPowerInput").value = "";
      document.querySelector("#minPowerInput").value = "";
      document.querySelector("#maxPowerInput").value = "";
    }
  }
  if (Object.prototype.hasOwnProperty.call(data, "freqList")) {
    const freqList = data.freqList || {};
    const values = Array.isArray(freqList.freqMhz) ? freqList.freqMhz : [];
    renderFreqListItems(freqList.set ? values : []);
  }
  if (Object.prototype.hasOwnProperty.call(data, "uartBaudrate")) {
    const uartBaudrate = data.uartBaudrate || {};
    if (els.uartBaudrateInput) {
      els.uartBaudrateInput.value = uartBaudrate.set ? String(uartBaudrate.value ?? uartBaudrate.text ?? "") : "";
      els.uartBaudrateInput.classList.remove("invalid");
    }
  }

  updatePersistSavedStateForData(data);
  syncPersistUnsetButtons();
  updatePersistDirtyState();
}

function renderConfigFile(data) {
  const targetScope = normalizePersistTargetScope(data.targetScope || activeProfileTargetScope());
  const form = currentProfileForm(targetScope);
  if (typeof data.text === "string") {
    const cacheUpdated = updateDefaultConfigCache(data, { updateMcs: targetScope === "local" });
    form.text = data.text;
    form.read = true;
    if (targetScope === activeProfileTargetScope()) {
      els.jsonEditor.value = data.text;
    }
    if (cacheUpdated) {
      refreshLinkLimitControls(activeLinkEndpointScope());
    }
  }
  if (els.configFileMeta) {
    const length = data.totalLength ?? data.bytes;
    const crc = data.crc16 !== undefined ? ` · CRC 0x${Number(data.crc16).toString(16).padStart(4, "0")}` : "";
    const metaText = length !== undefined && length !== null ? `${length} bytes${crc}` : "config.json";
    form.metaText = metaText;
    if (targetScope === activeProfileTargetScope()) {
      setPlainText(els.configFileMeta, metaText);
    }
  }
  if (targetScope === activeProfileTargetScope()) {
    resetConfigSearch();
  }
}

function handleConfigFileUpdated(data) {
  ensureScopedPowerRange(data?.targetScope || "local").jsonPending = false;
  renderConfigFile(data);
}

function renderOtaProgress(data) {
  const progress = Math.max(0, Math.min(100, Number(data.progress) || 0));
  setFirmwareProgress(progress);
  if (!data.running && progress >= 100) {
    syncFirmwareControls();
  }
}

async function startFirmwareUpgradeFromCurrentSelection() {
  const target = currentUpgradeTarget();
  if (target === "remote" && !hasRemoteUpgradeTarget()) {
    appendLog(t("firmware.remoteUnavailable"));
    syncFirmwareControls();
    return;
  }
  setFirmwareProgress(0);
  els.startUpgrade.disabled = true;
  if (els.checkFirmwareUpdate) {
    els.checkFirmwareUpdate.disabled = true;
  }
  const response = await bridgeCall("startFirmwareUpgrade", {
    filePath: state.firmwarePath,
    remoteSlot: currentUpgradeRemoteSlot(),
  });
  if (!response.ok) {
    syncFirmwareControls();
    appendLog(response.message);
  }
}

async function confirmOnlineFirmwareUpgrade(data) {
  const confirmed = await showConfirmDialog({
    title: t("firmware.updateTitle"),
    message: formatTemplate("firmware.updateMessage", data.displayVersion || data.packageName || data.title || "--"),
    kicker: t("firmware.confirmKicker"),
    confirmText: t("firmware.updateStart"),
    tone: "warning",
  });
  if (confirmed) {
    state.firmwareCheckPending = true;
    state.firmwareBusyKey = "firmware.downloading";
    syncFirmwareControls();
    const response = await bridgeCall("downloadFirmwareUpdate", {});
    if (!response.ok) {
      state.firmwareCheckPending = false;
      state.firmwareBusyKey = "";
      syncFirmwareControls();
      appendLog(response.message);
    }
  } else {
    syncFirmwareControls();
  }
}

function showFirmwareUpToDateDialog(data, fallbackMessage) {
  const version = data.displayVersion || data.version || "--";
  const message = fallbackMessage || formatTemplate("firmware.upToDateMessage", version);
  showInfoDialog({
    title: t("firmware.upToDateTitle"),
    message,
    kicker: t("firmware.confirmKicker"),
    tone: "default",
  });
}

function showFirmwareInvalidVersionDialog(message = "") {
  showInfoDialog({
    title: t("firmware.invalidVersionTitle"),
    message: message || t("firmware.invalidVersionMessage"),
    kicker: t("firmware.confirmKicker"),
    tone: "warning",
  });
}

function showFirmwareCheckFailedDialog(data = {}, message = "") {
  void data;
  const details = message || t("firmware.checkFailedMessage");

  showInfoDialog({
    title: t("firmware.checkFailedTitle"),
    message: details,
    kicker: t("firmware.confirmKicker"),
    tone: "warning",
  });
}

async function handlePairAction(button) {
  const row = button.closest("tr[data-slot]");
  if (!row) {
    return;
  }
  const slot = Number(row.dataset.slot);
  const input = row.querySelector(".pair-mac-input");
  const action = button.dataset.action;

  if (action === "query") {
    await bridgeCall("getPairMac", { slot });
  } else if (action === "set") {
    await bridgeCall("setPairMac", { slot, mac: input.value.trim() });
  } else if (action === "pair") {
    await bridgeCall("startPair", { slot, timeoutSeconds: 100 });
  } else if (action === "stop") {
    await bridgeCall("stopPair");
  }
}

function activateModule(button) {
  [...els.navButtons, els.settingsButton].forEach((item) => item?.classList.remove("active"));
  button.classList.add("active");
  state.currentCode = button.dataset.code;
  const activePage = modulePages[state.currentCode] || null;

  Object.values(modulePages).forEach((page) => {
    if (page) {
      page.hidden = page !== activePage;
    }
  });
  els.emptyPage.hidden = !!activePage;
  stopRefresh();

  if (!activePage) {
    setPlainText(els.placeholderTitle, button.dataset.title || t("empty.moduleNotReadyTitle"));
    setLocalizedText(els.placeholderText, "empty.moduleNotReadyText");
  } else if (state.currentCode === "L4.INFO" && state.deviceConnected) {
    stopRefresh();
  } else if (state.currentCode === "L4.MONITOR" && state.deviceConnected) {
    bridgeCall("getMonitorSnapshot", { slot: 0, user: 0 });
    startRefresh();
  } else {
    stopRefresh();
    if (state.currentCode === "L4.LINK" && state.deviceConnected) {
      if (state.lastMonitor) {
        syncLinkConfigFromSnapshot(state.lastMonitor);
      }
      requestCurrentSnapshot();
    }
    if (state.currentCode === "L4.PERSIST" && state.deviceConnected) {
      requestPersistConfig();
    }
  }
  if (state.monitorLog.recording) {
    startRefresh();
  }
  scheduleSlimScrollbarUpdate();
}

function activateModuleByCode(code) {
  const button = [...els.navButtons, els.settingsButton].find((item) => item?.dataset.code === code);
  if (button) {
    activateModule(button);
  }
}

function activateHashModule() {
  const code = decodeURIComponent(window.location.hash.slice(1));
  if (code) {
    activateModuleByCode(code);
  }
}

function handleSegmentButton(button) {
  if (button.disabled || button.closest("#roleSegment")) {
    return;
  }

  if (button.dataset.settingValue) {
    applySettingChange(button);
    return;
  }

  const segment = button.closest(".segment");
  if (!segment) {
    return;
  }

  const previousEndpointScope = button.dataset.targetScope ? activeLinkEndpointScope() : null;
  const nextEndpointScope = button.dataset.targetScope ? normalizeEndpointScope(button.dataset.targetScope) : null;
  if (previousEndpointScope && previousEndpointScope !== nextEndpointScope) {
    saveLinkConfigForm(previousEndpointScope);
  }
  const previousPersistTargetScope = button.dataset.persistTargetScope ? activePersistTargetScope() : null;
  const nextPersistTargetScope = button.dataset.persistTargetScope
    ? normalizePersistTargetScope(button.dataset.persistTargetScope)
    : null;
  if (previousPersistTargetScope && previousPersistTargetScope !== nextPersistTargetScope) {
    saveActivePersistForm();
  }
  const previousProfileTargetScope = button.dataset.profileTargetScope ? activeProfileTargetScope() : null;
  const nextProfileTargetScope = button.dataset.profileTargetScope
    ? normalizePersistTargetScope(button.dataset.profileTargetScope)
    : null;
  if (previousProfileTargetScope && previousProfileTargetScope !== nextProfileTargetScope) {
    saveActiveProfileForm();
  }

  segment.querySelectorAll(".segment-button").forEach((item) => item.classList.remove("active"));
  button.classList.add("active");
  syncPersistUnsetButton(segment);

  const target = segment.dataset.target;
  if (target) {
    const control = document.querySelector(`#${target}`);
    if (control) {
      control.disabled = button.dataset.mode !== "manual";
      syncCustomSelect(control);
    }
  }

  if (button.dataset.power) {
    syncPowerInputs(button);
  }

  if (button.dataset.targetScope) {
    renderLinkConfigForm(nextEndpointScope);
  }

  if (button.dataset.persistTargetScope) {
    state.persistTargetScope = nextPersistTargetScope;
    restoreActivePersistForm(nextPersistTargetScope);
    updatePersistPowerInputLimits();
    requestPersistConfig(nextPersistTargetScope);
    return;
  }

  if (button.dataset.profileTargetScope) {
    state.profileTargetScope = nextProfileTargetScope;
    restoreProfileForm(nextProfileTargetScope);
    return;
  }

  if (button.dataset.upgradeTarget && els.upgradeTargetHint) {
    updateUpgradeTargetHint();
    syncFirmwareControls();
  }

  const widebandStatus = button.closest(".config-row")?.querySelector(".wideband-status");
  if (widebandStatus) {
    const mode = button.dataset.frameChange || "unknown";
    setLocalizedText(widebandStatus, widebandStatusKey(mode));
  }

  if (button.closest("#linkConfigPage")) {
    if (button.dataset.targetScope) {
      return;
    }
    const action = segment.dataset.configKey;
    if (["bandMode", "channelMode", "bandwidthMode", "mcsMode", "powerAuto", "frameChange"].includes(action)) {
      sendLinkConfig([action]);
    }
    if (action === "mcsMode" && button.dataset.mode === "manual") {
      requestDefaultConfigForMcsOptions(activeLinkEndpointScope());
    }
  }

  if (button.closest("#persistPage")) {
    if (button.dataset.power === "fixed") {
      document.querySelector("#fixedPowerInput")?.focus({ preventScroll: true });
      updatePersistDirtyState();
    } else if (button.dataset.power === "range") {
      document.querySelector("#minPowerInput")?.focus({ preventScroll: true });
      updatePersistDirtyState();
    } else if (segment.dataset.persistKey === "role") {
      applyPersistConfig(["role"]);
    } else if (segment.dataset.persistKey === "band") {
      applyPersistConfig(["band"]);
    } else if (segment.dataset.persistKey === "powerMode") {
      applyPersistConfig(["power"]);
    } else {
      updatePersistDirtyState();
    }
  }
}

function wireModuleUi() {
  document.querySelectorAll(".content .segment-button").forEach((button) => {
    button.addEventListener("click", () => handleSegmentButton(button));
  });

  els.monitorRecordToggle?.addEventListener("click", handleMonitorRecordToggle);
  ["mouseenter", "mousemove", "mouseleave", "focus", "blur"].forEach((eventName) => {
    els.monitorRecordToggle?.addEventListener(eventName, handleMonitorRecordIntentEvent);
  });
  els.monitorMarkButton?.addEventListener("click", addMonitorMarker);
  els.monitorExportButton?.addEventListener("click", exportMonitorLogCsv);
  renderMonitorLogControls();

  const linkSelectActions = {
    bandSelect: "band",
    channelSelect: "channel",
    bandwidthSelect: "bandwidth",
    mcsSelect: "mcs",
    powerSelect: "power",
  };
  Object.entries(linkSelectActions).forEach(([id, action]) => {
    const select = document.querySelector(`#${id}`);
    select?.addEventListener("change", () => {
      if (!select.disabled) {
        if (action === "band") {
          refreshChannelSelectForCurrentBand(activeLinkEndpointScope());
        }
        sendLinkConfig([action]);
      }
    });
  });

  els.persistPage?.querySelectorAll("[data-persist-input]").forEach((input) => {
    input.addEventListener("input", input.id === "freqListInput"
      ? updateFreqListDirtyState
      : input.id === "uartBaudrateInput"
        ? updateBaudrateDirtyState
        : updatePersistDirtyState);
    input.addEventListener("keydown", (event) => {
      if (event.defaultPrevented) {
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        input.blur();
      }
    });
    input.addEventListener("blur", () => {
      if (input.id === "peerMacInput") {
        applyPersistConfig(["peerMac"]);
      } else if (["fixedPowerInput", "minPowerInput", "maxPowerInput"].includes(input.id)) {
        applyPersistConfig(["power"]);
      } else if (input.id === "freqListInput") {
        applyPersistConfig(["freqList"]);
      } else if (input.id === "uartBaudrateInput") {
        applyPersistConfig(["uartBaudrate"]);
      }
    });
  });

  els.accentColorInput?.addEventListener("input", () => {
    updateAccentPreference(els.accentColorInput.value);
  });
  els.accentColorInput?.addEventListener("change", () => {
    updateAccentPreference(els.accentColorInput.value, { report: true });
  });
  els.accentColorText?.addEventListener("input", () => {
    updateAccentPreference(els.accentColorText.value);
  });
  els.accentColorText?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      updateAccentPreference(els.accentColorText.value, { commit: true, report: true });
      els.accentColorText.blur();
    }
  });
  els.accentColorText?.addEventListener("blur", () => {
    updateAccentPreference(els.accentColorText.value, { commit: true });
  });

  els.persistClearButton?.addEventListener("click", async () => {
    const targetLabel = persistTargetLabel();
    const confirmed = await showConfirmDialog({
      title: t("persist.clearTitle"),
      message: formatTemplate("persist.clearMessage", targetLabel),
      kicker: t("common.highRisk"),
      confirmText: t("persist.clearAction"),
      tone: "danger",
    });
    if (!confirmed) {
      return;
    }
    setPersistStatus("applying");
    const response = await bridgeCall("resetPersistConfig", persistRequestOptions());
    if (response && response.ok === false) {
      setPersistStatus("failed");
    }
  });

  els.persistRebootButton?.addEventListener("click", async () => {
    const targetLabel = persistTargetLabel();
    const confirmed = await showConfirmDialog({
      title: t("persist.rebootTitle"),
      message: formatTemplate("persist.rebootMessage", targetLabel),
      kicker: t("common.operation"),
      confirmText: t("persist.rebootAction"),
      tone: "default",
    });
    if (!confirmed) {
      return;
    }
    setPersistStatus("applying");
    const response = await bridgeCall("rebootPersistConfig", persistRequestOptions());
    if (response && response.ok === false) {
      setPersistStatus("failed");
    }
  });

  state.persistSavedState = capturePersistState();
  currentPersistForm("local").savedState = state.persistSavedState;
  currentPersistForm("local").draftState = state.persistSavedState;
  currentPersistForm("peer").savedState = state.persistSavedState;
  currentPersistForm("peer").draftState = state.persistSavedState;
  updatePersistDirtyState();

  els.browseFirmware?.addEventListener("click", async () => {
    const response = await bridgeCall("selectFirmwareFile");
    if (response.ok) {
      const data = responseData(response);
      state.firmwarePath = data.path || "";
      if (data.fileName) {
        setPlainText(els.firmwareFileName, data.fileName);
      } else {
        setLocalizedText(els.firmwareFileName, "firmware.selectedFile");
      }
      setFirmwareProgress(0);
      syncFirmwareControls();
    } else if (response.code !== -499) {
      appendLog(response.message);
    }
  });

  els.checkFirmwareUpdate?.addEventListener("click", async () => {
    const target = currentUpgradeTarget();
    if (target === "remote" && !hasRemoteUpgradeTarget()) {
      appendLog(t("firmware.remoteUnavailable"));
      syncFirmwareControls();
      return;
    }
    state.firmwareCheckPending = true;
    state.firmwareBusyKey = "firmware.checking";
    syncFirmwareControls();
    const response = await bridgeCall("checkFirmwareUpdate", {
      currentVersion: currentUpgradeFirmwareVersion(),
      remoteSlot: currentUpgradeRemoteSlot(),
    });
    if (!response.ok) {
      state.firmwareCheckPending = false;
      state.firmwareBusyKey = "";
      syncFirmwareControls();
      appendLog(response.message);
    }
  });

  els.startUpgrade?.addEventListener("click", async () => {
    if (!state.firmwarePath) {
      appendLog(t("firmware.selectFirst"));
      return;
    }
    const target = activeSegmentValue("[data-upgrade-target-group]", "local");
    if (target === "remote" && !hasRemoteUpgradeTarget()) {
      appendLog(t("firmware.remoteUnavailable"));
      syncFirmwareControls();
      return;
    }
    const confirmed = await showConfirmDialog({
      title: t("firmware.startTitle"),
      message: t("firmware.startMessage"),
      kicker: t("firmware.confirmKicker"),
      confirmText: t("firmware.confirmStart"),
      tone: "warning",
    });
    if (!confirmed) {
      return;
    }
    await startFirmwareUpgradeFromCurrentSelection();
  });

  els.readConfigFile?.addEventListener("click", () => {
    bridgeCall("readConfigFile", profileRequestOptions(activeProfileTargetScope(), { mode: 0 }));
  });
  els.writeConfigFile?.addEventListener("click", async () => {
    saveActiveProfileForm();
    try {
      JSON.parse(els.jsonEditor.value);
    } catch (error) {
      appendLog(formatTemplate("profile.parseError", error.message));
      return;
    }
    const targetLabel = profileTargetLabel();
    const confirmed = await showConfirmDialog({
      title: t("profile.writeTitle"),
      message: formatTemplate("profile.writeMessage", targetLabel),
      confirmText: t("profile.save"),
    });
    if (!confirmed) {
      return;
    }
    await bridgeCall("writeConfigFile", profileRequestOptions(activeProfileTargetScope(), { text: els.jsonEditor.value }));
  });
  els.resetConfigFile?.addEventListener("click", async () => {
    const targetLabel = profileTargetLabel();
    const confirmed = await showConfirmDialog({
      title: t("profile.resetTitle"),
      message: formatTemplate("profile.resetMessage", targetLabel),
      kicker: t("common.highRisk"),
      confirmText: t("profile.restoreAria"),
      tone: "danger",
    });
    if (!confirmed) {
      return;
    }
    await bridgeCall("resetConfigFile", profileRequestOptions());
  });
  els.importConfigFile?.addEventListener("click", async () => {
    const response = await bridgeCall("importConfigFile");
    if (response.ok) {
      renderConfigFile(responseData(response));
      appendLog(response.message);
    } else if (response.code !== -499) {
      appendLog(response.message);
    }
  });
  els.exportConfigFile?.addEventListener("click", async () => {
    const response = await bridgeCall("exportConfigFile", { text: els.jsonEditor.value });
    if (response.ok) {
      appendLog(response.message);
    } else if (response.code !== -499) {
      appendLog(response.message);
    }
  });

  els.configSearchButton?.addEventListener("click", searchConfig);
  els.configPrevButton?.addEventListener("click", () => moveSearchResult(-1));
  els.configNextButton?.addEventListener("click", () => moveSearchResult(1));
  els.configSearch?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (event.shiftKey) {
        moveSearchResult(-1);
      } else if (state.searchMatches.length > 0) {
        moveSearchResult(1);
      } else {
        searchConfig();
      }
    }
  });
  els.configSearch?.addEventListener("input", () => {
    resetConfigSearch();
  });
  els.jsonEditor?.addEventListener("input", () => {
    const form = currentProfileForm();
    form.text = els.jsonEditor.value;
    resetConfigSearch();
  });
}

function syncWindowMaximizedState(maximized) {
  document.documentElement.dataset.windowMaximized = maximized ? "true" : "false";
  scheduleSlimScrollbarUpdate();
  window.setTimeout(scheduleSlimScrollbarUpdate, 160);
}

async function handleWindowAction(action) {
  if (!action || !state.bridge || typeof state.bridge.windowControl !== "function") {
    return;
  }
  const response = await bridgeCall("windowControl", { action });
  if (action === "maximize" && response?.ok) {
    syncWindowMaximizedState(!!responseData(response).maximized);
  }
}

function isWindowDragTarget(target) {
  return !target.closest("button, input, select, textarea, a, label, .custom-select, .baudrate-combo, .top-controls");
}

function wireUi() {
  initializeChannelSelect();
  initializeCustomSelects();
  initializeBaudrateCombo();
  initializeAppDialog();
  initializeSlimScrollbars();
  els.navButtons.forEach((button) => {
    button.addEventListener("click", () => activateModule(button));
  });
  els.settingsButton?.addEventListener("click", () => activateModule(els.settingsButton));

  els.windowButtons.forEach((button) => {
    button.addEventListener("click", () => handleWindowAction(button.dataset.windowAction));
  });

  els.topbar?.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || !isWindowDragTarget(event.target)) {
      return;
    }
    event.preventDefault();
    handleWindowAction("move");
  });
  window.addEventListener("l4-window-state", (event) => {
    syncWindowMaximizedState(!!event.detail?.maximized);
  });

  els.deviceSelect.addEventListener("change", () => {
    const index = els.deviceSelect.value === "" ? NaN : Number(els.deviceSelect.value);
    if (Number.isInteger(index) && index >= 0) {
      const device = findDeviceByIndex(index);
      const serial = String(device?.serial || "");
      state.selectedDeviceIndex = index;
      if (state.deviceConnected && !isConnectedDeviceSelection(index, serial)) {
        clearConfigFileView();
        clearPersistConfigView();
      }
      state.openingDeviceIndex = index;
      state.openingDeviceSerial = serial;
      bridgeCall("openDevice", { index, serial }).then((response) => {
        if (response && response.ok === false) {
          state.openingDeviceIndex = null;
          state.openingDeviceSerial = "";
        }
      });
    }
  });

  els.pairTableBody.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (button) {
      handlePairAction(button);
    }
  });

  wireModuleUi();
  window.addEventListener("hashchange", activateHashModule);
  activateHashModule();
}

function connectBridge() {
  if (!window.qt || !window.qt.webChannelTransport || typeof QWebChannel === "undefined") {
    setStatus("offline", t("status.webChannelNotReady"));
    appendLog(t("log.notInQt"));
    return;
  }

  new QWebChannel(qt.webChannelTransport, async (channel) => {
    state.bridge = channel.objects.l4Bridge;
    await loadPreferencesFromBridge();
    state.bridge.deviceListUpdated.connect(renderDevices);
    state.bridge.connectionChanged.connect(renderConnection);
    state.bridge.overviewUpdated.connect(renderOverview);
    state.bridge.monitorUpdated.connect(renderMonitor);
    state.bridge.pairUpdated.connect(renderPairUpdate);
    state.bridge.persistConfigUpdated.connect(renderPersistConfig);
    state.bridge.configFileUpdated.connect(handleConfigFileUpdated);
    state.bridge.operationFinished.connect(renderOperation);
    state.bridge.otaProgressChanged.connect(renderOtaProgress);
    state.bridge.logMessage.connect(appendLog);

    const app = await bridgeCall("getAppInfo");
    const info = responseData(app);
    state.appInfo = {
      ...state.appInfo,
      ...info,
    };
    renderAppInfo();
    setStatus("warning", t("status.connectingDaemon"));
    setDaemonStatus(false, t("status.daemonConnecting"));
    await bridgeCall("ensureDaemon", { address: "127.0.0.1", port: 50000, interfaceType: 0, uartId: 1 });
    startDeviceScan();
  });
}

initializePreferences();
wireUi();
setEmptySummary();
syncFirmwareControls();
connectBridge();
