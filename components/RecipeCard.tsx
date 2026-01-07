
import React, { useState } from 'react';
import { Clock, Users, ChevronRight, X, Flame, Target, Beef, Salad } from 'lucide-react';
import { Recipe } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const RecipeCard: React.FC<{ recipe: Recipe }> = ({ recipe }) => {
  const [showDetails, setShowDetails] = useState(false);

  const nutritionData = [
    { name: 'Protein', value: recipe.nutrition.protein, color: '#f97316' },
    { name: 'Carbs', value: recipe.nutrition.carbs, color: '#22c55e' },
    { name: 'Fat', value: recipe.nutrition.fat, color: '#eab308' },
  ];

  return (
    <>
      <div 
        onClick={() => setShowDetails(true)}
        className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-stone-100 transition-all cursor-pointer flex flex-col h-full"
      >
        <div className="relative h-56 overflow-hidden">
          <img 
            src={recipe.image || `https://picsum.photos/seed/${recipe.title}/800/450`} 
            alt={recipe.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-stone-800 uppercase tracking-widest">
            {recipe.difficulty}
          </div>
        </div>
        <div className="p-6 flex-1 flex flex-col">
          <h3 className="text-xl font-bold mb-2 text-stone-800 group-hover:text-orange-600 transition-colors">{recipe.title}</h3>
          <p className="text-stone-500 text-sm line-clamp-2 mb-4">{recipe.description}</p>
          <div className="mt-auto flex items-center justify-between text-stone-400 text-sm">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><Clock size={16} /> {recipe.cookTime}</span>
              <span className="flex items-center gap-1"><Users size={16} /> {recipe.servings}</span>
            </div>
            <ChevronRight size={20} className="text-orange-500 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-md" onClick={() => setShowDetails(false)} />
          <div className="relative bg-stone-50 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2rem] shadow-2xl animate-in zoom-in-95 fade-in duration-300">
            <button 
              onClick={() => setShowDetails(false)}
              className="absolute top-6 right-6 z-10 p-2 bg-stone-200 hover:bg-stone-300 rounded-full transition-colors"
            >
              <X size={24} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="h-64 md:h-full">
                <img 
                  src={recipe.image || `https://picsum.photos/seed/${recipe.title}/800/450`} 
                  alt={recipe.title} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-8 md:p-12 space-y-8">
                <div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {recipe.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold uppercase tracking-wider">{tag}</span>
                    ))}
                  </div>
                  <h2 className="text-4xl font-bold mb-4">{recipe.title}</h2>
                  <p className="text-stone-600 leading-relaxed italic">"{recipe.description}"</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-stone-200 flex items-center gap-3">
                    <div className="p-2 bg-stone-100 rounded-lg text-stone-500"><Clock size={20} /></div>
                    <div>
                      <p className="text-xs text-stone-400 font-medium">PREP + COOK</p>
                      <p className="font-bold">{recipe.prepTime} + {recipe.cookTime}</p>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-stone-200 flex items-center gap-3">
                    <div className="p-2 bg-stone-100 rounded-lg text-stone-500"><Flame size={20} /></div>
                    <div>
                      <p className="text-xs text-stone-400 font-medium">CALORIES</p>
                      <p className="font-bold">{recipe.nutrition.calories} kcal</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Beef size={20} /> Nutritional Profile
                  </h3>
                  <div className="flex items-center gap-8 bg-white p-6 rounded-3xl border border-stone-200">
                    <div className="w-24 h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={nutritionData}
                            innerRadius={30}
                            outerRadius={45}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {nutritionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 grid grid-cols-1 gap-2">
                      {nutritionData.map(stat => (
                        <div key={stat.name} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stat.color }} />
                            {stat.name}
                          </span>
                          <span className="font-bold">{stat.value}g</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-4">Ingredients</h3>
                  <ul className="space-y-3">
                    {recipe.ingredients.map((ing, i) => (
                      <li key={i} className="flex items-center justify-between p-3 bg-white rounded-xl border border-stone-100 shadow-sm">
                        <span className="font-medium text-stone-700">{ing.name}</span>
                        <span className="text-stone-400 font-mono text-xs">{ing.amount}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-4">Instructions</h3>
                  <div className="space-y-6">
                    {recipe.instructions.map((step, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm">
                          {i + 1}
                        </div>
                        <p className="text-stone-700 leading-relaxed pt-1">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RecipeCard;
