import React, { useState, useEffect, useCallback } from 'react';
import type { ChemicalElement, QuizComponentProps } from '../types';
import { QuizContainer } from './QuizContainer';
import { shuffleArray } from '../utils/quizUtils';
import { ClickableTruncatedText } from './Tooltip';

const NUM_PAIRS = 8;

type GameState = 'selecting' | 'playing';
type MatchableProperty = keyof Omit<ChemicalElement, 'Elemento'>;

interface GameItem {
  id: number;
  name: string;
  property: string;
}

interface DropSlot {
  elementId: number;
  elementName: string;
  droppedItem: DraggableItem | null;
}

interface DraggableItem {
  id: number;
  content: string;
}

const propertyLabels: { [K in MatchableProperty]: string } = {
  'Z': 'Numero Atomico',
  'Simbolo': 'Simbolo',
  'Anno di scoperta': 'Anno di scoperta',
  'Origine del nome': 'Origine del nome',
  'Caratteristiche chimiche': 'Caratteristiche chimiche',
  'Dove si trova e diffusione in natura': 'Diffusione in natura',
  'Utilizzo da parte dell\'industria': 'Utilizzo industriale',
  'Curiosità legate a come sono stati usati o considerati nel corso della storia': 'Curiosità'
};


const MatchingQuiz: React.FC<QuizComponentProps> = ({ elements, theme, onShowSummary, onShowTooltip }) => {
  const [gameState, setGameState] = useState<GameState>('selecting');
  const [selectedProperty, setSelectedProperty] = useState<MatchableProperty | null>(null);

  const [gameItems, setGameItems] = useState<GameItem[]>([]);
  const [dropSlots, setDropSlots] = useState<DropSlot[]>([]);
  const [draggableOptions, setDraggableOptions] = useState<DraggableItem[]>([]);
  
  const [time, setTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const [draggedItem, setDraggedItem] = useState<DraggableItem | null>(null);

  const setupGame = useCallback((property: MatchableProperty) => {
    const gameElements = shuffleArray([...elements]).slice(0, NUM_PAIRS);
    
    const items: GameItem[] = gameElements.map(el => ({
      id: el.Z,
      name: el.Elemento,
      property: String(el[property]),
    }));

    setGameItems(items);
    setDropSlots(items.map(item => ({
      elementId: item.id,
      elementName: item.name,
      droppedItem: null,
    })));
    setDraggableOptions(shuffleArray(items.map(item => ({
      id: item.id,
      content: item.property,
    }))));

    setTime(0);
    setTimerActive(true);
    setGameState('playing');
  }, [elements]);

  const handlePropertySelect = (property: MatchableProperty) => {
    setSelectedProperty(property);
    setupGame(property);
  };
  
  const handleNewGame = () => {
      setGameState('selecting');
      setSelectedProperty(null);
      setTimerActive(false);
      setShowFeedback(false);
      setTime(0);
  };

  useEffect(() => {
    let interval: number;
    if (timerActive) {
      interval = window.setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }
    return () => window.clearInterval(interval);
  }, [timerActive]);

  const handleFinish = () => {
    setTimerActive(false);
    setShowFeedback(true);

    setTimeout(() => {
      let correctMatches = 0;
      dropSlots.forEach(slot => {
        if (slot.droppedItem && slot.droppedItem.id === slot.elementId) {
          correctMatches++;
        }
      });
      const timeString = `${Math.floor(time / 60).toString().padStart(2, '0')}:${(time % 60).toString().padStart(2, '0')}`;
      onShowSummary({ score: `${correctMatches} / ${NUM_PAIRS}`, time: timeString }, handleNewGame);
      setShowFeedback(false);
    }, 3000); // Show summary after 3 seconds
  };
  
  const getSlotFeedbackClass = (slot: DropSlot): string => {
      if (!showFeedback) {
        return `${theme.border} border-opacity-50`;
      }
      if (slot.droppedItem && slot.droppedItem.id === slot.elementId) {
        return 'border-green-500 bg-green-500/20 border-solid'; // Correct
      }
      if (slot.droppedItem && slot.droppedItem.id !== slot.elementId) {
          return 'border-red-500 bg-red-500/20 border-solid'; // Incorrect
      }
      return 'border-red-500 bg-red-500/20 border-solid'; // Empty is also incorrect
  };

  // --- Drag and Drop Handlers ---
  const onDragStart = (e: React.DragEvent, item: DraggableItem) => {
    if (showFeedback) {
        e.preventDefault();
        return;
    }
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const onDrop = (e: React.DragEvent, targetSlot: DropSlot) => {
    e.preventDefault();
    if (!draggedItem || showFeedback) return;

    const newSlots = [...dropSlots];
    const newOptions = [...draggableOptions];
    
    const sourceSlot = newSlots.find(s => s.droppedItem?.id === draggedItem.id);
    const targetIndex = newSlots.findIndex(s => s.elementId === targetSlot.elementId);
    
    // The item currently in the target slot, if any
    const itemInTarget = newSlots[targetIndex].droppedItem;

    // Place dragged item in target slot
    newSlots[targetIndex].droppedItem = draggedItem;

    if (sourceSlot) { // Moving from another slot
      sourceSlot.droppedItem = itemInTarget; // Swap
    } else { // Moving from options list
      const optionIndex = newOptions.findIndex(o => o.id === draggedItem.id);
      if (itemInTarget) {
         newOptions.splice(optionIndex, 1, itemInTarget);
      } else {
         newOptions.splice(optionIndex, 1);
      }
    }

    setDropSlots(newSlots);
    setDraggableOptions(newOptions);
    setDraggedItem(null);
  };

  const onDropBackToOptions = (e: React.DragEvent) => {
     e.preventDefault();
     if (!draggedItem || showFeedback) return;

     const sourceSlot = dropSlots.find(s => s.droppedItem?.id === draggedItem.id);
     if (sourceSlot) { // Only handle if it comes from a slot
        const newSlots = dropSlots.map(s => s.elementId === sourceSlot.elementId ? {...s, droppedItem: null} : s);
        const newOptions = [...draggableOptions, draggedItem];
        setDropSlots(newSlots);
        setDraggableOptions(newOptions);
     }
     setDraggedItem(null);
  };


  if (gameState === 'selecting') {
    return (
      <div className="bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-3xl mx-auto text-center">
        <h2 className={`text-2xl font-bold ${theme.text} mb-2`}>Esercizio di Associazione</h2>
        <p className="text-gray-300 mb-6">Scegli quale caratteristica vuoi abbinare al nome dell'Elemento.</p>
        <div className="flex flex-wrap justify-center gap-3">
          {Object.entries(propertyLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => handlePropertySelect(key as MatchableProperty)}
              className={`px-4 py-2 font-semibold rounded-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 ${theme.button} ${theme.ring}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <QuizContainer
      title={`Associazione: Elemento ↔ ${propertyLabels[selectedProperty!]}`}
      description="Trascina la proprietà corretta accanto al nome dell'elemento corrispondente."
      theme={theme}
      time={time}
      onFinish={handleFinish}
      onNewGame={handleNewGame}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1 & 2: Elements and Drop Zones */}
        <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-gray-900/50 p-4 rounded-lg">
          {/* Elements */}
          <div className='space-y-3'>
             {dropSlots.map(slot => (
                 <div key={`name-${slot.elementId}`} className="h-14 flex items-center justify-end pr-4 text-right font-semibold text-gray-200">
                    <ClickableTruncatedText text={slot.elementName} maxLength={20} onShowTooltip={onShowTooltip}/>
                 </div>
             ))}
          </div>
          {/* Drop Zones */}
          <div className='space-y-3'>
             {dropSlots.map(slot => (
                <div 
                   key={`slot-${slot.elementId}`}
                   onDragOver={onDragOver}
                   onDrop={(e) => onDrop(e, slot)}
                   className={`h-14 flex items-center justify-center p-2 rounded-lg border-2 border-dashed transition-colors ${draggedItem && !showFeedback ? 'hover:bg-gray-700/50' : ''} ${getSlotFeedbackClass(slot)}`}
                >
                    {slot.droppedItem && (
                      <div 
                        draggable={!showFeedback}
                        onDragStart={(e) => onDragStart(e, slot.droppedItem!)}
                        className={`w-full h-full flex items-center justify-center text-center font-medium bg-gray-600 text-white rounded ${!showFeedback ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
                      >
                         <ClickableTruncatedText text={slot.droppedItem.content} maxLength={25} onShowTooltip={onShowTooltip}/>
                      </div>
                    )}
                </div>
             ))}
          </div>
        </div>
        
        {/* Column 3: Draggable Options */}
        <div 
          className="bg-gray-900/50 p-4 rounded-lg space-y-3 h-[calc(8*4.25rem)] overflow-y-auto"
          onDragOver={onDragOver}
          onDrop={onDropBackToOptions}
        >
          {draggableOptions.map((option) => (
            <div
              key={`option-${option.id}`}
              draggable={!showFeedback}
              onDragStart={(e) => onDragStart(e, option)}
              className={`h-14 w-full flex items-center justify-center text-center p-2 font-medium bg-gray-700 text-white rounded transition-colors ${!showFeedback ? 'cursor-grab active:cursor-grabbing hover:bg-gray-600' : 'cursor-default opacity-70'}`}
            >
               <ClickableTruncatedText text={option.content} maxLength={25} onShowTooltip={onShowTooltip}/>
            </div>
          ))}
        </div>
      </div>
    </QuizContainer>
  );
};

export default MatchingQuiz;