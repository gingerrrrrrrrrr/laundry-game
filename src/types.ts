


// 日期
export interface GameDate {
  year: number;
  month: number; // 1-12
  day: number;   // 1-31
}

// 衣服类型
export type ClothType = 'shirt' | 'pants' | 'socks';

// 单件衣服
export interface Cloth {
  type: ClothType;
  weight: number; // 重量（kg）
}

// 订单状态
// export type OrderStatus = 'pending' | 'washing' | 'drying' | 'done';
export type OrderStatus = 'pending' | 'washing' | 'readyToDry' | 'drying' | 'done';

// 顾客订单
export interface Order {
  id: number;
  customerName: string;
  clothes: Cloth[];
  totalWeight: number;
  isUrgent: boolean;
  reward: number; // 报酬
  status: OrderStatus;
}

// 洗衣机
export interface Washer {
  id: number;
  name: string;
  capacity: number; // 最大容量（kg）
  baseWashTime: number; // 新增：基础洗涤时间（秒）
  price: number;          // 新增：购买价格
  owned: boolean;         // 新增：是否已拥有
  currentOrderId: number | null; // 当前处理的订单ID
  remainingTime: number; // 剩余时间（秒）
  level: number;          // 新增：当前等级，默认1
  upgradePrice: number;   // 新增：下次升级价格
}

// 添加晾晒架类型
export interface DryingRack {
  id: number;
  name: string;
  capacity: number; // 可晾晒的重量
  baseDryTime: number;  // 新增：基础晾晒时间
  price: number;        // 新增：购买价格
  owned: boolean;
  level: number;        // 新增：当前等级
  upgradePrice: number; // 新增：升级价格
  currentOrderId: number | null;
  remainingTime: number;
}

// 光标
// export interface Cursor {
//   id: number;
//   emoji: string;      // 🖱️ 👆 ✋
//   x: number;         // 当前位置
//   y: number;
//   targetX: number;   // 目标位置
//   targetY: number;
//   targetId: number;  // 目标元素ID
//   targetType: 'washer' | 'dryingRack' | 'order';
//   orderId?: number;  // 新增：关联的订单ID
//   busy: boolean;
// }

export interface Cursor {
  id: number;
  emoji: string;      // 🖱️ 👆 ✋
  x: number;         // 当前位置 X
  y: number;         // 当前位置 Y
  startX: number;    // 任务起始点 X（订单/待取洗衣机）
  startY: number;    // 任务起始点 Y
  targetX: number;   // 任务目标点 X（空闲洗衣机/晾晒架）
  targetY: number;   // 任务目标点 Y
  startId: number;   // 起始元素ID
  startType: 'order' | 'washer';  // 起始元素类型
  targetId: number;  // 目标元素ID
  targetType: 'washer' | 'dryingRack';
  orderId: number;   // 关联订单ID
  busy: boolean;
  step: 'toStart' | 'toTarget' | 'idle';  // 当前步骤
}
