let projectiles = [];

// Tu luyện bế quan thổ nạp - Tăng chậm tu vi (+4 tu vi mỗi lần)
window.meditate = function() {
    if (!player.learnedQiManual && player.realmIdx === 0) {
        alert("Bạn là phàm nhân chưa hiểu kinh mạch! Hãy gom Bạc mua 'Dẫn Khí Quyết' từ Thương Lão Gia và vào túi đồ (B) để Lĩnh Ngộ.");
        return;
    }

    player.exp += 4;
    player.hp = Math.min(player.maxHp, player.hp + 25);
    player.qi = Math.min(player.maxQi, player.qi + 20);
    showFloatText(player.x, player.y - 55, "Thổ nạp... +4 Tu Vi", "#00e5ff");
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
        player.baseDmg = nextRealm.dmg;

        alert(`🎉 THIÊN ĐỊA DỊ TƯỢNG!\nĐột phá cảnh giới thành công: 【${nextRealm.name}】!`);
        showFloatText(player.x, player.y - 75, `ĐỘT PHÁ: ${nextRealm.name}!`, "#ffd700");
    }
}

// Đốn gỗ: Bắt buộc phải có Rìu Đốn Củi (🪓)
function chopTree() {
    let hitTree = false;
    trees.forEach(t => {
        if (t.hp > 0 && Math.hypot(player.x - t.x, player.y - t.y) < 95) {
            hitTree = true;

            // Kiểm tra sở hữu Rìu
            if (!player.hasAxe) {
                showFloatText(player.x, player.y - 40, "Cần có Rìu Đốn Củi (🪓)!", "#ffca28");
                return;
            }

            const dmg = getPlayerDmg();
            t.hp -= dmg;
            showFloatText(t.x, t.y - 40, `-${dmg} (Cốp!)`, "#8d6e63");

            const hpEl = $(`thp-${t.id}`);
            if (hpEl) hpEl.innerText = `${Math.max(0, t.hp)}/${t.maxHp}`;

            if (t.hp <= 0) {
                const woodCount = Math.floor(Math.random() * 2) + 2;
                addItem("spirit_wood", "Gỗ Linh Sam", "🪵", "material", woodCount, { sellValue: 10, desc: "Gỗ quý, bán được 10 Bạc" });
                
                let expGainedText = "";
                if (Math.random() < 0.2) {
                    const bonusExp = Math.floor(Math.random() * 2) + 1;
                    player.exp += bonusExp;
                    expGainedText = ` (+${bonusExp} Tu Vi)`;
                    checkBreakthrough();
                }

                showFloatText(t.x, t.y - 60, `+${woodCount} Gỗ${expGainedText}`, "#4caf50");
                
                $(`tree-${t.id}`).style.opacity = "0.3";
                updateHUD();

                setTimeout(() => {
                    t.hp = t.maxHp;
                    $(`tree-${t.id}`).style.opacity = "1";
                    if ($(`thp-${t.id}`)) $(`thp-${t.id}`).innerText = `${t.hp}/${t.maxHp}`;
                    showFloatText(t.x, t.y - 40, "Cây đã hồi sinh!", "#81c784");
                }, t.respawnTime);
            }
        }
    });
    return hitTree;
}

// Đánh cận chiến: Sát thương phụ thuộc vào vũ khí
function attackMelee() {
    let hitMonster = false;
    const totalDmg = getPlayerDmg();

    monsters.forEach(m => {
        if (m.hp > 0 && Math.hypot(player.x - m.x, player.y - m.y) < 100) {
            hitMonster = true;
            m.hp -= totalDmg;
            showFloatText(m.x, m.y - 30, `-${totalDmg}`, "#ff5252");
            const hpEl = $(`mhp-${m.id}`);
            if (hpEl) hpEl.innerText = `${Math.max(0, m.hp)}/${m.maxHp}`;

            if (m.hp <= 0) {
                player.exp += m.exp;
                player.silver += m.silver;
                showFloatText(m.x, m.y - 50, `Diệt quái! +${m.silver} Bạc, +${m.exp} Tu Vi`, "#ffd700");
                $(`monster-${m.id}`).style.display = "none";
                checkBreakthrough();
                updateHUD();

                setTimeout(() => {
                    m.hp = m.maxHp;
                    m.x = m.homeX;
                    m.y = m.homeY;
                    $(`monster-${m.id}`).style.display = "block";
                    $(`mhp-${m.id}`).innerText = `${m.hp}/${m.maxHp}`;
                }, 10000);
            }
        }
    });

    if (!hitMonster) {
        const hitTree = chopTree();
        if (!hitTree) {
            showFloatText(player.x + (player.facing === "right" ? 40 : -40), player.y - 25, "Vút!", "#8be9fd");
        }
    }
}

