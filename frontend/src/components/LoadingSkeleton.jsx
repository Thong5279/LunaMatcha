import ShimmerSkeleton from './ShimmerSkeleton';

const LoadingSkeleton = ({ type = 'card', count }) => {
  // Sử dụng ShimmerSkeleton cho các types được support
  if (type === 'card' || type === 'list' || type === 'page' || type === 'modal') {
    return <ShimmerSkeleton type={type} count={count} />;
  }

  // Fallback cho các types khác
  return (
    <div className="flex justify-center items-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
    </div>
  );
};

export default LoadingSkeleton;






