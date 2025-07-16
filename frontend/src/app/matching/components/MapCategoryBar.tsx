import { FaUtensils, FaCoffee, FaStore, FaShoppingCart } from "react-icons/fa";

const categories = [
  { icon: <FaUtensils className="text-orange-400" />, label: "음식점" },
  { icon: <FaCoffee className="text-orange-300" />, label: "카페" },
  { icon: <FaStore className="text-yellow-500" />, label: "편의점" },
  { icon: <FaShoppingCart className="text-yellow-600" />, label: "마트" },
];

export default function MapCategoryBar({ onCategorySelect }: { onCategorySelect: (keyword: string) => void }) {
  return (
    <div className="absolute top-0 left-0 w-full z-20 flex overflow-x-auto gap-3 px-3 py-2 bg-transparent">
      {categories.map((cat) => (
        <div
          key={cat.label}
          onClick={() => onCategorySelect(cat.label)}
          className="flex items-center gap-1 px-4 py-2 bg-white rounded-full shadow text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer hover:bg-blue-50 hover:shadow-lg hover:scale-105"
        >
          {cat.icon}
          <span>{cat.label}</span>
        </div>
      ))}
    </div>
  );
} 