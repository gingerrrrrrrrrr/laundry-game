import React, { useState, useEffect, useRef } from "react";
import {
  Order,
  Washer,
  ClothType,
  OrderStatus,
  GameDate,
  Cloth,
  DryingRack,
  Cursor,
} from "./types";

function App() {
  // 游戏状态
  const [money, setMoney] = useState(5000);
  const [date, setDate] = useState<GameDate>({ year: 2026, month: 1, day: 1 });
  const [orders, setOrders] = useState<Order[]>([]);
  const [washers, setWashers] = useState<Washer[]>([
    {
      id: 1,
      name: "🌀 小旋风",
      capacity: 5,
      baseWashTime: 10,
      price: 0,
      owned: true,
      currentOrderId: null,
      remainingTime: 0,
      level: 1,
      upgradePrice: 100,
    },
    {
      id: 2,
      name: "🐘 大象",
      capacity: 8,
      baseWashTime: 10,
      price: 300,
      owned: true,
      currentOrderId: null,
      remainingTime: 0,
      level: 1,
      upgradePrice: 300,
    },
    {
      id: 3,
      name: "🌪️ 龙卷风",
      capacity: 12,
      baseWashTime: 10,
      price: 600,
      owned: false,
      currentOrderId: null,
      remainingTime: 0,
      level: 1,
      upgradePrice: 600,
    },
    {
      id: 4,
      name: "🔥 火火火",
      capacity: 10,
      baseWashTime: 10,
      price: 800,
      owned: false,
      currentOrderId: null,
      remainingTime: 0,
      level: 1,
      upgradePrice: 800,
    },
    {
      id: 5,
      name: "✨ 低调奢华",
      capacity: 15,
      baseWashTime: 10,
      price: 1200,
      owned: false,
      currentOrderId: null,
      remainingTime: 0,
      level: 1,
      upgradePrice: 1200,
    },
  ]);
  const [dryingRacks, setDryingRacks] = useState<DryingRack[]>([
    {
      id: 1,
      name: "🌞 阳光晾衣架",
      capacity: 10,
      baseDryTime: 15,
      price: 0,
      owned: true,
      currentOrderId: null,
      remainingTime: 0,
      level: 1,
      upgradePrice: 50,
    },
    // { id: 2, name: '🏠 室内晾衣架', capacity: 8, currentOrderId: null, remainingTime: 0 },
  ]);
  const cursorsRef = useRef<Cursor[]>([
    {
      id: 1,
      emoji: "👆",
      x: 50,
      y: 50,
      startX: 0,
      startY: 0,
      targetX: 0,
      targetY: 0,
      startId: 0,
      startType: "order",
      targetId: 0,
      targetType: "washer",
      orderId: 0,
      busy: false,
      step: "idle",
    },
    {
      id: 2,
      emoji: "🖱️",
      x: 100,
      y: 100,
      startX: 0,
      startY: 0,
      targetX: 0,
      targetY: 0,
      startId: 0,
      startType: "order",
      targetId: 0,
      targetType: "washer",
      orderId: 0,
      busy: false,
      step: "idle",
    },
  ]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedWasherId, setSelectedWasherId] = useState<number | null>(null);
  const ordersRef = useRef(orders);
  const washersRef = useRef(washers);
  const dryingRacksRef = useRef(dryingRacks);
  const cursorRef = useRef<(HTMLDivElement | null)[]>([]);
  const startDotRef = useRef<HTMLDivElement>(null);
  const targetDotRef = useRef<HTMLDivElement>(null);
  const reservations = useRef<Set<string>>(new Set());
  const isCursorClicking = useRef(-1);
  const lineRef = useRef<SVGLineElement>(null);
  const renderCount = useRef(0);

  renderCount.current++;
  console.log("渲染次数:", renderCount.current);
  // 当状态更新时，同步到ref
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);
  useEffect(() => {
    washersRef.current = washers;
  }, [washers]);
  useEffect(() => {
    dryingRacksRef.current = dryingRacks;
  }, [dryingRacks]);

  // 生成随机订单
  const generateOrder = (): Order => {
    const names = ["👨 张三", "👩 李四", "👴 王五", "👵 赵六", "👦 小明"];
    const clothTypes: ClothType[] = ["shirt", "pants", "socks"];

    // 随机生成1-5件衣服
    const clothesCount = Math.floor(Math.random() * 5) + 1;
    const clothes: Cloth[] = [];
    let totalWeight = 0;

    for (let i = 0; i < clothesCount; i++) {
      const type = clothTypes[Math.floor(Math.random() * clothTypes.length)];
      const weight = type === "shirt" ? 0.3 : type === "pants" ? 0.5 : 0.1; // 不同衣物重量不同
      clothes.push({ type, weight });
      totalWeight += weight;
    }

    const isUrgent = Math.random() > 0.7; // 30%概率是加急订单
    const baseReward = Math.round(totalWeight * 10); // 基础报酬：10元/kg
    const reward = isUrgent ? baseReward * 2 : baseReward;

    return {
      id: Date.now() + Math.random(),
      customerName: names[Math.floor(Math.random() * names.length)],
      clothes,
      totalWeight: parseFloat(totalWeight.toFixed(2)),
      isUrgent,
      reward,
      status: "pending",
    };
  };

  // 开始新的一天
  const startNewDay = () => {
    setDate((prevDate) => {
      let newYear = prevDate.year;
      let newMonth = prevDate.month;
      let newDay = prevDate.day + 1;

      // 简单月份处理（不考虑不同月份天数）
      if (newDay > 31) {
        newDay = 1;
        newMonth += 1;
        if (newMonth > 12) {
          newMonth = 1;
          newYear += 1;
        }
      }

      return { year: newYear, month: newMonth, day: newDay };
    });

    // 生成1-3个新订单
    const newOrdersCount = Math.floor(Math.random() * 3) + 1;
    const newOrders: Order[] = [];

    for (let i = 0; i < newOrdersCount; i++) {
      newOrders.push(generateOrder());
    }
    setOrders([...orders, ...newOrders]);
  };

  // 购买洗衣机
  const buyNextWasher = () => {
    // 找到第一个未拥有的洗衣机
    const nextWasher = washers.find((w) => !w.owned);
    if (!nextWasher) {
      alert("所有洗衣机都已购买！");
      return;
    }
    if (money < nextWasher.price) {
      alert("资金不足！");
      return;
    }

    // 扣钱
    setMoney(money - nextWasher.price);

    // 更新洗衣机为已拥有
    setWashers(
      washers.map((w) => (w.id === nextWasher.id ? { ...w, owned: true } : w)),
    );
  };

  // 购买晾晒架
  const buyNewDryingRack = () => {
    const nextId = Math.max(...dryingRacks.map((r) => r.id)) + 1;
    const basePrice = 100;
    const price =
      basePrice * Math.pow(2, dryingRacks.filter((r) => r.owned).length - 1); // 价格翻倍
    const upgradePrice =
      basePrice * Math.pow(2, dryingRacks.filter((r) => r.owned).length - 1); // 升级价格翻倍

    if (money < price) {
      alert("资金不足！");
      return;
    }

    const newRack: DryingRack = {
      id: nextId,
      name: `🌞阳光晾衣架`,
      capacity: 10,
      baseDryTime: 15,
      price: price,
      owned: true,
      level: 1,
      upgradePrice: upgradePrice,
      currentOrderId: null,
      remainingTime: 0,
    };

    setMoney(money - price);
    setDryingRacks([...dryingRacks, newRack]);
  };

  // 洗衣机外观
  const getWasherStyle = (washer: Washer) => {
    const order = orders.find((o) => o.id === washer.currentOrderId);
    const isReadyToDry = order?.status === "readyToDry";
    const isWashing = washer.currentOrderId && !isReadyToDry;
    const isSelectedWasher = selectedWasherId === washer.id; // 新增

    return {
      backgroundColor: isSelectedWasher
        ? "rgba(0,0,0,0.1)" // 选中状态：更深的灰
        : isReadyToDry
          ? "rgba(255, 238, 155, 0.43)" // 提示可提取
          : isWashing
            ? "rgba(0,0,0,0.1)" // 洗涤中：灰
            : "white", // 空闲
      boxShadow: isSelectedWasher
        ? "0 1px 3px rgba(0,0,0,0.1)" // 选中时阴影更深
        : isReadyToDry
          ? "0 3px 8px rgba(0,0,0,0.25)"
          : "0 1px 3px rgba(0,0,0,0.1)",
      cursor: isWashing ? "not-allowed" : "pointer",
    };
  };

  // 洗衣机升级
  const upgradeWasher = (washerId: number) => {
    const washer = washers.find((w) => w.id === washerId);
    if (!washer || washer.level >= 5 || money < washer.upgradePrice) return;

    setMoney(money - washer.upgradePrice);
    setWashers(
      washers.map((w) =>
        w.id === washerId
          ? {
              ...w,
              level: w.level + 1,
              capacity: w.capacity * 2,
              baseWashTime: Math.max(1, Math.floor(w.baseWashTime / 2)), // 时间减半，最低2秒
              upgradePrice: w.upgradePrice * 2,
            }
          : w,
      ),
    );
  };

  // 晾晒架升级
  const upgradeDryingRack = (rackId: number) => {
    const rack = dryingRacks.find((r) => r.id === rackId);
    if (!rack || rack.level >= 5 || money < rack.upgradePrice) return;

    const levelNames = [
      "🌞阳光晾衣架",
      "🌞室内晾衣架",
      "🌞电扇晾衣架",
      "🌞烘干机",
      "🌞高级烘干机",
    ];

    setMoney(money - rack.upgradePrice);
    setDryingRacks(
      dryingRacks.map((r) =>
        r.id === rackId
          ? {
              ...r,
              level: r.level + 1,
              name: levelNames[r.level], // 升级后改名
              // name: `⚡ ${levelNames[r.level]} Lv.${r.level + 1}`, // 升级后改名
              baseDryTime: Math.max(1, Math.floor(r.baseDryTime / 2)), // 时间减半取整
              upgradePrice: r.upgradePrice * 2,
            }
          : r,
      ),
    );
  };

  // 分配订单到洗衣机
  const assignToWasher = (orderId: number, washerId: number) => {
    const order = orders.find((o) => o.id === orderId);
    const washer = washers.find((w) => w.id === washerId);

    if (
      !order ||
      !washer ||
      washer.currentOrderId !== null ||
      order.status !== "pending"
    ) {
      return;
    }

    // 检查重量是否超限
    if (order.totalWeight > washer.capacity) {
      alert("衣物太重，这台洗衣机洗不动！");
      return;
    }

    // 更新订单状态
    const updatedOrders = orders.map((o) =>
      o.id === orderId ? { ...o, status: "washing" as OrderStatus } : o,
    );

    // 更新洗衣机状态
    const updatedWashers = washers.map((w) =>
      w.id === washerId
        ? {
            ...w,
            currentOrderId: orderId,
            // remainingTime: 10 // 10秒洗一件（实际游戏可以更长）
            remainingTime: w.baseWashTime, // 使用当前等级的基础时间
          }
        : w,
    );

    setOrders(updatedOrders);
    setWashers(updatedWashers);
  };

  // 分配订单到晾晒架
  const assignToDryingRack = (orderId: number, rackId: number) => {
    const order = orders.find((o) => o.id === orderId);
    const rack = dryingRacks.find((r) => r.id === rackId);

    if (
      !order ||
      !rack ||
      rack.currentOrderId !== null ||
      order.status !== "readyToDry"
    ) {
      return;
    }

    // 检查重量是否超限
    if (order.totalWeight > rack.capacity) {
      alert("衣物太重，这个晾晒架挂不下！");
      return;
    }

    // 更新订单状态 感觉放到更新晾晒架状态后面更好
    const updatedOrders = orders.map((o) =>
      o.id === orderId ? { ...o, status: "drying" as OrderStatus } : o,
    );

    // 更新晾晒架状态
    const updatedRacks = dryingRacks.map((r) =>
      r.id === rackId
        ? {
            ...r,
            currentOrderId: orderId,
            // remainingTime: 15 // 15秒晾晒时间
            remainingTime: rack.baseDryTime, // 使用当前等级的基础时间
          }
        : r,
    );

    // 清空洗衣机（现在真正清空）
    const updatedWashers = washers.map((w) =>
      w.currentOrderId === orderId ? { ...w, currentOrderId: null } : w,
    );

    setOrders(updatedOrders);
    setDryingRacks(updatedRacks);
    setWashers(updatedWashers);
    setSelectedOrderId(null);
    setSelectedWasherId(null);
  };

  // 洗衣机晾晒架倒计时
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("倒计时开始");
      setWashers((prevWashers) => {
        const updated = prevWashers.map((washer) => {
          if (washer.currentOrderId && washer.remainingTime > 0) {
            return { ...washer, remainingTime: washer.remainingTime - 1 };
          }
          return washer;
        });

        updated.forEach(
          (washer) => {
            if (washer.currentOrderId && washer.remainingTime === 0) {
              // 洗涤完成，改为 readyToDry 状态
              setOrders((prevOrders) =>
                prevOrders.map((order) =>
                  order.id === washer.currentOrderId
                    ? { ...order, status: "readyToDry" as OrderStatus }
                    : order,
                ),
              );
            }
          }, //新的洗衣逻辑结束，前往晾晒
        );

        return updated;
      });
      console.log("洗衣机更新完");

      // 晾晒架倒计时
      setDryingRacks((prevRacks) => {
        const updated = prevRacks.map((rack) => {
          if (rack.currentOrderId && rack.remainingTime > 0) {
            return { ...rack, remainingTime: rack.remainingTime - 1 };
          }
          return rack;
        });

        // 检查哪些晾晒架完成了
        updated.forEach((rack) => {
          if (rack.currentOrderId && rack.remainingTime === 0) {
            // 完成订单
            setOrders((prevOrders) =>
              prevOrders.map((order) =>
                order.id === rack.currentOrderId
                  ? { ...order, status: "done" as OrderStatus }
                  : order,
              ),
            );

            // 给钱
            const finishedOrder = orders.find(
              (o) => o.id === rack.currentOrderId,
            );
            if (finishedOrder) {
              setMoney((prev) => prev + finishedOrder.reward);
            }

            // 清空晾晒架
            rack.currentOrderId = null;
          }
        });

        return updated;
      }); //晾晒架倒计时结束
      console.log("晾晒架更新完");
    }, 1000); // 每秒更新一次

    return () => clearInterval(interval);
  }, [orders]);

  // 计算统计数据
  const pendingOrders = orders.filter((o) => o.status === "pending");
  const activeOrders = orders.filter((o) => o.status === "washing");

  //计算光标的目标的函数
  const getElementCenter = (type: string, id: number) => {
    const element = document.querySelector(
      `[data-target-type="${type}"][data-target-id="${id}"]`,
    ) as HTMLElement | null;
    if (!element) return { x: 0, y: 0 };

    const rect = element.getBoundingClientRect();

    // 找到定位祖先（那个 position: relative 的容器）
    const container = document.querySelector("#root > div") as HTMLElement;
    const containerRect = container?.getBoundingClientRect() || {
      left: 0,
      top: 0,
    };
    return {
      x: rect.left + rect.width / 2 - containerRect.left,
      y: rect.top + rect.height / 2 - containerRect.top,
    };
  };

  // 每帧更新光标位置
  const updateCursors = () => {
    // 遍历每一个光标
    cursorsRef.current.forEach((cursor, index) => {
      // 空闲状态：找新任务
      if (!cursor.busy) {
        findNextTask(index); // 传入当前光标的索引
        return;
      }

      // 繁忙状态：根据当前步骤移动
      const speed = 3;
      let targetX, targetY;

      if (cursor.step === "toStart") {
        targetX = cursor.startX;
        targetY = cursor.startY;
      } else if (cursor.step === "toTarget") {
        targetX = cursor.targetX;
        targetY = cursor.targetY;
      } else {
        return;
      }

      const dx = targetX - cursor.x;
      const dy = targetY - cursor.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 5) {
        // 到达目标，执行点击
        if (cursor.step === "toStart") {
          // 点击起始点
          const element = document.querySelector(
            `[data-target-type="${cursor.startType}"][data-target-id="${cursor.startId}"]`,
          ) as HTMLElement | null;
          // element?.click();
          // 点击之前，先标记一下“这是光标在点”
          // 可以用一个全局变量，或者给元素加个临时属性
          // 简单做法：在点击之前设置一个标志
          isCursorClicking.current = index;
          element?.click();
          isCursorClicking.current = -1;

          // 正常继续：切换到向目标点移动
          cursorsRef.current[index] = {
            ...cursor,
            step: "toTarget",
            x: targetX,
            y: targetY,
          };
          // 移动光标位置（DOM）
          if (cursorRef.current?.[index]?.style) {
            cursorRef.current![index]!.style.left = targetX + "px";
            cursorRef.current![index]!.style.top = targetY + "px";
          }
          return;
        } else if (cursor.step === "toTarget") {
          // 点击目标点
          const element = document.querySelector(
            `[data-target-type="${cursor.targetType}"][data-target-id="${cursor.targetId}"]`,
          ) as HTMLElement | null;
          // element?.click();
          isCursorClicking.current = index;
          console.log("🎯 光标完成任务，开始 setState");
          element?.click();
          isCursorClicking.current = -1;

          // 释放这个光标占用的所有预定
          // 需要知道它之前预定了哪些资源
          // 可以从 cursor 里拿到 startId, startType, targetId, targetType

          reservations.current.delete(`${cursor.startType}-${cursor.startId}`);
          reservations.current.delete(
            `${cursor.targetType}-${cursor.targetId}`,
          );

          // 任务完成，这个光标变空闲
          cursorsRef.current[index] = {
            ...cursor,
            busy: false,
            step: "idle",
            x: targetX,
            y: targetY,
          };
          if (cursorRef.current?.[index]?.style) {
            cursorRef.current![index]!.style.left = targetX + "px";
            cursorRef.current![index]!.style.top = targetY + "px";
          }
        }
        return;
      }

      // 继续移动
      const newX = cursor.x + (dx / distance) * speed;
      const newY = cursor.y + (dy / distance) * speed;

      // 更新这个光标的位置
      cursorsRef.current[index] = {
        ...cursor,
        x: newX,
        y: newY,
      };
      // 移动 DOM 中的光标
      if (cursorRef.current?.[index]?.style) {
        cursorRef.current![index]!.style.left = newX + "px";
        cursorRef.current![index]!.style.top = newY + "px";
      }
    });
  };

  // 用 requestAnimationFrame
  useEffect(() => {
    let animationId: number;

    const animate = () => {
      updateCursors();
      animationId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationId);
  }, []);

  //释放冲突光标
  const cancelConflictingCursors = (
    resourceId: string,
    currentCursorIndex?: number,
  ) => {
    cursorsRef.current.forEach((cursor, index) => {
      // 如果是当前光标自己，就不取消
      if (index === currentCursorIndex) return;
      // 检查这个光标是否涉及这个资源
      const startResourceId = `${cursor.startType}-${cursor.startId}`;
      const targetResourceId = `${cursor.targetType}-${cursor.targetId}`;

      if (
        cursor.busy &&
        (startResourceId === resourceId || targetResourceId === resourceId)
      ) {
        // 释放预定
        reservations.current.delete(startResourceId);
        reservations.current.delete(targetResourceId);
        // 取消这个光标的任务
        cursorsRef.current[index] = {
          ...cursor,
          busy: false,
          step: "idle",
        };
      }
    });
  };

  // 光标任务优先分配逻辑
  const findNextTask = (cursorIndex: number) => {
    // 任务1：分配洗衣机（订单 → 洗衣机）
    const pendingOrders = ordersRef.current.filter(
      (o) =>
        o.status === "pending" && !reservations.current.has(`order-${o.id}`),
    );

    const freeWashers = washersRef.current.filter(
      (w) =>
        w.owned &&
        !w.currentOrderId &&
        !reservations.current.has(`washer-${w.id}`),
    );

    for (const order of pendingOrders) {
      for (const washer of freeWashers) {
        if (order.totalWeight <= washer.capacity) {
          // 预定订单和洗衣机
          reservations.current.add(`order-${order.id}`);
          reservations.current.add(`washer-${washer.id}`);
          const startCenter = getElementCenter("order", order.id);
          const targetCenter = getElementCenter("washer", washer.id);

          // 1. 更新 cursorState
          cursorsRef.current[cursorIndex] = {
            ...cursorsRef.current[cursorIndex],
            startX: startCenter.x,
            startY: startCenter.y,
            targetX: targetCenter.x,
            targetY: targetCenter.y,
            startId: order.id,
            startType: "order",
            targetId: washer.id,
            targetType: "washer",
            orderId: order.id,
            busy: true,
            step: "toStart",
          };

          // 2. 移动绿点到起始位置
          if (startDotRef.current) {
            startDotRef.current.style.left = startCenter.x + "px";
            startDotRef.current.style.top = startCenter.y + "px";
          }

          // 3. 移动蓝点到目标位置
          if (targetDotRef.current) {
            targetDotRef.current.style.left = targetCenter.x + "px";
            targetDotRef.current.style.top = targetCenter.y + "px";
          }

          // 更新线的位置
          if (lineRef.current) {
            lineRef.current.setAttribute("x1", startCenter.x.toString());
            lineRef.current.setAttribute("y1", startCenter.y.toString());
            lineRef.current.setAttribute("x2", targetCenter.x.toString());
            lineRef.current.setAttribute("y2", targetCenter.y.toString());
          }

          // 4. 不再 return，函数返回 null
          return null;
        }
      }
    }

    // 任务2：分配晾晒架（待取洗衣机 → 晾晒架）
    const readyWashers = washersRef.current.filter(
      (w) =>
        w.currentOrderId &&
        ordersRef.current.find((o) => o.id === w.currentOrderId)?.status ===
          "readyToDry" &&
        !reservations.current.has(`washer-${w.id}`),
    );

    const freeRacks = dryingRacksRef.current.filter(
      (r) =>
        r.owned &&
        !r.currentOrderId &&
        !reservations.current.has(`dryingRack-${r.id}`),
    );

    for (const washer of readyWashers) {
      for (const rack of freeRacks) {
        const order = ordersRef.current.find(
          (o) => o.id === washer.currentOrderId,
        );
        if (order && order.totalWeight <= rack.capacity) {
          // 预定待取洗衣机和晾晒架
          reservations.current.add(`washer-${washer.id}`);
          reservations.current.add(`dryingRack-${rack.id}`);
          // console.log(
          //   `✅ 光标${cursorIndex} 预定: washer-${washer.id}, dryingRack-${rack.id}`,
          // );
          const startCenter = getElementCenter("washer", washer.id);
          const targetCenter = getElementCenter("dryingRack", rack.id);

          // 1. 更新 cursorState
          cursorsRef.current[cursorIndex] = {
            ...cursorsRef.current[cursorIndex],
            startX: startCenter.x,
            startY: startCenter.y,
            targetX: targetCenter.x,
            targetY: targetCenter.y,
            startId: washer.id,
            startType: "washer",
            targetId: rack.id,
            targetType: "dryingRack",
            orderId: order.id,
            busy: true,
            step: "toStart",
          };

          // 2. 移动绿点到起始位置（待取出的洗衣机）
          if (startDotRef.current) {
            startDotRef.current.style.left = startCenter.x + "px";
            startDotRef.current.style.top = startCenter.y + "px";
          }

          // 3. 移动蓝点到目标位置（空闲晾晒架）
          if (targetDotRef.current) {
            targetDotRef.current.style.left = targetCenter.x + "px";
            targetDotRef.current.style.top = targetCenter.y + "px";
          }

          // 更新线的位置
          if (lineRef.current) {
            lineRef.current.setAttribute("x1", startCenter.x.toString());
            lineRef.current.setAttribute("y1", startCenter.y.toString());
            lineRef.current.setAttribute("x2", targetCenter.x.toString());
            lineRef.current.setAttribute("y2", targetCenter.y.toString());
          }
          return null;
        }
      }
    }

    return null;
  };

  //html区域
  return (
    <div
      style={{
        padding: "30px",
        maxWidth: "1000px",
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
        position: "relative",
      }}
    >
      {/* 光标部分 */}
      <div>
        {cursorsRef.current.map((cursor) => (
          <div key={cursor.id}>
            {/* 光标（emoji） */}
            <div
              ref={(el) => {
                cursorRef.current[cursor.id - 1] = el;
              }}
              style={{
                position: "absolute",
                left: cursor.x + "px",
                top: cursor.y + "px",
                fontSize: "20px",
                transform: "translate(-50%, -50%)",
                zIndex: 1000,
                transition: "left 0.05s linear, top 0.05s linear", // 加一点点平滑
              }}
            >
              {cursor.emoji}
            </div>

            {/* 起始点 */}
            {/* {cursor.busy && (
              <div
                ref={startDotRef}
                style={{
                  position: "absolute",
                  // left: cursor.startX,
                  // top: cursor.startY,
                  left: cursor.startX + "px",
                  top: cursor.startY + "px",
                  width: "8px",
                  height: "8px",
                  backgroundColor: "rgba(111, 226, 159, 0.76)",
                  borderRadius: "50%",
                  transform: "translate(-50%, -50%)",
                  zIndex: 998,
                }}
              />
            )} */}

            {/* 目标点 */}
            {/* {cursor.busy && (
              <div
                ref={targetDotRef}
                style={{
                  position: "absolute",
                  // left: cursor.targetX,
                  // top: cursor.targetY,
                  left: cursor.targetX + "px",
                  top: cursor.targetY + "px",
                  width: "8px",
                  height: "8px",
                  backgroundColor: "rgba(57, 173, 231, 0.91)",
                  borderRadius: "50%",
                  transform: "translate(-50%, -50%)",
                  zIndex: 998,
                }}
              />
            )} */}
            {/* 路径线 - SVG */}
            {/* {cursor.busy && (
              <svg
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none", // 让鼠标可以穿透 SVG，不会挡住点击
                  zIndex: 997, // 比光标低，比背景高
                }}
              >
                <line
                  ref={lineRef}
                  x1={cursor.startX}
                  y1={cursor.startY}
                  x2={cursor.targetX}
                  y2={cursor.targetY}
                  stroke="rgba(111, 226, 159, 0.76)" // 和绿点同色
                  strokeWidth="2"
                  strokeDasharray="4 4" // 虚线，4像素线+4像素间隙
                />
              </svg>
            )} */}
          </div>
        ))}
      </div>

      {/* 购买窗口 */}
      <div
        style={{
          position: "absolute",
          top: "30px", // 距离容器顶部
          right: "30px", // 距离容器右侧
          backgroundColor: "white",
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "15px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          width: "480px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "20px",
            // borderBottom: '1px solid #ddd',
            // paddingBottom: '15px',
            marginBottom: "15px",
          }}
        >
          {/* 洗衣机购买（左侧） */}
          <div
            style={{
              flex: 1,
              paddingRight: "20px",
              borderRight: "1px solid #ddd",
            }}
          >
            <h3 style={{ marginTop: 0 }}>🛒 购买洗衣机</h3>

            {(() => {
              const nextWasher = washers.find((w) => !w.owned);
              if (!nextWasher) {
                return <p>🎉 所有洗衣机都已拥有！</p>;
              }

              return (
                <div
                  style={{
                    lineHeight: "0.5",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr", // 两等分
                      gap: "10px",
                      margin: "4px 0",
                      alignItems: "center",
                      justifyItems: "center",
                    }}
                  >
                    <div>
                      <p>{nextWasher.name}</p>
                      <p>容量：{nextWasher.capacity}kg</p>
                      <p>价格：{nextWasher.price}元</p>
                    </div>
                    <div
                      style={{
                        textAlign: "center",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <button
                        onClick={buyNextWasher}
                        disabled={money < nextWasher.price}
                        style={{
                          padding: "8px 16px",
                          backgroundColor:
                            money >= nextWasher.price ? "#52c41a" : "#ccc",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor:
                            money >= nextWasher.price
                              ? "pointer"
                              : "not-allowed",
                        }}
                      >
                        {money >= nextWasher.price ? "购买" : "资金不足"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 晾晒架购买（右侧） */}
          <div style={{ flex: 1 }}>
            <h3 style={{ marginTop: 0 }}>🏗️ 购买晾晒架</h3>
            <div>
              <p>
                下一个价格：
                {100 *
                  Math.pow(2, dryingRacks.filter((r) => r.owned).length - 1)}
                元
              </p>
              <button
                onClick={buyNewDryingRack}
                disabled={
                  money <
                  100 *
                    Math.pow(2, dryingRacks.filter((r) => r.owned).length - 1)
                }
                style={{
                  padding: "8px 16px",
                  backgroundColor:
                    money >=
                    100 *
                      Math.pow(2, dryingRacks.filter((r) => r.owned).length - 1)
                      ? "#52c41a"
                      : "#ccc",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor:
                    money >=
                    100 *
                      Math.pow(2, dryingRacks.filter((r) => r.owned).length - 1)
                      ? "pointer"
                      : "not-allowed",
                }}
              >
                购买晾晒架
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 标题 */}
      <h1>糊糊洗衣店</h1>

      <div
        style={{
          marginBottom: "20px",
          width: "400px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr", // 两等分
            gap: "10px",
            margin: "4px 0",
          }}
        >
          <div>
            资金：<strong>{money}元</strong>
          </div>
          <div>
            日期：
            <strong>
              {date.year}年{date.month}月{date.day}日
            </strong>
          </div>
          <div>待处理订单：{pendingOrders.length}个</div>
          <div>进行中订单：{activeOrders.length}个</div>
        </div>
        <button
          onClick={startNewDay}
          style={{
            marginTop: "10px",
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: "#ffffffff",
            borderRadius: "4px",
            cursor: "pointer",
            border: "1px solid #ddd",
          }}
        >
          开始新的一天
        </button>
      </div>

      <div style={{ display: "flex", gap: "30px" }}>
        {/* 订单列表 */}
        <div style={{ flex: 1 }}>
          <h2 style={{ color: "#787878ff" }}>待处理订单</h2>
          {pendingOrders.length === 0 ? (
            <p>暂无订单，点击“开始新的一天”获取订单</p>
          ) : (
            pendingOrders.map((order) => (
              <div
                key={order.id}
                data-target-type="order" // 新增这行
                data-target-id={order.id} // 新增这行
                style={{
                  border: "1px solid #ddd", // 始终不变
                  backgroundColor:
                    selectedOrderId === order.id ? "rgba(0,0,0,0.05)" : "white", // 选中时加一层很浅的灰蒙版
                  padding: "15px",
                  marginBottom: "12px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  cursor: "pointer",
                  height: "120px",
                  overflow: "hidden", // 隐藏超出部分
                  position: "relative", // 为滚动区域做准备
                  lineHeight: "1",
                }}
                onClick={() => {
                  // cancelConflictingCursors(`order-${order.id}`);
                  cancelConflictingCursors(
                    `order-${order.id}`,
                    isCursorClicking.current,
                  );
                  // 点击订单：如果已经选中则取消，否则选中
                  setSelectedOrderId(
                    selectedOrderId === order.id ? null : order.id,
                  );
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 20,
                    right: 0,
                    bottom: 0,
                    overflowY: "auto", // 垂直滚动
                    paddingRight: "8px", // 给滚动条留空间
                  }}
                >
                  <h3>
                    {order.customerName} {order.isUrgent && "🔥 加急"}
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr", // 两等分
                      gap: "10px",
                      margin: "4px 0",
                    }}
                  >
                    <div>衣物：{order.clothes.length}件</div>
                    <div>总重：{order.totalWeight}kg</div>
                    <div>报酬：{order.reward}元</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 洗衣机状态 */}
        <div style={{ flex: 1, position: "relative" }}>
          <h2 style={{ color: "#787878ff" }}>洗衣机状态</h2>
          {selectedOrderId && (
            <div
              style={{
                // 提示词的格式
                position: "absolute", // 绝对定位
                top: "-30px", // 距离顶部
                left: 0,
                right: 0,
                zIndex: 10, // 确保在最上层
                padding: "8px",
                borderRadius: "4px",
                textAlign: "center",
                alignItems: "center",
              }}
            >
              <p
                style={{
                  color: "#787878ff",
                  margin: "10px 0",
                }}
              >
                🎯已选中订单，请点击空闲的洗衣机
              </p>
            </div>
          )}
          {washers
            .filter((w) => w.owned)
            .map((washer) => (
              <div
                key={washer.id}
                data-target-type="washer" // 新增这行
                data-target-id={washer.id} // 新增这行
                style={{
                  border: "1px solid #ddd", // 始终不变
                  padding: "15px",
                  marginBottom: "12px",
                  height: "120px",
                  overflow: "hidden",
                  position: "relative",
                  lineHeight: "1", // 添加这一行
                  ...getWasherStyle(washer), // 调用函数
                }}
                onClick={() => {
                  // cancelConflictingCursors(`washer-${washer.id}`);
                  cancelConflictingCursors(
                    `washer-${washer.id}`,
                    isCursorClicking.current,
                  );
                  const order = orders.find(
                    (o) => o.id === washer.currentOrderId,
                  );

                  // 情况1：有洗好的衣服
                  if (order?.status === "readyToDry") {
                    if (selectedWasherId === washer.id) {
                      // 已经选中，取消选中
                      setSelectedWasherId(null);
                      setSelectedOrderId(null);
                    } else {
                      // 选中这个洗衣机的衣服
                      setSelectedWasherId(washer.id);
                      setSelectedOrderId(order.id);
                    }
                    return;
                  }

                  // 情况2：洗涤中
                  if (washer.currentOrderId && order?.status === "washing") {
                    return; // 不可点击
                  }

                  // 情况3：空闲，分配新订单
                  if (!washer.currentOrderId && selectedOrderId) {
                    assignToWasher(selectedOrderId, washer.id);
                    setSelectedOrderId(null);
                    setSelectedWasherId(null);
                  }
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 20,
                    right: 0,
                    bottom: 0,
                    overflowY: "auto",
                    paddingRight: "8px",
                  }}
                >
                  <h3>
                    洗衣机 {washer.name} Lv.{washer.level}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // 防止触发卡片点击
                      upgradeWasher(washer.id);
                    }}
                    disabled={money < washer.upgradePrice || washer.level >= 5}
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      backgroundColor:
                        money >= washer.upgradePrice && washer.level < 5
                          ? "#52c41a" // 可升级：绿色
                          : "#d9d9d9", // 不可升级：灰色
                      color:
                        money >= washer.upgradePrice && washer.level < 5
                          ? "#000" // 可升级：黑色
                          : "#8c8c8c", // 不可升级：灰色
                      // border: 'none',
                      // borderRadius: '4px',
                      // fontSize: '16px',
                      cursor:
                        money >= washer.upgradePrice && washer.level < 5
                          ? "pointer"
                          : "not-allowed",
                      // display: 'flex',
                      // alignItems: 'center',
                      // justifyContent: 'center'
                    }}
                    title={
                      washer.level >= 5
                        ? "已满级"
                        : `升级需要：${washer.upgradePrice}元`
                    }
                  >
                    ⬆
                  </button>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr", // 两等分
                      gap: "10px",
                      margin: "4px 0",
                    }}
                  >
                    <div>容量：{washer.capacity}kg</div>
                    {/* <div>状态：{
                    (() => {
                      const order = orders.find(o => o.id === washer.currentOrderId);
                      if (!washer.currentOrderId) return '💤 空闲';
                      if (order?.status === 'readyToDry') return '✅ 待取出';
                      return '⚡ 工作中';
                    })()
                  }</div> */}
                    <div>速度：{washer.baseWashTime}秒</div>
                  </div>

                  {washer.currentOrderId &&
                    (() => {
                      const order = orders.find(
                        (o) => o.id === washer.currentOrderId,
                      );

                      if (order?.status === "readyToDry") {
                        // 洗涤完成，待取出
                        return (
                          <p
                            style={{
                              lineHeight: "1",
                              color: "#9c9c9cff",
                              alignItems: "center",
                              justifyItems: "center",
                            }}
                          >
                            洗涤完成，点击取出
                          </p>
                        );
                      } else {
                        // 洗涤中，显示进度
                        return (
                          <>
                            <p
                              style={{
                                margin: "8px 0",
                              }}
                            >
                              剩余时间：{washer.remainingTime}秒
                            </p>
                            <progress
                              value={washer.remainingTime}
                              max="10"
                              style={{
                                width: "100%",
                              }}
                            />
                          </>
                        );
                      }
                    })()}
                </div>
              </div>
            ))}
        </div>
        {/* 洗衣机框架结束 */}

        {/* 右：晾晒架状态 */}
        <div style={{ flex: 1, position: "relative" }}>
          <h2 style={{ color: "#787878ff" }}>晾晒架状态</h2>
          {dryingRacks.map((rack) => (
            <div
              key={rack.id}
              data-target-type="dryingRack" // 新增这行
              data-target-id={rack.id} // 新增这行
              style={{
                border: "1px solid #ddd",
                padding: "15px",
                marginBottom: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                height: "120px",
                overflow: "hidden",
                position: "relative",
                lineHeight: "1",
                backgroundColor: rack.currentOrderId
                  ? "rgba(0,0,0,0.1)"
                  : "white",
                cursor: rack.currentOrderId ? "not-allowed" : "pointer",
              }}
              onClick={() => {
                // cancelConflictingCursors(`dryingRack-${rack.id}`);
                cancelConflictingCursors(
                  `dryingRack-${rack.id}`,
                  isCursorClicking.current,
                );
                if (rack.currentOrderId) return;
                if (!selectedOrderId) return;
                assignToDryingRack(selectedOrderId, rack.id);
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 20,
                  right: 0,
                  bottom: 0,
                  overflowY: "auto",
                  paddingRight: "8px",
                }}
              >
                <h3>
                  晾晒架 {rack.name} Lv.{rack.level}
                </h3>

                <button
                  onClick={(e) => {
                    e.stopPropagation(); // 防止触发卡片点击
                    upgradeDryingRack(rack.id);
                  }}
                  disabled={money < rack.upgradePrice || rack.level >= 5}
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    backgroundColor:
                      money >= rack.upgradePrice && rack.level < 5
                        ? "#52c41a" // 可升级：绿色
                        : "#d9d9d9", // 不可升级：灰色
                    color:
                      money >= rack.upgradePrice && rack.level < 5
                        ? "#000" // 可升级：黑色
                        : "#8c8c8c", // 不可升级：灰色
                    // border: 'none',
                    // borderRadius: '4px',
                    // fontSize: '16px',
                    cursor:
                      money >= rack.upgradePrice && rack.level < 5
                        ? "pointer"
                        : "not-allowed",
                    // display: 'flex',
                    // alignItems: 'center',
                    // justifyContent: 'center'
                  }}
                  title={
                    rack.level >= 5
                      ? "已满级"
                      : `升级需要：${rack.upgradePrice}元`
                  }
                >
                  ⬆
                </button>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    margin: "4px 0",
                  }}
                >
                  <div>容量：{rack.capacity}kg</div>
                  {/* <div>状态：{rack.currentOrderId ? '晾晒中' : '空闲'}</div> */}
                  <div>速度：{rack.baseDryTime}秒</div>
                </div>
                {rack.currentOrderId && (
                  <>
                    <p
                      style={{
                        margin: "8px 0",
                      }}
                    >
                      剩余时间：{rack.remainingTime}秒
                    </p>
                    <progress
                      value={rack.remainingTime}
                      max="15"
                      style={{ width: "100%" }}
                    />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        {/* 晾晒架结束位置 */}
      </div>
      {/* 三列框架结束的位置 */}
    </div>
  );
}

export default App;
