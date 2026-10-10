// --- 1. DỮ LIỆU CẢNH GIỚI VÀ NGƯỜI CHƠI ---
const REALMS = [
    { name: "Phàm Nhân", maxExp: 80, hp: 100, qi: 0, dmg: 8 },
    { name: "Luyện Khí Tầng 1", maxExp: 200, hp: 160, qi: 60, dmg: 18 },
    { name: "Luyện Khí Tầng 3", maxExp: 500, hp: 300, qi: 140, dmg: 35 },
    { name: "Luyện Khí Tầng 9", maxExp: 1500, hp: 700, qi: 380, dmg: 80 },
    { name: "Trúc Cơ Sơ Kỳ", maxExp: 5000, hp: 1800, qi: 1000, dmg: 220 }
];

let player = {
    x: 1100, y: 720,
    speed: 250,
    realmIdx: 0,
    exp: 0,
    hp: 100, maxHp: 100,
    qi: 0, maxQi: 0,
    dmg: 8,
    silver: 15,
    spiritStones: 0,
    facing: "right",
    hasRod: false,
    learnedQiManual: false,
    hasFlyingSwordSkill: false
};

let inventory = [
    { id: "sword_wood", name: "Mộc Kiếm Sơ Cấp", icon: "🗡️", count: 1, type: "weapon" }
];

const MAP_LIMIT = { w: 1920, h: 1080 };
const keys = {};
let projectiles = [];

// Biến điều khiển hoạt ảnh bước đi của Spritesheet
let animTimer = 0;
let walkFrame = 1; // 0, 1, 2 tương ứng 3 cột

// Khu vực hồ câu cá
const fishingLake = { x: 40, y: 760, w: 250, h: 250 };

// Thương Lão Gia đứng tại sạp gỗ bên phải
const merchant = { x: 1680, y: 800 };

// Cổ Động Phủ đặt tại bậc đá phía trên
let secretCave = {
    x: 880, y: 150,
    looted: false,
    name: "Cổ Tu Động Phủ"
};

// Yêu thú canh gác
let monsters = [
    { id: 1, name: "Dã Lang", icon: "🐺", x: 600, y: 880, hp: 40, maxHp: 40, dmg: 10, exp: 25, silver: 4 },
    { id: 2, name: "Bạch Xà", icon: "🐍", x: 1450, y: 920, hp: 60, maxHp: 60, dmg: 15, exp: 40, silver: 8 }
];

// Cửa hàng phường thị
const shopGoods = [
    { id: "rod", name: "Cần Câu Trúc", icon: "🎣", cost: 20, desc: "Dùng để câu cá tại hồ nước bên trái" },
    { id: "manual", name: "Bí Kíp: Dẫn Khí Quyết", icon: "📜", cost: 60, desc: "Mở thông kinh mạch, bước vào Luyện Khí Kỳ!" },
    { id: "sword", name: "Thanh Cương Kiếm", icon: "🗡️", cost: 80, desc: "Tăng thêm +15 lực sát thương" }
];

const $ = id => document.getElementById(id);

// --- 2. CẬP NHẬT HUD & HIỆU ỨNG ---
function updateHUD() {
    const curRealm = REALMS[player.realmIdx];
    $("ui-realm").innerText = curRealm.name;
    $("ui-exp").innerText = player.exp;
    $("ui-max-exp").innerText = curRealm.maxExp;
    $("ui-hp").innerText = Math.round(player.hp);
    $("ui-max-hp").innerText = player.maxHp;
    $("ui-qi").innerText = Math.round(player.qi);
    $("ui-max-qi").innerText = player.maxQi;
    $("ui-silver").innerText = player.silver;
    $("ui-stones").innerText = player.spiritStones;
    $("player-tag").innerText = curRealm.name;
}

function showFloatText(x, y, text, color = "#ffeb3b") {
    const el = document.createElement("div");
    el.className = "float-text";
    el.innerText = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.color = color;
    $("world").appendChild(el);
    setTimeout(() => el.remove(), 800);
}

