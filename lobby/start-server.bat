@echo off
chcp 65001 >nul
title Shadow of Throne — Server Launcher

echo.
echo ╔══════════════════════════════════════╗
echo ║   🏰 บัลลังก์เงา — Server Launcher  ║
echo ╚══════════════════════════════════════╝
echo.

:: ── ตรวจสอบ Node.js ────────────────────────────────────────────
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ไม่พบ Node.js — ดาวน์โหลดได้ที่ https://nodejs.org
    pause
    exit /b 1
)

:: ── ตรวจสอบ cloudflared ────────────────────────────────────────
where cloudflared >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠  ไม่พบ cloudflared
    echo    กำลังดาวน์โหลดอัตโนมัติ...
    echo.
    :: ดาวน์โหลด cloudflared อัตโนมัติ
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile 'cloudflared.exe'"
    if exist cloudflared.exe (
        echo ✅ ดาวน์โหลด cloudflared สำเร็จ
        set CF_CMD=cloudflared.exe
    ) else (
        echo ❌ ดาวน์โหลดไม่สำเร็จ — ใช้งานแบบ LAN เท่านั้น
        set CF_CMD=
    )
) else (
    set CF_CMD=cloudflared
)

echo [1/3] 🚀 กำลังเริ่ม Game Server (port 3001)...
start "🏰 Game Server" cmd /k "node server.js"
timeout /t 2 /nobreak >nul

if defined CF_CMD (
    echo [2/3] 🌐 กำลังสร้าง Cloudflare Tunnel...
    echo        URL จะปรากฏในหน้าต่างถัดไป — คัดลอกให้เพื่อน
    start "🌐 Cloudflare Tunnel" cmd /k "%CF_CMD% tunnel --url http://localhost:3001"
    timeout /t 4 /nobreak >nul
) else (
    echo [2/3] ⏭ ข้าม Cloudflare Tunnel
)

echo [3/3] ⚡ กำลังเริ่ม Vite Dev Server (port 5173)...
start "⚡ Vite Dev" cmd /k "npm run dev"

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║  ✅ ทุกอย่างพร้อมแล้ว!                                  ║
echo ║                                                          ║
echo ║  🖥  เปิดเกม: http://localhost:5173                       ║
echo ║                                                          ║
echo ║  🌐 URL ข้ามเน็ต: ดูจากหน้าต่าง "Cloudflare Tunnel"     ║
echo ║     จะขึ้นว่า: https://xxxx.trycloudflare.com            ║
echo ║     ให้เพื่อนใส่ใน "ตั้งค่า Server URL" ในเกม           ║
echo ║     เป็น: wss://xxxx.trycloudflare.com/ws                ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo กด Enter เพื่อปิดหน้าต่างนี้ (Server ยังทำงานอยู่ในหน้าต่างอื่น)
pause >nul
