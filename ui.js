let currentBagTab = "weapon";

function updateHUD() {
    const curRealm = REALMS[player.realmIdx];
    if ($("ui-realm")) $("ui-realm").innerText = curRealm.name;
    if ($("ui-exp")) $("ui-exp").innerText = player.exp;
    if ($("ui-max-exp")) $("ui-max-exp").innerText = curRealm.maxExp;
    if ($("ui-hp")) $("ui-hp").innerText = Math.round(player.hp);
    if ($("ui-max-hp")) $("ui-max-hp").innerText = player.maxHp;
    if ($("ui-qi")) $("ui-qi").innerText = Math.round(player.qi);
    if ($("ui-max-qi")) $("ui-max-qi").innerText = player.maxQi;
    if ($("ui-silver")) $("ui-silver").innerText = player.silver;
    if ($("ui-stones")) $("ui-stones").innerText = player.spiritStones;
    if ($("player-tag")) $("player-tag").innerText = curRealm.name;

    updateStatusPanel();
}

function updateStatusPanel() {
    const curRealm = REALMS[player.realmIdx];
    if ($("stat-realm")) $("stat-realm").innerText = curRealm.name;
    if ($("stat-hp")) $("stat-hp").innerText = `${Math.round(player.hp)} / ${player.maxHp}`;
    if ($("stat-qi")) $("stat-qi").innerText = `${Math.round(player.qi)} / ${player.maxQi}`;
    if ($("stat-dmg")) $("stat-dmg").innerText = getPlayerDmg();

    const eqName = $("equipped-name");
    const btnUnequip = $("btn-unequip");
    if (eqName && btnUnequip) {
        if (player.equippedWeapon) {
            eqName.innerHTML = `${player.equippedWeapon.icon} <b>${player.equippedWeapon.name}</b> (+${player.equippedWeapon.dmgBonus} TC)`;
            btnUnequip.style.display = "inline-block";
        } else {
            eqName.innerText = "Chưa trang bị";
            btnUnequip.style.display = "none";
        }
    }
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

function addItem(id, name, icon, type, count = 1, extra = {}) {
    const item = inventory.find(i => i.id === id);
    if (item) {
        item.count += count;
    } else {
        inventory.push({ id, name, icon, type, count, ...extra });
    }
    renderInventory();
}

window.switchBagTab = function(tabName) {
    currentBagTab = tabName;
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    const activeBtn = Array.from(document.querySelectorAll(".tab-btn")).find(b => 
        (tabName === 'weapon' && b.innerText.includes('Vũ Khí')) ||
        (tabName === 'material' && b.innerText.includes('Vật Phẩm')) ||
        (tabName === 'manual' && b.innerText.includes('Bí Kíp'))
    );
    if (activeBtn) activeBtn.classList.add("active");
    renderInventory();
};

// Hiển thị danh sách vật phẩm: Có nút Bán / Hủy riêng từng món
function renderInventory() {
    const listEl = $("inventory-list");
    if (!listEl) return;

    const filtered = inventory.filter(i => i.type === currentBagTab);
    if (filtered.length === 0) {
        listEl.innerHTML = `<div style="text-align:center; color:#777; margin-top:40px; font-size:12px;">Chưa có vật phẩm nào ở mục này.</div>`;
        return;
    }

    listEl.innerHTML = filtered.map(item => {
        let actionBtn = "";
        if (item.type === "weapon") {
            const isEquipped = player.equippedWeapon && player.equippedWeapon.id === item.id;
            actionBtn = isEquipped 
                ? `<span style="color:#4df5a8; font-weight:bold; font-size:11px;">[Đang đeo]</span>`
                : `<button class="btn-item-action" onclick="equipWeapon('${item.id}')">Trang bị</button>`;
        } else if (item.type === "material") {
            if (item.id === "pill_heal") {
                actionBtn = `<button class="btn-item-action" onclick="useHealingPill('${item.id}')">Dùng</button>`;
            }
        } else if (item.type === "manual") {
            actionBtn = `<button class="btn-item-action" onclick="readManual('${item.id}')">Lĩnh ngộ</button>`;
        }

        const unitPrice = item.sellValue || (item.dmgBonus ? item.dmgBonus * 2 : 5);
        const isEquippedWeapon = player.equippedWeapon && player.equippedWeapon.id === item.id;
        const sellBtn = isEquippedWeapon 
            ? "" 
            : `<button class="btn-discard" onclick="sellOrDiscardItem('${item.id}', ${unitPrice})" title="Bán món này lấy Bạc">Bán +${unitPrice}🪙</button>`;

        return `
            <div class="inv-item">
                <div class="inv-item-info">
                    <span>${item.icon} <b>${item.name}</b> <span style="color:#8be9fd;">x${item.count}</span></span>
                    <span class="inv-item-desc">${item.desc || ""}</span>
                </div>
                <div class="inv-item-actions">
                    ${actionBtn}
                    ${sellBtn}
                </div>
            </div>
        `;
    }).join("");
}

// Bán / Hủy từng món đồ trong Túi
window.sellOrDiscardItem = function(itemId, unitPrice) {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    item.count--;
    player.silver += unitPrice;
    showFloatText(player.x, player.y - 40, `+${unitPrice} Bạc!`, "#ffd700");

    if (item.id === "axe" && item.count <= 0) player.hasAxe = false;
    if (item.id === "rod" && item.count <= 0) player.hasRod = false;

    if (item.count <= 0) {
        inventory = inventory.filter(i => i.id !== itemId);
    }

    updateHUD();
    renderInventory();
};

window.equipWeapon = function(itemId) {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    player.equippedWeapon = {
        id: item.id,
        name: item.name,
        icon: item.icon,
        dmgBonus: item.dmgBonus || 10
    };

    showFloatText(player.x, player.y - 45, `Đã trang bị: ${item.name}!`, "#4df5a8");
    updateHUD();
    renderInventory();
};

window.unequipWeapon = function() {
    if (!player.equippedWeapon) return;
    showFloatText(player.x, player.y - 45, `Đã tháo: ${player.equippedWeapon.name}!`, "#ffca28");
    player.equippedWeapon = null;
    updateHUD();
    renderInventory();
};

window.useHealingPill = function(itemId) {
    const item = inventory.find(i => i.id === itemId);
    if (!item || item.count <= 0) return;

    if (player.hp >= player.maxHp) {
        alert("Khí huyết tràn đầy, không cần dùng đan dược!");
        return;
    }

    item.count--;
    player.hp = Math.min(player.maxHp, player.hp + 100);
    showFloatText(player.x, player.y - 45, "+100 Khí Huyết!", "#4caf50");

    if (item.count <= 0) {
        inventory = inventory.filter(i => i.id !== itemId);
    }

    updateHUD();
    renderInventory();
};

window.readManual = function(itemId) {
    if (itemId === "manual") {
        if (player.learnedQiManual) return alert("Bạn đã sớm thấu triệt Dẫn Khí Quyết rồi!");
        player.learnedQiManual = true;
        showFloatText(player.x, player.y - 50, "Đã ngộ Dẫn Khí Quyết!", "#00e5ff");
        alert("🎉 Đã lĩnh ngộ 【Dẫn Khí Quyết】! Từ giờ có thể nhấn 'Bế Quan Tu Luyện' để nạp linh khí tăng tu vi.");
    } else if (itemId === "manual_sword") {
        if (player.hasFlyingSwordSkill) return alert("Bạn đã học được Ngự Kiếm Thuật rồi!");
        player.hasFlyingSwordSkill = true;
        showFloatText(player.x, player.y - 50, "Ngộ: Ngự Kiếm Thuật (Q)!", "#00e5ff");
        alert("🎉 Đã lĩnh ngộ 【Thanh Phong Phi Kiếm Quyết】! Nhấn phím Q để phóng kiếm tiêu diệt yêu thú từ xa.");
    }
    updateHUD();
    renderInventory();
};

// HỘI THOẠI TRƯỞNG LÀNG
window.talkToElder = function() {
    const dlg = $("dialogue-modal");
    if (!dlg) return;
    dlg.style.display = "flex";
    
    const curRealm = REALMS[player.realmIdx].name;
    const txt = $("dialogue-text");
    const actions = $("dialogue-actions");

    if (player.realmIdx === 0) {
        txt.innerHTML = `Chào đạo hữu trẻ tuổi! Ngươi hiện tại chỉ là <b>【Phàm Nhân】</b> chân yếu tay mềm.<br>
        Rừng bên phải đầy rẫy <b>Dã Lang hung dữ</b>, chạm vào là mất mạng!<br>
        Hãy mua <b>Rìu Đốn Củi</b> từ <b>Thương Lão Gia</b> để chặt Linh Mộc 🌲 hoặc câu cá 🐟, đem bán gom bạc mua <b>Dẫn Khí Quyết</b> và <b>Thanh Cương Kiếm</b> mới có thể đối phó chúng!`;
        actions.innerHTML = `<button class="btn-dialogue-ok" onclick="closeDialogue()">Đã rõ lời Trưởng Làng</button>`;
    } else if (player.realmIdx >= 1 && !player.hasFlyingSwordSkill) {
        txt.innerHTML = `Khá lắm! Ngươi đã bước vào <b>【${curRealm}】</b>.<br>
        Lão phu thấy ngươi cốt cách kinh kỳ, xin tặng ngươi bảo vật gia truyền thôn trang: <b>【Bí Kíp: Ngự Kiếm Thuật】</b>!<br>
        Hãy mở túi đồ (B) mục Bí Kíp để Lĩnh Ngộ và bấm phím Q để phóng kiếm diệt yêu thú!`;
        actions.innerHTML = `
            <button class="btn-dialogue-ok" onclick="receiveSwordManual()">🎁 Bái tạ nhận Bí Kíp</button>
        `;
    } else {
        txt.innerHTML = `Ngươi đã là cao thủ <b>【${curRealm}】</b> nức tiếng thôn trang!<br>
        Con đường mòn phía bắc dẫn sang <b>Vạn Yêu Sơn</b> đã mở rộng cho ngươi. Hãy tiến lên trừ yêu diệt ma bảo vệ bình yên cho bá tánh!`;
        actions.innerHTML = `<button class="btn-dialogue-ok" onclick="closeDialogue()">Lên đường xuất phát</button>`;
    }
};

window.receiveSwordManual = function() {
    addItem("manual_sword", "Bí Kíp: Ngự Kiếm Thuật", "📜", "manual", 1, { sellValue: 50, desc: "Phóng phi kiếm từ xa tiêu hao Linh lực (Phím Q)" });
    showFloatText(player.x, player.y - 45, "+1 Bí Kíp Ngự Kiếm Thuật!", "#ffd700");
    closeDialogue();
    alert("Đã nhận được Bí Kíp! Hãy mở Trữ Vật Nang (B) -> mục Bí Kíp để bấm 'Lĩnh ngộ'.");
};

window.closeDialogue = function() {
    const dlg = $("dialogue-modal");
    if (dlg) dlg.style.display = "none";
};

window.toggleBag = function() {
    const modal = $("bag-modal");
    modal.style.display = modal.style.display === "flex" ? "none" : "flex";
    if (modal.style.display === "flex") {
        updateStatusPanel();
        renderInventory();
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
    if (g.id === "axe") {
        player.hasAxe = true;
        addItem("axe", g.name, g.icon, "material", 1, { sellValue: 8, desc: "Rìu chặt cây Linh Mộc" });
        alert("Đã nhận Rìu Đốn Củi! Giờ bạn có thể lại gần cây 🌲 nhấn chuột trái để chặt củi.");
    } else if (g.id === "rod") {
        player.hasRod = true;
        addItem("rod", g.name, g.icon, "material", 1, { sellValue: 8, desc: "Cần câu trúc tại hồ nước" });
        alert("Đã nhận Cần Câu! Ra bờ hồ nhấn E để câu.");
    } else if (g.id === "manual") {
        addItem("manual", g.name, g.icon, "manual", 1, { sellValue: 40, desc: "Tâm pháp dẫn khí nhập đạo" });
        alert("Đã mua Dẫn Khí Quyết! Hãy mở túi đồ (B) mục Bí Kíp để Lĩnh Ngộ.");
    } else if (g.id === "sword_iron") {
        addItem("sword_iron", g.name, g.icon, "weapon", 1, { dmgBonus: 30, sellValue: 60, desc: "+30 Lực công kích" });
        alert("Đã mua Thanh Cương Kiếm! Vào túi đồ (B) để bấm 'Trang bị'.");
    } else if (g.id === "sword_gold") {
        addItem("sword_gold", g.name, g.icon, "weapon", 1, { dmgBonus: 85, sellValue: 175, desc: "+85 Lực công kích cực mạnh" });
        alert("Đã mua Xích Huyết Bảo Kiếm! Vào túi đồ (B) để bấm 'Trang bị'.");
    } else if (g.id === "pill_heal") {
        addItem("pill_heal", g.name, g.icon, "material", 1, { sellValue: 10, desc: "Hồi phục 100 Khí Huyết khi dùng" });
        showFloatText(player.x, player.y - 45, "+1 Hồi Xuân Đan", "#4caf50");
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
        if (item.id === "spirit_wood") {
            earned += item.count * 10;
            return false;
        }
        return true;
    });

    if (earned > 0) {
        player.silver += earned;
        showFloatText(player.x, player.y - 40, `+${earned} Bạc!`, "#ffd700");
        updateHUD();
        renderInventory();
        alert(`Đã bán toàn bộ Cá & Gỗ thu thập được, nhận về ${earned} Bạc!`);
    } else {
        alert("Trong túi không còn tài nguyên (Cá/Gỗ) để bán!");
    }
};