function renderWorldObjects() {
    $("npc-merchant").style.left = `${merchant.x}px`;
    $("npc-merchant").style.top = `${merchant.y}px`;

    $("secret-cave").style.left = `${secretCave.x}px`;
    $("secret-cave").style.top = `${secretCave.y}px`;

    $("monsters-container").innerHTML = monsters.map(m => `
        <div id="monster-${m.id}" class="monster-node" style="left:${m.x}px; top:${m.y}px; display:${m.hp > 0 ? 'block' : 'none'};">
            <div class="monster-hp" id="mhp-${m.id}">${m.hp}/${m.maxHp}</div>
            <div class="monster-icon">${m.icon}</div>
        </div>
    `).join("");
}

// --- 3. CÂU CÁ ---
function startFishing() {
    const inLakeX = player.x >= fishingLake.x - 40 && player.x <= fishingLake.x + fishingLake.w + 40;
    const inLakeY = player.y >= fishingLake.y - 40 && player.y <= fishingLake.y + fishingLake.h + 40;

    if (!inLakeX || !inLakeY) {
        showFloatText(player.x, player.y - 30, "Hãy lại gần hồ câu bên trái!", "#aaa");
        return;
    }

    if (!player.hasRod) {
        alert("Bạn chưa có Cần Câu Trúc! Hãy lại chỗ Thương Lão Gia bên phải để mua.");
        return;
    }

    showFloatText(player.x, player.y - 35, "Đang thả câu...", "#29b6f6");

    setTimeout(() => {
        const isSpiritFish = Math.random() < 0.3;
        if (isSpiritFish) {
            addItem("spirit_fish", "Kim Quy Linh Ngư", "🐟", 1);
            player.exp += 35;
            showFloatText(player.x, player.y - 45, "+1 Linh Ngư! (+35 Tu Vi)", "#00e5ff");
            checkBreakthrough();
        } else {
            addItem("fish", "Cá Trôi", "🐟", 1);
            showFloatText(player.x, player.y - 45, "+1 Cá Trôi!", "#fff");
        }
        updateHUD();
    }, 1000);
}

// --- 4. TU LUYỆN & ĐỘT PHÁ ---
window.meditate = function() {
    if (!player.learnedQiManual && player.realmIdx === 0) {
        alert("Bạn chưa có tâm pháp Dẫn Khí Quyết! Hãy vào Tạp Hóa mua bí tịch.");
        return;
    }

    player.exp += 20;
    player.hp = Math.min(player.maxHp, player.hp + 30);
    player.qi = Math.min(player.maxQi, player.qi + 25);
    showFloatText(player.x, player.y - 40, "Đang thổ nạp... +20 Tu vi", "#00e5ff");
    checkBreakthrough();
    updateHUD();
};

function checkBreakthrough() {
    const curRealm = REALMS[player.realmIdx];
    if (player.exp >= curRealm.maxExp && player.realmIdx < REALMS.length - 1) {
        player.exp -= curRealm.maxExp;
        player.realmIdx++;
        const nextRealm = REALMS[player.realmIdx];

        player.maxHp = nextRealm.hp;
        player.hp = player.maxHp;
        player.maxQi = nextRealm.qi;
        player.qi = player.maxQi;
        player.dmg = nextRealm.dmg;

        alert(`🎉 THIÊN ĐỊA DỊ TƯỢNG!\nĐột phá cảnh giới thành công: 【${nextRealm.name}】!`);
        showFloatText(player.x, player.y - 60, `ĐỘT PHÁ: ${nextRealm.name}!`, "#ffd700");
    }
}

