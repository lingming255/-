# 启动无尽阶梯 (推荐).ps1
Write-Host "正在启动无尽阶梯..." -ForegroundColor Green
Set-Location -Path "$PSScriptRoot"

# 1. 尝试使用 PWA 模式 (如果已安装)
# 这很难直接检测，所以我们直接启动预览服务器

# 2. 检查依赖
if (-not (Test-Path "node_modules")) {
    Write-Host "初次运行，正在安装依赖..." -ForegroundColor Yellow
    npm install
}

# 3. 启动本地服务器 (生产模式，更稳定)
Write-Host "服务已启动！正在打开浏览器..." -ForegroundColor Cyan
Write-Host "请勿关闭此窗口" -ForegroundColor Gray

# 使用 npx serve 启动静态文件 (确保已 build)
if (-not (Test-Path "dist")) {
    Write-Host "正在编译项目..."
    npm run build
}

# 启动并自动打开浏览器
npx serve -s dist
