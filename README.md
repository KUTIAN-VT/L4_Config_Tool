# L4 配置工具运行包

本仓库用于存放 L4 配置工具的 Windows 运行发布包。发布包中已经包含主程序、后台服务、升级工具、Qt 运行库、Web 前端资源和软件使用手册，解压后可直接在 Windows 上运行。

## 正确下载软件

普通用户请从 GitHub Releases 下载完整运行包：

1. 打开 [L4 配置工具 Releases 页面](https://github.com/KUTIAN-VT/L4_Config_Tool/releases)。
2. 选择最新版本，例如 `v0.4.2`。
3. 在 `Assets` 区域下载 `L4_Config_Tool-vX.Y.Z.zip` 这类运行包。
4. 解压 ZIP 后，进入解压出的文件夹运行 `L4_Config_Tool_Web.exe`。

请不要使用仓库首页的 `Code` -> `Download ZIP` 作为软件下载方式，也不要下载 Release 页面里自动生成的 `Source code (zip)` 或 `Source code (tar.gz)`。这些是源码归档，不是面向用户的完整运行包，可能缺少可执行文件、运行库或其他必要资源。

也不要只单独下载 `L4_Config_Tool_Web.exe`。软件运行还需要同目录下的 DLL、`web/`、`resources/`、`platforms/`、`l4_daemon.exe` 等文件。

## 快速开始

1. 按照上面的说明下载 Release 运行包并完整解压。
2. 确认解压目录文件保持完整，不要单独移动 `L4_Config_Tool_Web.exe` 或相关 DLL。
3. 将 L4 设备连接到电脑，并保持稳定供电。
4. 双击运行 `L4_Config_Tool_Web.exe`。
5. 等待底部状态栏显示 `l4_daemon 已连接`，再选择设备并进行配置、监控或升级操作。

## 主要文件

- `L4_Config_Tool_Web.exe`：L4 配置工具主程序。
- `l4_daemon.exe`：本机设备通信后台服务。
- `l4_ota_upgrade.exe`：固件升级辅助工具。
- `web/`：配置工具界面资源。
- `docs/`：软件使用说明和截图资源。
- `vc_redist.x64.exe`：Windows VC++ 运行库安装程序，目标电脑缺少运行库时可安装。

## 使用手册

详细的软件启动、设备连接、链路配置、固件升级和配置维护说明请查看：[软件使用手册](docs/L4配置工具软件使用手册.md)。

## 注意事项

- 固件升级、写配置和对频操作会改变设备状态，请在设备处于可维护状态时执行。
- 升级或写入配置过程中不要断电、拔线或关闭工具。
- 如果软件无法启动，请先确认下载的是 Release 运行包，而不是源码 ZIP。
- 如果运行包完整但仍无法启动，请安装包内的 `vc_redist.x64.exe`，并确认设备驱动状态。