// --- 5. TẤN CÔNG CẬN CHIẾN & PHÓNG PHI KIẾM ---
function attackMelee() {
    let hitMonster = false;
    monsters.forEach(m => {
        if (m.hp > 0 && Math.hypot(player.x - m.x, player.y - m.y) < 85) {
            hitMonster = true;
            m.hp -= player.dmg;
            showFloatText(m.x, m.y - 25, `-${player.dmg}`, "#ff5252");
            const hpEl = $(`mhp-${m.id}`);
            if (hpEl) hpEl.innerText = `${Math.max(0, m.hp)}/${m.maxHp}`;

            if (m.hp <= 0) {
                player.exp += m.exp;
                player.silver += m.silver;
                showFloatText(m.x, m.y - 45, `+${m.silver} Bạc, +${m.exp} Tu vi!`, "#ffd700");
                $(`monster-${m.id}`).style.display = "none";
                checkBreakthrough();
                updateHUD();

                setTimeout(() => {
                    m.hp = m.maxHp;
                    $(`monster-${m.id}`).style.display = "block";
                    $(`mhp-${m.id}`).innerText = `${m.hp}/${m.maxHp}`;
                }, 8000);
            }
        }
    });

    // Nếu vung kiếm mà không trúng quái thì hiện hiệu ứng chém gió
    if (!hitMonster) {
        showFloatText(player.x + (player.facing === "right" ? 30 : -30), player.y - 20, "Vút!", "#8be9fd");
    }
}

function castFlyingSword() {
    if (!player.hasFlyingSwordSkill) {
        showFloatText(player.x, player.y - 30, "Chưa học được Ngự Kiếm Thuật!", "#aaa");
        return;
    }
    if (player.qi < 20) {
        showFloatText(player.x, player.y - 30, "Linh lực bất túc!", "#e91e63");
        return;
    }

    player.qi -= 20;
    updateHUD();

    const el = document.createElement("div");
    el.className = "projectile";
    el.innerText = "🗡️";
    $("projectiles-container").appendChild(el);

    const dir = player.facing === "left" ? -1 : 1;
    projectiles.push({
        x: player.x,
        y: player.y - 25,
        vx: 550 * dir,
        dmg: player.dmg * 2.5,
        el
    });
}

// --- 6. CƠ DUYÊN & THƯƠNG NHÂN ---
function checkEncounters() {
    if (!secretCave.looted && Math.hypot(player.x - secretCave.x, player.y - secretCave.y) < 80) {
        secretCave.looted = true;
        player.spiritStones += 15;
        player.hasFlyingSwordSkill = true;
        alert("⛩️【CƠ DUYÊN KỲ NGỘ】\nBạn khám phá Cổ Tu Động Phủ!\nNhận được: 15 Linh Thạch & Bí tịch: 【Thanh Phong Phi Kiếm Quyết】 (Nhấn phím Q để phóng kiếm)!");
        showFloatText(player.x, player.y - 50, "Lĩnh ngộ: Ngự Kiếm Thuật (Q)!", "#00e5ff");
        updateHUD();
    }
}

function interactNPC() {
    if (Math.hypot(player.x - merchant.x, player.y - merchant.y) < 110) {
        openShop();
    }
}

// --- 7. TÚI ĐỒ VÀ MUA BÁN ---
function addItem(id, name, icon, count = 1) {
    const item = inventory.find(i => i.id === id);
    if (item) item.count += count;
    else inventory.push({ id, name, icon, count });
}

window.toggleBag = function() {
    const modal = $("bag-modal");
    modal.style.display = modal.style.display === "flex" ? "none" : "flex";
    if (modal.style.display === "flex") {
        $("inventory-list").innerHTML = inventory.map(i => `
            <div class="inv-item">
                <span>${i.icon} ${i.name}</span>
                <b>x${i.count}</b>
            </div>
        `).join("");
    }
};

