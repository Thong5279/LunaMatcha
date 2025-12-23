import { HiCube } from 'react-icons/hi2';
import { HiBeaker } from 'react-icons/hi2';

const EmptyState = ({ icon, title, message, action }) => {
  const IconComponent = icon || HiCube;
  
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <IconComponent className="w-16 h-16 text-gray-400 mb-4" />
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 text-center mb-4">{message}</p>
      {action && action}
    </div>
  );
};

export default EmptyState;

