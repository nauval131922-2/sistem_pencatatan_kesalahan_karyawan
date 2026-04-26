import { ElementType } from "react";

interface TableTitleProps {
  icon: ElementType;
  title: string;
  iconColor?: string;
}

export default function TableTitle({ 
  icon: Icon, 
  title, 
  iconColor = "text-green-600" 
}: TableTitleProps) {
  return (
    <h3 className="text-[14px] font-extrabold text-gray-800 flex items-center gap-2.5 leading-none">
      <Icon size={18} className={iconColor} />
      <span>{title}</span>
    </h3>
  );
}