window.openShop = function() {
    $("shop-modal").style.display = "flex";
    $("shop-goods").innerHTML = shopGoods.map((g, idx) => `
        <div class="shop-item">
            <div>
                <b>${g.icon} ${g.name}</b> (${g.cost} Bạc)
                <div style="font-size:10.5px; color:#aaa;">${g.desc}</div>
            </div>
            <button class="btn-buy" onclick="buyItem(${idx})">Mua</button>
        </div>
    `).join("");
};

window.closeShop = function() { $("shop-modal").style.display = "none"; };

window.buyItem = function(idx) {
    const g = shopGoods[idx];
    if (player.silver < g.cost) return alert("Không đủ Bạc!");

    player.silver -= g.cost;
    if (g.id === "rod") {
        player.hasRod = true;
        addItem("rod", g.name, g.icon, 1);
        alert("Đã nhận Cần Câu! Ra hồ nước bên trái bấm E để câu cá.");
    } else if (g.id === "manual") {
        player.learnedQiManual = true;
        addItem("manual", g.name, g.icon, 1);
        alert("Đã học Dẫn Khí Quyết! Bấm 'Bế Quan Tu Luyện' để nạp linh khí.");
    } else if (g.id === "sword") {
        player.dmg += 15;
        addItem("sword", g.name, g.icon, 1);
        alert("Đã trang bị kiếm! +15 Sát thương.");
    }
    updateHUD();
};

window.sellAllResources = function() {
    let earned = 0;
    inventory = inventory.filter(item => {
        if (item.id === "fish") {
            earned += item.count * 6;
            return false;
        }
        if (item.id === "spirit_fish") {
            earned += item.count * 30;
            return false;
        }
        return true;
    });

    if (earned > 0) {
        player.silver += earned;
        showFloatText(player.x, player.y - 30, `+${earned} Bạc!`, "#ffd700");
        updateHUD();
        alert(`Đã bán toàn bộ tài nguyên, nhận được ${earned} Bạc!`);
    } else {
        alert("Túi không có Cá để bán!");
    }
};

