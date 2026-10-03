import { useState } from "react";

export const SortableList = ({
  list,
  setList,
}: {
  list: string[];
  setList: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragEnter = (index: number) => {
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (dragIndex === null || dragOverIndex === null) return;

    const listCopy = [...list];
    const draggedItemContent = listCopy[dragIndex];
    listCopy.splice(dragIndex, 1);
    listCopy.splice(dragOverIndex, 0, draggedItemContent);
    setDragIndex(null);
    setDragOverIndex(null);
    setList(listCopy);
  };

  return list.length ? (
    <ul className="w-full col-span-2 border rounded-md p-3 bg-gray-800 flex flex-col gap-3">
      {list.map((item, index) => (
        <li
          key={item}
          className={`
            flex items-center gap-2 
            border rounded-md pl-3
            bg-gray-800 overflow-hidden cursor-grab
            dragged:
            ${index === dragIndex ? "opacity-50" : "opacity-100"}
          `}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragEnter={() => handleDragEnter(index)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => e.preventDefault()}
        >
          <span className="text-gray-400 i-material-symbols-drag-indicator" />
          <span className="flex-1">{item}</span>
          <button
            type="button"
            className="cursor-pointer font-bold p-2 bg-red-600 hover:bg-red-700 bg:text-red-800"
            onClick={() => setList((prev) => prev.filter((_, i) => i !== index))}
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  ) : null;
};
