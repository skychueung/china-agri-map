// ==========================================================================
// EmptyState —— 筛选无结果空状态（工D）
// 契约来源：contract-v2.md「工D」一节
// 文案沿用 V1，"院校" 替换为 "机构"
// ==========================================================================
import { SearchX } from 'lucide-react';

export interface EmptyStateProps {
  onReset: () => void;
}

export function EmptyState({ onReset }: EmptyStateProps) {
  const handleReset = () => {
    onReset();
    // 集成约定兼容：除调用 onReset 回调外，同时广播全局事件，
    // 便于 Header 全局搜索框等非 props 链路上的组件同步清空筛选状态。
    window.dispatchEvent(new CustomEvent('agri:reset-filters'));
  };

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-agri-secondary/40 bg-white px-6 py-16 text-center">
      <SearchX className="h-12 w-12 text-agri-secondary" aria-hidden="true" />
      <p className="mt-4 text-sm text-agri-muted">
        未找到符合条件的机构，请调整关键词或筛选条件。
      </p>
      <button
        type="button"
        onClick={handleReset}
        className="mt-6 rounded-lg bg-agri-primary px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:bg-agri-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-primary focus-visible:ring-offset-2"
      >
        清除筛选条件
      </button>
    </div>
  );
}

export default EmptyState;
