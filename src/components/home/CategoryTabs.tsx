import { memo } from "react";
import { Flower2 } from "lucide-react";

interface Tab {
  id: string;
  label: string;
  icon: React.ElementType | null;
  imageUrl?: string | null;
}

interface CategoryTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

const CategoryTabs = memo(({ tabs, activeTab, onTabChange }: CategoryTabsProps) => {
  return (
    <div className="relative mb-6 lg:mb-8">
      <div className="flex w-full overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-1 px-0.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex shrink-0 snap-start items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 md:px-5 md:py-3 md:text-sm ${
                isActive
                  ? "bg-primary/10 text-primary font-semibold shadow-sm ring-1 ring-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {tab.imageUrl ? (
                <img src={tab.imageUrl} alt="" className="w-4 h-4 md:w-5 md:h-5 rounded-md object-cover" loading="lazy" />
              ) : tab.icon ? (
                <tab.icon size={14} className={isActive ? "text-primary" : ""} />
              ) : (
                <Flower2 size={14} className={isActive ? "text-primary" : ""} />
              )}
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
});

CategoryTabs.displayName = "CategoryTabs";

export default CategoryTabs;
