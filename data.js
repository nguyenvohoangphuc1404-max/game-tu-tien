// Cảnh giới tu tiên - TU VI KHÓ LÊN RẤT NHIỀU
const REALMS = [
    { name: "Phàm Nhân", maxExp: 300, hp: 100, qi: 0, dmg: 8 },
    { name: "Luyện Khí Tầng 1", maxExp: 800, hp: 200, qi: 80, dmg: 22 },
    { name: "Luyện Khí Tầng 3", maxExp: 2000, hp: 450, qi: 200, dmg: 50 },
    { name: "Luyện Khí Tầng 9", maxExp: 6000, hp: 1100, qi: 550, dmg: 120 },
    { name: "Trúc Cơ Sơ Kỳ", maxExp: 20000, hp: 3000, qi: 1500, dmg: 350 }
];

// Trạng thái nhân vật ban đầu
let player = {
    x: 480, y: 650,
    speed: 260,
    realmIdx: 0,
    exp: 0,
    hp: 100, maxHp: 100,
    qi: 0, maxQi: 0,
    baseDmg: 8,
    equippedWeapon: null,
    silver: 15,
    spiritStones: 0,
    facing: "right",
    lastRowPercent: "0%",
    hasRod: false,
    hasAxe: false, // Phải mua Rìu mới chặt được cây
    learnedQiManual: false,
    hasFlyingSwordSkill: false
};

function getPlayerDmg() {
    return (player.baseDmg || 8) + (player.equippedWeapon ? (player.equippedWeapon.dmgBonus || 0) : 0);
}

// Túi đồ ban đầu: Mộc Kiếm cùn có thêm thuộc tính giá bán sellValue
let inventory = [
    { id: "sword_wood", name: "Mộc Kiếm Cùn", icon: "🗡️", type: "weapon", count: 1, dmgBonus: 3, sellValue: 5, desc: "+3 Sát thương khi trang bị" }
];

// Cây Linh Mộc đốn gỗ
let trees = [
    { id: 1, name: "Thiên Niên Linh Mộc", icon: "🌲", x: 380, y: 560, hp: 60, maxHp: 60, respawnTime: 10000 }
];

const MAP_LIMIT = { w: 1920, h: 1080 };
const BOUNDARY_X = 960; 

const COLLISION_BOXES = [
    { x: 0, y: 0, w: 500, h: 320 },
    { x: 0, y: 0, w: 1920, h: 195 },
    { x: 70, y: 780, w: 235, h: 220 }
];

// Vị trí hồ câu & NPC
const fishingLake = { x: 60, y: 760, w: 260, h: 250 };
const merchant = { x: 580, y: 740 };
const elder = { x: 760, y: 550 };

// Quản lý map & cổng chuyển map
let currentMapId = "town";

const PORTALS = {
    townToMountain: {
        x: 1420, y: 180, w: 100, h: 40,
        targetMap: "mountain",
        spawnX: 960, spawnY: 980
    },
    mountainToTown: {
        x: 900, y: 1020, w: 120, h: 60,
        targetMap: "town",
        spawnX: 1460, spawnY: 260
    }
};

// Dữ liệu quái vật
const MAP_DATA = {
    town: {
        name: "Tân Thủ Thôn",
        bg: "Hinhanh/town_map.png",
        monsters: [
            { id: 1, name: "Dã Lang Hung Hãn", icon: "🐺", x: 1150, y: 460, homeX: 1150, homeY: 460, hp: 220, maxHp: 220, dmg: 16, exp: 40, silver: 8, speed: 70, aggroDist: 220 },
            { id: 2, name: "Dã Lang Đầu Đàn", icon: "🐺", x: 1380, y: 650, homeX: 1380, homeY: 650, hp: 450, maxHp: 450, dmg: 26, exp: 90, silver: 20, speed: 85, aggroDist: 240 },
            { id: 3, name: "Bạch Xà Độc", icon: "🐍", x: 1250, y: 820, homeX: 1250, homeY: 820, hp: 320, maxHp: 320, dmg: 22, exp: 65, silver: 15, speed: 65, aggroDist: 200 },
            { id: 4, name: "Hắc Hùng Quái", icon: "🐻", x: 1600, y: 500, homeX: 1600, homeY: 500, hp: 850, maxHp: 850, dmg: 45, exp: 200, silver: 50, speed: 60, aggroDist: 250 },
            { id: 5, name: "Mãn Xà Vương (Boss)", icon: "🐉", x: 1720, y: 780, homeX: 1720, homeY: 780, hp: 2000, maxHp: 2000, dmg: 80, exp: 600, silver: 150, speed: 80, aggroDist: 320 }
        ]
    },
    mountain: {
        name: "Vạn Yêu Sơn (Bản Đồ Mới)",
        bg: "Hinhanh/town_map.png",
        monsters: [
            { id: 101, name: "Xích Diệm Hổ", icon: "🐯", x: 750, y: 580, homeX: 750, homeY: 580, hp: 1500, maxHp: 1500, dmg: 75, exp: 350, silver: 60, speed: 95, aggroDist: 280 },
            { id: 102, name: "Băng Tinh Điêu", icon: "🦅", x: 1250, y: 480, homeX: 1250, homeY: 480, hp: 1800, maxHp: 1800, dmg: 90, exp: 450, silver: 90, speed: 110, aggroDist: 300 },
            { id: 103, name: "Hắc Long Yêu Vương", icon: "🐲", x: 1550, y: 620, homeX: 1550, homeY: 620, hp: 5000, maxHp: 5000, dmg: 160, exp: 2500, silver: 500, speed: 90, aggroDist: 350 }
        ]
    }
};

let monsters = JSON.parse(JSON.stringify(MAP_DATA.town.monsters));

// Cửa hàng Tạp Hóa: Thêm Rìu Đốn Củi
const shopGoods = [
    { id: "axe", name: "Rìu Đốn Củi", icon: "🪓", type: "material", cost: 15, desc: "Dụng cụ dùng để đốn hạ Thiên Niên Linh Mộc" },
    { id: "rod", name: "Cần Câu Trúc", icon: "🎣", type: "material", cost: 15, desc: "Dùng để câu cá đổi lấy Bạc tại hồ nước" },
    { id: "manual", name: "Bí Kíp: Dẫn Khí Quyết", icon: "📜", type: "manual", cost: 80, desc: "Tâm pháp nhập đạo! Tăng tốc độ tu luyện và mở khóa Linh Lực." },
    { id: "sword_iron", name: "Thanh Cương Kiếm", icon: "🗡️", type: "weapon", cost: 120, dmgBonus: 30, desc: "+30 Sát thương khi trang bị! Vũ khí cần thiết để diệt Dã Lang." },
    { id: "sword_gold", name: "Xích Huyết Bảo Kiếm", icon: "⚔️", type: "weapon", cost: 350, dmgBonus: 85, desc: "+85 Sát thương uy lực vô song! Đủ sức chém đứt Mãng Xà." },
    { id: "pill_heal", name: "Hồi Xuân Đan", icon: "💊", type: "material", cost: 20, desc: "Hồi phục 100 điểm Khí Huyết tức thì khi trọng thương." }
];

const $ = id => document.getElementById(id);