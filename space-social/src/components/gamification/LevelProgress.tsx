'use client';

import { useEffect, useState } from 'react';

interface LevelProgressProps {
  currentPoints: number;
  level: number;
}

export function LevelProgress({ currentPoints, level }: LevelProgressProps) {
  // Points needed for next level (simplified formula)
  const pointsForNextLevel = level * 1000;
  const pointsForCurrentLevel = (level - 1) * 1000;
  const pointsInCurrentLevel = currentPoints - pointsForCurrentLevel;
  const pointsNeeded = pointsForNextLevel - currentPoints;
  
  const progressPercentage = (pointsInCurrentLevel / (pointsForNextLevel - pointsForCurrentLevel)) * 100;

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-1">
        <span>Уровень {level}</span>
        <span>{pointsInCurrentLevel} / {pointsForNextLevel - pointsForCurrentLevel} очков</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      <div className="text-right text-sm text-muted-foreground mt-1">
        До следующего уровня: {pointsNeeded} очков
      </div>
    </div>
  );
}