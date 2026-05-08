import type { SymptomQuestion } from "./types";

// Single source of truth: 30 questions in order
// 肾脏 13 / 血压 6 / 血糖 6 / 生活习惯 5

export const QUESTIONS: SymptomQuestion[] = [
  // ════════ 肾脏模块 13 题 ════════
  {
    id: "kidney_foam",
    module: "kidney",
    text: "您小便的时候，尿液有没有泡泡？泡泡多久才会散？",
    options: [
      { label: "几乎没有泡泡", value: "none", score: 0 },
      { label: "有少少，1 分钟内就散了", value: "quick", score: 1 },
      { label: "蛮多泡泡，1–3 分钟才散", value: "medium", score: 2 },
      { label: "密密麻麻像啤酒泡，超过 3 分钟还在", value: "dense", score: 3 },
    ],
  },
  {
    id: "kidney_nocturia",
    module: "kidney",
    text: "您睡觉前没喝什么水的话，半夜要起来小便几次？",
    options: [
      { label: "0 次，一觉到天亮", value: "0", score: 0 },
      { label: "1 次", value: "1", score: 1 },
      { label: "2 次", value: "2", score: 2 },
      { label: "3 次或以上", value: "3+", score: 3 },
    ],
  },
  {
    id: "kidney_urine_color",
    module: "kidney",
    text: "您的尿液颜色平时是怎样的？",
    options: [
      { label: "透明 / 淡黄色", value: "clear", score: 0 },
      { label: "深黄色", value: "dark_yellow", score: 1 },
      { label: "茶色 / 啤酒色", value: "tea", score: 3 },
      { label: "偶尔带血色或粉红", value: "blood", score: 3 },
    ],
  },
  {
    id: "kidney_urine_smell",
    module: "kidney",
    text: "您的尿液会不会有腥味、阿摩尼亚味、或其他怪味？",
    options: [
      { label: "没有特别味道", value: "none", score: 0 },
      { label: "偶尔有一点味", value: "mild", score: 1 },
      { label: "蛮明显的腥味或臭味", value: "strong", score: 2 },
      { label: "很重味，自己都受不了", value: "severe", score: 3 },
    ],
  },
  {
    id: "kidney_eye_swell",
    module: "kidney",
    text: "早上起床的时候，您的眼皮或脸有没有浮肿？",
    options: [
      { label: "从来没有", value: "never", score: 0 },
      { label: "偶尔几次", value: "occasional", score: 1 },
      { label: "蛮常有", value: "frequent", score: 2 },
      { label: "几乎天天都肿肿", value: "daily", score: 3 },
    ],
  },
  {
    id: "kidney_leg_swell",
    module: "kidney",
    text: "您的脚踝或小腿，用手指按下去会不会留指印（凹下去一会儿才弹回来）？",
    options: [
      { label: "不会，按下去马上弹回", value: "never", score: 0 },
      { label: "偶尔会，过一会才弹", value: "sometimes", score: 2 },
      { label: "蛮常这样", value: "frequent", score: 3 },
      { label: "几乎天天都肿，按一下凹蛮久", value: "daily", score: 3 },
    ],
  },
  {
    id: "kidney_back_pain",
    module: "kidney",
    text: "您腰部两侧（不是中间脊椎，是肋骨下面腰侧）会不会酸酸胀胀？（不是运动后那种）",
    options: [
      { label: "从来不会", value: "never", score: 0 },
      { label: "偶尔几次", value: "occasional", score: 1 },
      { label: "蛮常感觉到", value: "frequent", score: 2 },
      { label: "几乎天天都酸", value: "daily", score: 3 },
    ],
  },
  {
    id: "kidney_skin_itch",
    module: "kidney",
    text: "您的皮肤会不会无缘无故痕痒？（没皮肤病、没敏感）",
    options: [
      { label: "不会", value: "never", score: 0 },
      { label: "偶尔几次", value: "occasional", score: 1 },
      { label: "蛮常痒", value: "frequent", score: 2 },
      { label: "几乎天天痒，抓到都没用", value: "daily", score: 3 },
    ],
  },
  {
    id: "kidney_fatigue",
    module: "kidney",
    text: "您整体上有没有觉得很累、没精神、做什么都懒？",
    options: [
      { label: "精神好得很", value: "never", score: 0 },
      { label: "偶尔会累", value: "occasional", score: 1 },
      { label: "蛮常觉得没精神", value: "frequent", score: 2 },
      { label: "天天都很累，睡到饱也没用", value: "daily", score: 3 },
    ],
  },
  {
    id: "kidney_medication",
    module: "kidney",
    text: "您有没有长期吃西药？（吃 ≥3 个月那种）",
    options: [
      { label: "没吃任何西药", value: "none", score: 0 },
      { label: "偶尔吃 panadol / 止痛药", value: "painkiller_occ", score: 1 },
      { label: "经常吃止痛药 / 消炎药", value: "painkiller_freq", score: 3 },
      { label: "长期吃降压药 / 降糖药 / 痛风药 / 安眠药", value: "chronic", score: 2 },
    ],
  },
  {
    id: "kidney_taste",
    module: "kidney",
    text: "您吃饭的口味怎样？",
    options: [
      { label: "清淡，少盐少油", value: "light", score: 0 },
      { label: "正常口味", value: "normal", score: 1 },
      { label: "重口味，每餐都要配辣椒酱 / 酱油 / 江鱼仔酱", value: "salty", score: 3 },
      { label: "无辣不欢，每餐一定加小辣椒 / 参巴酱", value: "very_spicy", score: 3 },
    ],
  },
  {
    id: "kidney_water",
    module: "kidney",
    text: "您一天喝多少水？（咖啡、茶、汤不算，纯白开水）",
    options: [
      { label: "8 杯以上", value: "high", score: 0 },
      { label: "6–8 杯", value: "ok", score: 0 },
      { label: "3–6 杯", value: "low", score: 2 },
      { label: "少过 3 杯，渴了才喝", value: "very_low", score: 3 },
    ],
  },
  {
    id: "kidney_family",
    module: "kidney",
    text: "您家族里有没有人洗肾、肾衰竭、或肾病？（爸妈、兄弟姐妹、阿公阿嬷）",
    options: [
      { label: "没有", value: "none", score: 0 },
      { label: "不知道 / 不确定", value: "unknown", score: 1 },
      { label: "有亲戚（叔叔阿姨表兄弟）", value: "extended", score: 2 },
      { label: "有，直系亲属（爸妈兄弟姐妹）", value: "immediate", score: 3 },
    ],
  },

  // ════════ 血压模块 6 题 ════════
  {
    id: "bp_known",
    module: "blood_pressure",
    text: "您知道自己最近一次量到的血压数字吗？",
    options: [
      { label: "120/80 左右，蛮正常", value: "normal", score: 0 },
      { label: "130/85 上下，正常偏高", value: "borderline", score: 1 },
      { label: "140/90 或以上", value: "high", score: 3 },
      { label: "不知道，没量过", value: "unknown", score: 1 },
    ],
  },
  {
    id: "bp_diagnosed",
    module: "blood_pressure",
    text: "您有没有被医生诊断过高血压，或在吃降压药？",
    options: [
      { label: "没有", value: "no", score: 0 },
      { label: "医生说偏高，叫我注意", value: "borderline", score: 2 },
      { label: "确诊高血压，但没吃药", value: "untreated", score: 3 },
      { label: "确诊了，每天吃降压药", value: "on_med", score: 2 },
    ],
  },
  {
    id: "bp_headache",
    module: "blood_pressure",
    text: "您会不会经常头痛，特别是后脑勺这边？",
    options: [
      { label: "几乎不会", value: "never", score: 0 },
      { label: "偶尔几次", value: "occasional", score: 1 },
      { label: "蛮常头痛", value: "frequent", score: 2 },
      { label: "几乎每天都头痛", value: "daily", score: 3 },
    ],
  },
  {
    id: "bp_dizzy",
    module: "blood_pressure",
    text: "您站起来或转头的时候，会不会头晕、眼前一黑？",
    options: [
      { label: "不会", value: "never", score: 0 },
      { label: "偶尔会", value: "occasional", score: 1 },
      { label: "蛮常这样", value: "frequent", score: 2 },
      { label: "几乎每天都会，要扶东西才行", value: "daily", score: 3 },
    ],
  },
  {
    id: "bp_chest",
    module: "blood_pressure",
    text: "您有没有胸口闷、心跳很快、喘不过气这种感觉？",
    options: [
      { label: "不会", value: "never", score: 0 },
      { label: "偶尔有", value: "occasional", score: 1 },
      { label: "蛮常有", value: "frequent", score: 2 },
      { label: "几乎天天都这样", value: "daily", score: 3 },
    ],
  },
  {
    id: "bp_neck",
    module: "blood_pressure",
    text: "您的脖子后面、肩膀会不会僵硬酸痛？",
    options: [
      { label: "不会", value: "never", score: 0 },
      { label: "偶尔", value: "occasional", score: 1 },
      { label: "蛮常", value: "frequent", score: 2 },
      { label: "天天都僵硬", value: "daily", score: 3 },
    ],
  },

  // ════════ 血糖模块 6 题 ════════
  {
    id: "sugar_known",
    module: "blood_sugar",
    text: "您最近一次的空腹血糖（早餐前那个数字）是多少？",
    options: [
      { label: "5 mmol/L 以下，正常", value: "normal", score: 0 },
      { label: "5–6 mmol/L，正常偏高", value: "borderline", score: 1 },
      { label: "6 mmol/L 以上", value: "high", score: 3 },
      { label: "不知道，没量过", value: "unknown", score: 1 },
    ],
  },
  {
    id: "sugar_diagnosed",
    module: "blood_sugar",
    text: "您有没有被诊断糖尿病或前期糖尿病？",
    options: [
      { label: "没有", value: "no", score: 0 },
      { label: "医生说前期糖尿病", value: "pre", score: 2 },
      { label: "确诊糖尿病，但没吃药", value: "untreated", score: 3 },
      { label: "确诊了，吃药 / 打针中", value: "on_med", score: 2 },
    ],
  },
  {
    id: "sugar_thirst",
    module: "blood_sugar",
    text: "您会不会经常口渴，喝再多水都觉得不够？",
    options: [
      { label: "不会", value: "never", score: 0 },
      { label: "偶尔", value: "occasional", score: 1 },
      { label: "蛮常这样", value: "frequent", score: 2 },
      { label: "几乎天天都渴，喝不停", value: "daily", score: 3 },
    ],
  },
  {
    id: "sugar_urine_freq",
    module: "blood_sugar",
    text: "白天的话，您每隔多久就要去一次厕所小便？",
    options: [
      { label: "3–4 小时一次，正常", value: "normal", score: 0 },
      { label: "2 小时左右一次", value: "moderate", score: 1 },
      { label: "1 小时多就要去", value: "frequent", score: 2 },
      { label: "不到 1 小时就要去，跑厕所跑到怕", value: "very_frequent", score: 3 },
    ],
  },
  {
    id: "sugar_wound",
    module: "blood_sugar",
    text: "您的伤口（小割伤、蚊子咬、青春痘）会不会很久才好？",
    options: [
      { label: "几天就好", value: "normal", score: 0 },
      { label: "比以前慢一点", value: "slow", score: 1 },
      { label: "要拖一两个星期", value: "very_slow", score: 2 },
      { label: "好不来，常常感染", value: "infected", score: 3 },
    ],
  },
  {
    id: "sugar_weight",
    module: "blood_sugar",
    text: "最近 3 个月您的体重有没有变化？",
    options: [
      { label: "没变化", value: "stable", score: 0 },
      { label: "稍微胖一点", value: "gain", score: 0 },
      { label: "瘦了 2–4 公斤，但吃得不少", value: "lost_some", score: 2 },
      { label: "瘦了 5 公斤以上，明显消瘦", value: "lost_lot", score: 3 },
    ],
  },

  // ════════ 生活习惯 5 题 ════════
  {
    id: "life_smoking",
    module: "lifestyle",
    text: "您抽烟吗？",
    options: [
      { label: "从来不抽", value: "never", score: 0 },
      { label: "戒了好几年了", value: "former", score: 1 },
      { label: "偶尔抽几支", value: "social", score: 2 },
      { label: "天天抽", value: "current", score: 3 },
    ],
  },
  {
    id: "life_alcohol",
    module: "lifestyle",
    text: "您喝酒吗？",
    options: [
      { label: "不喝", value: "never", score: 0 },
      { label: "偶尔（一个月几次）", value: "occasional", score: 1 },
      { label: "经常（一个星期几次）", value: "frequent", score: 2 },
      { label: "天天喝 / 应酬多", value: "daily", score: 3 },
    ],
  },
  {
    id: "life_exercise",
    module: "lifestyle",
    text: "您一个星期会运动几次？（走路、跑步、游泳、打球都算）",
    options: [
      { label: "几乎天天，每次半小时以上", value: "high", score: 0 },
      { label: "一个星期 3–4 次", value: "moderate", score: 1 },
      { label: "一个星期 1–2 次", value: "low", score: 2 },
      { label: "几乎不运动", value: "none", score: 3 },
    ],
  },
  {
    id: "life_sleep",
    module: "lifestyle",
    text: "您每晚睡多少个小时？睡眠品质怎样？",
    options: [
      { label: "7–8 小时，睡得蛮熟", value: "good", score: 0 },
      { label: "6–7 小时，还可以", value: "ok", score: 1 },
      { label: "5–6 小时，睡不熟", value: "poor", score: 2 },
      { label: "5 小时以下，常常失眠", value: "bad", score: 3 },
    ],
  },
  {
    id: "life_stress",
    module: "lifestyle",
    text: "您最近压力大不大？",
    options: [
      { label: "蛮放松的", value: "low", score: 0 },
      { label: "正常压力", value: "normal", score: 1 },
      { label: "压力蛮大", value: "high", score: 2 },
      { label: "压力大到喘不过气", value: "very_high", score: 3 },
    ],
  },

  // ════════ 拖延时间 1 题（第 31 题）════════
  {
    id: "duration",
    module: "duration",
    text: "你大概什么时候开始发现身体有这些不舒服？（例如：尿泡多、腰酸、头晕、口渴等）",
    options: [
      { label: "还没特别注意过", value: "none", score: 0 },
      { label: "最近一两个月才开始", value: "1-2_months", score: 1 },
      { label: "已经 3–6 个月了", value: "3-6_months", score: 2 },
      { label: "超过半年，但都拖着没处理", value: "6-12_months", score: 3 },
      { label: "一年以上了", value: "over_1_year", score: 3 },
    ],
  },
];

export const TOTAL_QUESTIONS = QUESTIONS.length;

export function getQuestionById(id: string) {
  return QUESTIONS.find((q) => q.id === id);
}

export function getModuleLabel(module: string): string {
  switch (module) {
    case "kidney":
      return "肾脏健康";
    case "blood_pressure":
      return "血压";
    case "blood_sugar":
      return "血糖";
    case "lifestyle":
      return "生活习惯";
    case "duration":
      return "症状持续时间";
    default:
      return module;
  }
}
