<template>
  <span class="eta-component">{{ formattedEta }}</span>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  curr: {
    type: Number,
    required: true,
    default: 0
  },
  total: {
    type: Number,
    required: true,
    default: 0
  },
  interval: {
    type: Number,
    default: 500
  },
  prefix: {
    type: String,
    default: ''
  }
});

// Firefox 經典算法 + 運動檢測
const smoothedSpeed = ref(null); // items/ms - 平滑的處理速度
const lastUpdate = ref({ time: 0, value: 0 });
const hasStartedMoving = ref(false); // 是否已開始真正的處理
let intervalId = null;

const addSample = () => {
  const now = Date.now();
  const currentValue = props.curr;
  
  // 檢測是否開始移動：curr 發生了實際變化
  if (!hasStartedMoving.value && lastUpdate.value.value > 0) {
    const valueDelta = currentValue - lastUpdate.value.value;
    if (valueDelta > 0) {
      hasStartedMoving.value = true;
      // 重置計時起點，忽略之前的等待時間
      lastUpdate.value = { time: now, value: currentValue };
      return;
    }
  }
  
  // 只有在真正開始移動後才計算速度
  if (hasStartedMoving.value && lastUpdate.value.time > 0) {
    const timeDelta = now - lastUpdate.value.time;
    const valueDelta = currentValue - lastUpdate.value.value;
    
    if (timeDelta > 0 && valueDelta >= 0) {
      const currentSpeed = valueDelta / timeDelta;
      
      if (smoothedSpeed.value === null) {
        // 初始化
        smoothedSpeed.value = currentSpeed;
      } else {
        // Firefox 經典方法：90% 舊速度 + 10% 新速度
        const alpha = 0.1;
        smoothedSpeed.value = smoothedSpeed.value * (1 - alpha) + currentSpeed * alpha;
      }
    }
  }
  
  lastUpdate.value = { time: now, value: currentValue };
};

const clearSamples = () => {
  smoothedSpeed.value = null;
  lastUpdate.value = { time: 0, value: 0 };
  hasStartedMoving.value = false;
};

// 計算剩餘時間（秒）- 使用指數移動平均
const estimatedSeconds = computed(() => {
  // 已完成
  if (props.curr >= props.total && props.total > 0) {
    return 0;
  }
  
  // 無效狀態
  if (props.total <= 0 || props.curr < 0) {
    return null;
  }
  
  // 沒有平滑速度數據
  if (smoothedSpeed.value === null || smoothedSpeed.value <= 0) {
    return null;
  }
  
  // 使用平滑速度計算ETA
  const remaining = props.total - props.curr;
  const estimatedMs = remaining / smoothedSpeed.value;
  const seconds = Math.floor(estimatedMs / 1000);
  
  // 限制最大24小時
  return Math.min(seconds, 24 * 3600);
});

// 格式化時間顯示
const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  } else {
    return `${m}:${String(s).padStart(2, '0')}`;
  }
};

// 動態格式化ETA顯示
const formattedEta = computed(() => {
  const seconds = estimatedSeconds.value;
  
  // 已完成
  if (props.curr >= props.total && props.total > 0) {
    const timeStr = '0:00';
    return props.prefix ? `${props.prefix} (${timeStr})` : `(${timeStr})`;
  }
  
  // 還在計算中（數據不足）或無有效預估時，不顯示任何東西
  if (seconds === null || seconds <= 0) {
    return props.prefix || '';
  }
  
  // 有有效預估時間才顯示
  const timeStr = formatTime(seconds);
  return props.prefix ? `${props.prefix} (${timeStr})` : `(${timeStr})`;
});

// 檢測重置：curr大幅減少時清空樣本
watch(() => props.curr, (newVal, oldVal) => {
  if (oldVal && newVal < oldVal * 0.5) {
    clearSamples();
  }
});

// total變化時重置樣本
watch(() => props.total, () => {
  clearSamples();
});

// 組件生命週期
onMounted(() => {
  addSample(); // 立即採樣
  intervalId = setInterval(addSample, props.interval);
});

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
});
</script>

<style scoped>
.eta-component {
  /* font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace; */
  font-variant-numeric: tabular-nums;
}
</style>