import React from "react";

type Item = {
  title: string;
  completed: boolean;
};

interface Props {
  items: Item[];
}

export default function ApplicationTimeline({
  items,
}: Props) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div
          key={index}
          className="flex items-center gap-3"
        >
          <div
            className={`h-4 w-4 rounded-full ${
              item.completed
                ? "bg-green-500"
                : "bg-gray-300"
            }`}
          />

          <p className="text-sm font-medium">
            {item.title}
          </p>
        </div>
      ))}
    </div>
  );
}
