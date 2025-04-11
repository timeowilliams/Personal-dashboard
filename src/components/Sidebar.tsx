// components/Sidebar.jsx
import React from "react";
import { 
  LayoutDashboard,
  DollarSign, 
  Activity, 
  Apple, 
  Moon, 
  Brain,
  Bell,
  User
} from "lucide-react";

const categories = [
  { id: 'all', name: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'finances', name: 'Finances', icon: <DollarSign size={18} /> },
  { id: 'fitness', name: 'Fitness', icon: <Activity size={18} /> },
  { id: 'nutrition', name: 'Nutrition', icon: <Apple size={18} /> },
  { id: 'sleep', name: 'Sleep', icon: <Moon size={18} /> },
  { id: 'work', name: 'Craft/Work', icon: <Brain size={18} /> }
];

const Sidebar = ({ activeCategory, setActiveCategory }) => {
  return (
    // components/Sidebar.jsx
// Update the main sidebar container
<div className="w-64 h-screen py-8 px-4 flex flex-col bg-black/40 backdrop-blur-md border-r border-white/10">
      <div className="flex items-center gap-3 px-4 mb-8">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
          <User size={20} className="text-white" />
        </div>
        <h1 className="text-xl font-medium">Life Dashboard</h1>
      </div>
      
      <div className="space-y-1 mb-6">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-2">
          MAIN
        </p>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-lg transition-all text-sm
              ${activeCategory === category.id 
                ? "bg-white/20 backdrop-blur-sm font-medium" 
                : "hover:bg-white/10"}`}
          >
            <span className={`${activeCategory === category.id ? "text-indigo-500" : "text-gray-500"}`}>
              {category.icon}
            </span>
            {category.name}
          </button>
        ))}
      </div>
      
      <div className="space-y-1 mt-4">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-2">
          CONNECTED SERVICES
        </p>
        <div className="px-4 py-3 flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
            <DollarSign size={16} className="text-white" />
          </div>
          <span className="text-sm">Plaid</span>
        </div>
        <div className="px-4 py-3 flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
            <Activity size={16} className="text-white" />
          </div>
          <span className="text-sm">Oura Ring</span>
        </div>
      </div>
      
      <div className="mt-auto">
        <div className="mx-3 p-4 rounded-xl bg-white/20 backdrop-blur-sm border border-white/20">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={14} className="text-amber-500" />
            <span className="text-xs font-medium">2 Issues</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            Your protein intake is below target. Consider adding more protein sources.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;