// --- 8. VẼ BẢN ĐỒ MINIMAP LA BÀN ---
function drawMinimap() {
    const cvs = $("minimap-canvas");
    const ctx = cvs.getContext("2d");
    const scaleX = cvs.width / MAP_LIMIT.w;
    const scaleY = cvs.height / MAP_LIMIT.h;

    ctx.clearRect(0, 0, cvs.width, cvs.height);

    // Hồ nước (Xanh dương)
    ctx.fillStyle = "rgba(41, 182, 246, 0.6)";
    ctx.fillRect(fishingLake.x * scaleX, fishingLake.y * scaleY, fishingLake.w * scaleX, fishingLake.h * scaleY);

    // Động phủ (Tím)
    ctx.fillStyle = "#e040fb";
    ctx.beginPath();
    ctx.arc(secretCave.x * scaleX, secretCave.y * scaleY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Thương nhân (Vàng)
    ctx.fillStyle = "#ffd700";
    ctx.beginPath();
    ctx.arc(merchant.x * scaleX, merchant.y * scaleY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Quái vật (Đỏ)
    ctx.fillStyle = "#ff5252";
    monsters.forEach(m => {
        if (m.hp > 0) {
            ctx.beginPath();
            ctx.arc(m.x * scaleX, m.y * scaleY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Người chơi (Xanh ngọc, viền trắng)
    ctx.fillStyle = "#00e5ff";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(player.x * scaleX, player.y * scaleY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    $("minimap-coords").innerText = `X: ${Math.round(player.x)} | Y: ${Math.round(player.y)}`;
}

// --- 9. GAME LOOP ---
let lastTime = performance.now();

function gameLoop(time) {
    const dt = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;

    let dx = (keys["d"] ? 1 : 0) - (keys["a"] ? 1 : 0);
    let dy = (keys["s"] ? 1 : 0) - (keys["w"] ? 1 : 0);

    const isMoving = dx !== 0 || dy !== 0;
    const pSprite = $("player-sprite");

    if (isMoving) {
        const len = Math.hypot(dx, dy);
        player.x = Math.max(30, Math.min(MAP_LIMIT.w - 30, player.x + (dx / len) * player.speed * dt));
        player.y = Math.max(30, Math.min(MAP_LIMIT.h - 30, player.y + (dy / len) * player.speed * dt));
        checkEncounters();

        // Cập nhật frame bước chân
        animTimer += dt;
        if (animTimer > 0.14) {
            walkFrame = (walkFrame + 1) % 3;
            animTimer = 0;
        }

        // Tọa độ hàng Spritesheet:
        // Hàng 0 (0%): Đi xuống (S)
        // Hàng 1 (33.3%): Đi ngang (A / D)
        // Hàng 3 (100%): Đi lên (W)
        let rowPercent = "0%";
        if (dy > 0) {
            rowPercent = "0%";
        } else if (dy < 0) {
            rowPercent = "100%";
        } else if (dx !== 0) {
            rowPercent = "33.333%";
        }

        if (dx < 0) {
            player.facing = "left";
            pSprite.style.transform = "scaleX(-1)";
        } else if (dx > 0) {
            player.facing = "right";
            pSprite.style.transform = "scaleX(1)";
        }

        const colPercent = (walkFrame * 50) + "%";
        pSprite.style.backgroundPosition = `${colPercent} ${rowPercent}`;
    } else {
        // Đứng yên: frame giữa nhìn xuống
        pSprite.style.backgroundPosition = "50% 0%";
    }

    // Camera di chuyển theo người chơi
    const camX = Math.max(0, Math.min(MAP_LIMIT.w - window.innerWidth, player.x - window.innerWidth / 2));
    const camY = Math.max(0, Math.min(MAP_LIMIT.h - (window.innerHeight - 48), player.y - (window.innerHeight - 48) / 2));
    $("world").style.transform = `translate(${-camX}px, ${-camY}px)`;

    $("player").style.left = `${player.x}px`;
    $("player").style.top = `${player.y}px`;

    // Cập nhật phi kiếm bay
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.x += p.vx * dt;
        p.el.style.left = `${p.x}px`;
        p.el.style.top = `${p.y}px`;

        const hit = monsters.find(m => m.hp > 0 && Math.hypot(p.x - m.x, p.y - m.y) < 35);
        if (hit) {
            hit.hp -= p.dmg;
            showFloatText(hit.x, hit.y - 30, `BẠO KÍCH! -${p.dmg}`, "#00e5ff");
            $(`mhp-${hit.id}`).innerText = `${Math.max(0, hit.hp)}/${hit.maxHp}`;
            if (hit.hp <= 0) {
                player.exp += hit.exp;
                player.silver += hit.silver;
                $(`monster-${hit.id}`).style.display = "none";
                checkBreakthrough();
                updateHUD();
            }
            p.el.remove();
            projectiles.splice(i, 1);
            continue;
        }

        if (Math.abs(p.x - player.x) > 850) {
            p.el.remove();
            projectiles.splice(i, 1);
        }
    }

    drawMinimap();
    requestAnimationFrame(gameLoop);
}

// --- 10. BẮT SỰ KIỆN CLICK CHUỘT TRÁI ĐỂ ĐÁNH ---
window.addEventListener("mousedown", e => {
    // Chỉ kích hoạt khi click chuột trái (button = 0) và không click vào nút HUD / Modal
    if (e.button === 0 && !e.target.closest("button") && !e.target.closest(".modal")) {
        attackMelee();
    }
});

// --- BẮT SỰ KIỆN PHÍM ---
window.addEventListener("keydown", e => {
    const k = e.key.toLowerCase();
    keys[k] = true;

    if (k === "e") startFishing();
    if (k === "f") interactNPC();
    if (k === "q") castFlyingSword();
    if (k === "b") toggleBag();
});

window.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});

// Khởi chạy hệ thống
renderWorldObjects();
updateHUD();
requestAnimationFrame(gameLoop);