@echo off
chcp 65001 >nul
cd /d "%~dp0"
cls

echo ==========================================
echo       正在启动无尽阶梯 (Ascension Stairs)
echo ==========================================
echo.

:: 1. 检查环境
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js 环境。
    echo 请先安装 Node.js (https://nodejs.org/)
    pause
    exit
)

:: 2. 检查依赖
if not exist "node_modules" (
    echo [信息] 检测到首次运行，正在安装依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败。
        pause
        exit
    )
)

:: 3. 检查构建产物
if not exist "dist" (
    echo [信息] 正在构建项目...
    call npm run build
)

:: 4. 打开浏览器 (延迟 2 秒执行，等待服务启动)
start /b cmd /c "timeout /t 2 >nul & start http://localhost:4173"

:: 5. 启动服务
echo [成功] 服务已启动！请保持此窗口开启。
echo.
call npm run preview

pause