let isTransitioning = false;

function switchMap(targetMapId, spawnX, spawnY) {
    if (isTransitioning) return;
    isTransitioning = true;

    const worldEl = $("world");
    worldEl.style.transition = "opacity 0.4s ease";
    worldEl.style.opacity = "0";

    showFloatText(player.x, player.y - 50, `Đang tiến nhập: ${MAP_DATA[targetMapId].name}...`, "#00e5ff");

    setTimeout(() => {
        currentMapId = targetMapId;
        player.x = spawnX;
        player.y = spawnY;

        monsters = JSON.parse(JSON.stringify(MAP_DATA[currentMapId].monsters));

        const isTown = currentMapId === "town";
        if ($("npc-merchant")) $("npc-merchant").style.display = isTown ? "block" : "none";
        if ($("npc-elder")) $("npc-elder").style.display = isTown ? "block" : "none";
        if ($("fishing-lake")) $("fishing-lake").style.display = isTown ? "flex" : "none";
        const treeBox = $("trees-container");
        if (treeBox) treeBox.style.display = isTown ? "block" : "none";
        if ($("map-boundary-line")) $("map-boundary-line").style.display = isTown ? "block" : "none";

        renderWorldObjects();
        updateHUD();

        worldEl.style.opacity = "1";
        setTimeout(() => {
            worldEl.style.transition = "";
            isTransitioning = false;
        }, 400);
    }, 400);
}

function renderWorldObjects() {
    if ($("npc-merchant")) {
        $("npc-merchant").style.left = `${merchant.x}px`;
        $("npc-merchant").style.top = `${merchant.y}px`;
    }

    if ($("npc-elder")) {
        $("npc-elder").style.left = `${elder.x}px`;
        $("npc-elder").style.top = `${elder.y}px`;
    }

    const treesContainer = $("trees-container");
    if (treesContainer) {
        treesContainer.innerHTML = trees.map(t => `
            <div id="tree-${t.id}" class="tree-node" style="left:${t.x}px; top:${t.y}px;">
                <div class="tree-hp" id="thp-${t.id}">${t.hp}/${t.maxHp}</div>
                <div class="tree-icon">${t.icon}</div>
                <div class="tree-name">${t.name}</div>
            </div>
        `).join("");
    }

    if ($("monsters-container")) {
        $("monsters-container").innerHTML = monsters.map(m => `
            <div id="monster-${m.id}" class="monster-node" style="left:${m.x}px; top:${m.y}px; display:${m.hp > 0 ? 'block' : 'none'};">
                <div class="monster-name">${m.name}</div>
                <div class="monster-hp" id="mhp-${m.id}">${m.hp}/${m.maxHp}</div>
                <div class="monster-icon">${m.icon}</div>
            </div>
        `).join("");
    }
}

function updateMonsters(dt) {
    monsters.forEach(m => {
        if (m.hp <= 0) return;

        const mEl = $(`monster-${m.id}`);
        const distToPlayer = Math.hypot(player.x - m.x, player.y - m.y);
        const canAggro = currentMapId !== "town" || (player.x >= BOUNDARY_X - 20);

        if (canAggro && distToPlayer < m.aggroDist) {
            if (distToPlayer < 45) {
                player.hp = Math.max(0, player.hp - m.dmg * dt);
                showFloatText(player.x, player.y - 20, `-${Math.round(m.dmg * dt * 10)}`, "#ff1744");
                updateHUD();
                if (player.hp <= 0) {
                    alert("💀 Yêu thú quá hung bạo! Bạn đã trọng thương và được đưa về thôn dưỡng sức.");
                    switchMap("town", 480, 650);
                    player.hp = player.maxHp * 0.6;
                    updateHUD();
                }
            } else {
                const angle = Math.atan2(player.y - m.y, player.x - m.x);
                let nextX = m.x + Math.cos(angle) * m.speed * dt;
                let nextY = m.y + Math.sin(angle) * m.speed * dt;

                const limitLeft = currentMapId === "town" ? BOUNDARY_X + 20 : 35;
                if (nextX >= limitLeft && canMoveTo(nextX, nextY)) {
                    m.x = nextX;
                    m.y = nextY;
                }
            }
        } else {
            const distToHome = Math.hypot(m.homeX - m.x, m.homeY - m.y);
            if (distToHome > 30) {
                const angle = Math.atan2(m.homeY - m.y, m.homeX - m.x);
                m.x += Math.cos(angle) * (m.speed * 0.5) * dt;
                m.y += Math.sin(angle) * (m.speed * 0.5) * dt;
            }
        }

        if (mEl) {
            mEl.style.left = `${m.x}px`;
            mEl.style.top = `${m.y}px`;
        }
    });
}

function drawMinimap() {
    const cvs = $("minimap-canvas");
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    const scaleX = cvs.width / MAP_LIMIT.w;
    const scaleY = cvs.height / MAP_LIMIT.h;

    ctx.clearRect(0, 0, cvs.width, cvs.height);

    if (currentMapId === "town") {
        ctx.strokeStyle = "rgba(255, 87, 34, 0.7)";
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(BOUNDARY_X * scaleX, 0);
        ctx.lineTo(BOUNDARY_X * scaleX, cvs.height);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "rgba(100, 100, 100, 0.35)";
        COLLISION_BOXES.forEach(b => {
            ctx.fillRect(b.x * scaleX, b.y * scaleY, b.w * scaleX, b.h * scaleY);
        });

        ctx.fillStyle = "rgba(41, 182, 246, 0.7)";
        ctx.fillRect(fishingLake.x * scaleX, fishingLake.y * scaleY, fishingLake.w * scaleX, fishingLake.h * scaleY);

        ctx.fillStyle = "#66bb6a";
        trees.forEach(t => {
            ctx.beginPath();
            ctx.arc(t.x * scaleX, t.y * scaleY, 3.5, 0, Math.PI * 2);
            ctx.fill();
        });

        // NPC
        ctx.fillStyle = "#ffd700";
        ctx.beginPath();
        ctx.arc(merchant.x * scaleX, merchant.y * scaleY, 3.5, 0, Math.PI * 2);
        ctx.arc(elder.x * scaleX, elder.y * scaleY, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#00e676";
        const pt = PORTALS.townToMountain;
        ctx.fillRect(pt.x * scaleX, pt.y * scaleY, pt.w * scaleX, pt.h * scaleY);
    }

    ctx.fillStyle = "#ff5252";
    monsters.forEach(m => {
        if (m.hp > 0) {
            ctx.beginPath();
            ctx.arc(m.x * scaleX, m.y * scaleY, 3.5, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    ctx.fillStyle = "#00e5ff";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(player.x * scaleX, player.y * scaleY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if ($("minimap-coords")) {
        $("minimap-coords").innerText = `[${MAP_DATA[currentMapId].name}] X: ${Math.round(player.x)} | Y: ${Math.round(player.y)}`;
    }
}