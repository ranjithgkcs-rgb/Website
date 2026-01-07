
import React, { useState } from 'react';
import { Plus, X, Utensils, Sparkles } from 'lucide-react';

interface Props {
  onGenerate: (ingredients: string[]) => void;
  isLoading: boolean;
}

const IngredientInput: React.FC<Props> = ({ onGenerate, isLoading }) => {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [current, setCurrent] = useState('');

  const addIngredient = () => {
    if (current.trim() && !ingredients.includes(current.trim())) {
      setIngredients([...ingredients, current.trim()]);
      setCurrent('');
    }
  };

  const removeIngredient = (idx: number) => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };

  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-stone-200 border border-stone-100">
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addIngredient()}
          placeholder="Add an ingredient (e.g. Tomato, Salmon, Thyme)"
          className="flex-1 bg-stone-50 px-6 py-4 rounded-2xl border-2 border-stone-50 focus:border-orange-500 outline-none transition-all font-medium"
        />
        <button 
          onClick={addIngredient}
          className="bg-stone-800 hover:bg-black text-white px-6 rounded-2xl transition-colors"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-8 min-h-[50px]">
        {ingredients.map((ing, i) => (
          <span 
            key={i} 
            className="group flex items-center gap-2 bg-orange-50 text-orange-700 px-4 py-2 rounded-full font-semibold text-sm border border-orange-100 animate-in fade-in zoom-in-95"
          >
            {ing}
            <button onClick={() => removeIngredient(i)} className="hover:text-orange-900 transition-colors">
              <X size={14} />
            </button>
          </span>
        ))}
        {ingredients.length === 0 && (
          <p className="text-stone-400 italic text-sm py-2">Add ingredients to start crafting your recipe...</p>
        )}
      </div>

      <button
        onClick={() => onGenerate(ingredients)}
        disabled={isLoading || ingredients.length === 0}
        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating Masterpiece...
          </>
        ) : (
          <>
            <Sparkles size={20} />
            Generate Recipe with AI
          </>
        )}
      </button>
    </div>
  );
};

export default IngredientInput;
