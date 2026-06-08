#!/bin/bash
# ════════════════════════════════════════
#   🏰 บัลลังก์เงา — Server Launcher
#   รองรับ Mac และ Linux
# ════════════════════════════════════════

echo ""
echo "╔══════════════════════════════════════╗"
echo "║  🏰 บัลลังก์เงา — Server Launcher   ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── ตรวจสอบ Node.js ──────────────────────────────────────────────
if ! command -v node &>/dev/null; then
    echo "❌ ไม่พบ Node.js — ดาวน์โหลดได้ที่ https://nodejs.org"
    exit 1
fi

# ── ตรวจสอบ/ติดตั้ง cloudflared ─────────────────────────────────
CF_CMD=""
if command -v cloudflared &>/dev/null; then
    CF_CMD="cloudflared"
    echo "✅ พบ cloudflared"
else
    echo "⚠  ไม่พบ cloudflared — กำลังดาวน์โหลด..."
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)

    if [[ "$OS" == "darwin" ]]; then
        # Mac
        if command -v brew &>/dev/null; then
            brew install cloudflare/cloudflare/cloudflared
            CF_CMD="cloudflared"
        else
            curl -L "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64.tgz" | tar xz
            CF_CMD="./cloudflared"
        fi
    elif [[ "$OS" == "linux" ]]; then
        # Linux
        if [[ "$ARCH" == "x86_64" ]]; then
            curl -L "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64" -o cloudflared
        else
            curl -L "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64" -o cloudflared
        fi
        chmod +x cloudflared
        CF_CMD="./cloudflared"
    fi

    if [[ -n "$CF_CMD" ]]; then
        echo "✅ ดาวน์โหลด cloudflared สำเร็จ"
    else
        echo "⚠  ดาวน์โหลดไม่สำเร็จ — ใช้งานแบบ LAN เท่านั้น"
    fi
fi

# ── ฟังก์ชัน Cleanup เมื่อกด Ctrl+C ─────────────────────────────
PIDS=()
cleanup() {
    echo ""
    echo "🛑 กำลังหยุดทุก Process..."
    for pid in "${PIDS[@]}"; do
        kill "$pid" 2>/dev/null
    done
    exit 0
}
trap cleanup SIGINT SIGTERM

# ── เริ่ม Game Server ─────────────────────────────────────────────
echo "[1/3] 🚀 เริ่ม Game Server (port 3001)..."
node server.js &
SERVER_PID=$!
PIDS+=($SERVER_PID)
sleep 2

# ── เริ่ม Cloudflare Tunnel ───────────────────────────────────────
CF_URL=""
if [[ -n "$CF_CMD" ]]; then
    echo "[2/3] 🌐 เริ่ม Cloudflare Tunnel..."
    # รัน tunnel และดัก URL ที่ได้
    $CF_CMD tunnel --url http://localhost:3001 2>&1 | while read -r line; do
        echo "$line"
        if [[ "$line" =~ https://[a-z0-9-]+\.trycloudflare\.com ]]; then
            CF_URL="${BASH_REMATCH[0]}"
            echo ""
            echo "╔══════════════════════════════════════════════════════════╗"
            echo "║  🌐 Cloudflare URL สำหรับเพื่อน:                        ║"
            echo "║                                                          ║"
            echo "║  $CF_URL"
            echo "║                                                          ║"
            echo "║  ให้เพื่อนใส่ใน Server URL:                              ║"
            WS_URL="${CF_URL/https:/wss:}/ws"
            echo "║  $WS_URL"
            echo "╚══════════════════════════════════════════════════════════╝"
        fi
    done &
    CF_PID=$!
    PIDS+=($CF_PID)
    sleep 5
else
    echo "[2/3] ⏭ ข้าม Cloudflare Tunnel (ไม่พบโปรแกรม)"
fi

# ── เริ่ม Vite Dev Server ─────────────────────────────────────────
echo "[3/3] ⚡ เริ่ม Vite Dev Server (port 5173)..."
npm run dev &
VITE_PID=$!
PIDS+=($VITE_PID)

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ✅ ทุกอย่างพร้อมแล้ว!                                  ║"
echo "║                                                          ║"
echo "║  🖥  เปิดเกม: http://localhost:5173                       ║"
echo "║  🌐 URL ข้ามเน็ต: ดูด้านบน (wss://xxxx.trycloudflare.com/ws) ║"
echo "║                                                          ║"
echo "║  กด Ctrl+C เพื่อหยุด Server ทั้งหมด                     ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# รอจนกว่าจะกด Ctrl+C
wait
