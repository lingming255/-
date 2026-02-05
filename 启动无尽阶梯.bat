@echo off
title Ascension Stairs
echo 正在启动无尽阶梯...
cd /d "%~dp0"

:: 检查是否安装了依赖，如果没有则安装
if not exist "node_modules" (
    echo 检测到首次运行，正在安装依赖...
    call npm install
)

:: 打开浏览器
start "" "http://localhost:5173"

:: 启动服务
echo 服务启动中...请勿关闭此窗口
call npm run dev
pause