// Phóng Phi kiếm (Cần bí tịch Ngự Kiếm Thuật và Linh Lực)
function castFlyingSword() {
    if (!player.hasFlyingSwordSkill) {
        showFloatText(player.x, player.y - 45, "Chưa học được Ngự Kiếm Thuật! (Hãy tìm Trưởng Làng)", "#aaa");
        return;
    }
    if (player.qi < 20) {
        showFloatText(player.x, player.y - 45, "Linh lực cạn kiệt! Hãy bế quan hồi khí.", "#e91e63");
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
        y: player.y - 40,
        vx: 600 * dir,
        dmg: Math.round(getPlayerDmg() * 2.5),
        el
    });
}

function updateProjectiles(dt) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.x += p.vx * dt;
        p.el.style.left = `${p.x}px`;
        p.el.style.top = `${p.y}px`;

        const hit = monsters.find(m => m.hp > 0 && Math.hypot(p.x - m.x, p.y - m.y) < 40);
        if (hit) {
            hit.hp -= p.dmg;
            showFloatText(hit.x, hit.y - 35, `BẠO KÍCH! -${p.dmg}`, "#00e5ff");
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

        if (Math.abs(p.x - player.x) > 850 || p.x < 0 || p.x > MAP_LIMIT.w) {
            p.el.remove();
            projectiles.splice(i, 1);
        }
    }
}

// Câu cá: Kiếm cá đem bán, chỉ thỉnh thoảng mới được 1 - 2 tu vi
function startFishing() {
    const inLakeX = player.x >= fishingLake.x - 50 && player.x <= fishingLake.x + fishingLake.w + 50;
    const inLakeY = player.y >= fishingLake.y - 50 && player.y <= fishingLake.y + fishingLake.h + 50;

    if (!inLakeX || !inLakeY) {
        showFloatText(player.x, player.y - 50, "Hãy đứng sát mép hồ nước Thanh Thủy Đàm!", "#aaa");
        return;
    }

    if (!player.hasRod) {
        alert("Bạn chưa có Cần Câu Trúc! Hãy lại tìm Thương Lão Gia mua với giá 15 Bạc.");
        return;
    }

    showFloatText(player.x, player.y - 55, "Đang thả câu tĩnh tâm...", "#29b6f6");

    setTimeout(() => {
        const isSpiritFish = Math.random() < 0.2;
        let expBonus = 0;
        
        if (Math.random() < 0.15) {
            expBonus = Math.floor(Math.random() * 2) + 1;
            player.exp += expBonus;
            checkBreakthrough();
        }

        const expText = expBonus > 0 ? ` (+${expBonus} Tu Vi)` : "";

        if (isSpiritFish) {
            addItem("spirit_fish", "Kim Quy Linh Ngư", "🐟", "material", 1, { sellValue: 30, desc: "Linh ngư quý hiếm, bán được 30 Bạc" });
            showFloatText(player.x, player.y - 65, `+1 Linh Ngư!${expText}`, "#00e5ff");
        } else {
            addItem("fish", "Cá Chép Thôn Dã", "🐟", "material", 1, { sellValue: 6, desc: "Cá thường, bán được 6 Bạc" });
            showFloatText(player.x, player.y - 65, `+1 Cá Chép!${expText}`, "#fff");
        }
        updateHUD();
    }, 1000);
}