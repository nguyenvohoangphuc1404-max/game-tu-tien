const keys = {};
let animTimer = 0;
let walkFrame = 1;
let lastTime = performance.now();

function clearKeys() {
    for (let k in keys) keys[k] = false;
}

window.addEventListener("blur", clearKeys);
document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearKeys();
});

function isModalOpen() {
    const bagModal = $("bag-modal");
    const shopModal = $("shop-modal");
    const dlgModal = $("dialogue-modal");
    return (bagModal && bagModal.style.display === "flex") || 
           (shopModal && shopModal.style.display === "flex") ||
           (dlgModal && dlgModal.style.display === "flex");
}

// Kiểm tra va chạm: Cho phép đi xuyên qua đầu đường mòn để sang map mới
function canMoveTo(x, y) {
    if (x < 35 || x > MAP_LIMIT.w - 35 || y < 175 || y > MAP_LIMIT.h - 40) return false;

    // Cho phép đi lên đỉnh con đường mòn ở map thôn làng
    if (currentMapId === "town") {
        const isRoadPassage = x >= 1420 && x <= 1520 && y <= 210;
        if (isRoadPassage) return true;

        for (let box of COLLISION_BOXES) {
            if (x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h) {
                return false;
            }
        }
    }
    return true;
}

// Kiểm tra nhân vật bước vào cổng truyền tống
function checkPortals() {
    if (isTransitioning) return;

    if (currentMapId === "town") {
        const p = PORTALS.townToMountain;
        if (player.x >= p.x && player.x <= p.x + p.w && player.y <= p.y + p.h) {
            switchMap(p.targetMap, p.spawnX, p.spawnY);
        }
    } else if (currentMapId === "mountain") {
        const p = PORTALS.mountainToTown;
        if (player.x >= p.x && player.x <= p.x + p.w && player.y >= p.y) {
            switchMap(p.targetMap, p.spawnX, p.spawnY);
        }
    }
}

function interactNPC() {
    if (currentMapId === "town") {
        if (Math.hypot(player.x - merchant.x, player.y - merchant.y) < 110) {
            clearKeys();
            openShop();
        } else if (Math.hypot(player.x - elder.x, player.y - elder.y) < 110) {
            clearKeys();
            talkToElder();
        }
    }
}

// Vòng lặp gameLoop
function gameLoop(time) {
    const dt = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;

    let dx = 0;
    let dy = 0;
    if (!isModalOpen() && !isTransitioning) {
        dx = (keys["d"] ? 1 : 0) - (keys["a"] ? 1 : 0);
        dy = (keys["s"] ? 1 : 0) - (keys["w"] ? 1 : 0);
    }

    const isMoving = dx !== 0 || dy !== 0;
    const pSprite = $("player-sprite");

    if (isMoving) {
        const len = Math.hypot(dx, dy);
        const stepX = (dx / len) * player.speed * dt;
        const stepY = (dy / len) * player.speed * dt;

        if (canMoveTo(player.x + stepX, player.y)) player.x += stepX;
        if (canMoveTo(player.x, player.y + stepY)) player.y += stepY;

        checkPortals();

        animTimer += dt;
        if (animTimer > 0.13) {
            walkFrame = (walkFrame + 1) % 3;
            animTimer = 0;
        }

        let rowPercent = "0%";
        if (dy > 0) rowPercent = "0%";
        else if (dy < 0) rowPercent = "100%";
        else if (dx !== 0) rowPercent = "33.333%";
        player.lastRowPercent = rowPercent;

        if (dx < 0) {
            player.facing = "left";
            pSprite.style.transform = "scaleX(1)";
        } else if (dx > 0) {
            player.facing = "right";
            pSprite.style.transform = "scaleX(-1)";
        }

        pSprite.style.backgroundPosition = `${walkFrame * 50}% ${rowPercent}`;
    } else {
        pSprite.style.backgroundPosition = `50% ${player.lastRowPercent}`;
    }

    updateMonsters(dt);
    updateProjectiles(dt);

    const camX = Math.max(0, Math.min(MAP_LIMIT.w - window.innerWidth, player.x - window.innerWidth / 2));
    const camY = Math.max(0, Math.min(MAP_LIMIT.h - (window.innerHeight - 48), player.y - (window.innerHeight - 48) / 2));
    $("world").style.transform = `translate(${-camX}px, ${-camY}px)`;

    $("player").style.left = `${player.x}px`;
    $("player").style.top = `${player.y}px`;

    drawMinimap();
    requestAnimationFrame(gameLoop);
}

// Phím & Chuột
window.addEventListener("mousedown", e => {
    if (e.button === 0 && !e.target.closest("button") && !e.target.closest(".modal")) {
        attackMelee();
    }
});

window.addEventListener("keydown", e => {
    const k = e.key.toLowerCase();
    if (["w", "a", "s", "d"].includes(k)) keys[k] = true;
    if (k === "e") startFishing();
    if (k === "f") interactNPC();
    if (k === "q") castFlyingSword();
    if (k === "b" || k === "c") {
        clearKeys();
        toggleBag();
    }
});

window.addEventListener("keyup", e => {
    const k = e.key.toLowerCase();
    if (["w", "a", "s", "d"].includes(k)) keys[k] = false;
});

// Khởi chạy
renderWorldObjects();
updateHUD();
requestAnimationFrame(gameLoop);