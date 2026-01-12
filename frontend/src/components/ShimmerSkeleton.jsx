import './ShimmerSkeleton.css';

const ShimmerSkeleton = ({ type = 'card', count = 1 }) => {
  if (type === 'card') {
    return (
      <>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="shimmer-skeleton shimmer-skeleton-card">
            <div className="shimmer-skeleton-image"></div>
            <div className="shimmer-skeleton-content">
              <div className="shimmer-skeleton-line shimmer-skeleton-line-title"></div>
              <div className="shimmer-skeleton-line shimmer-skeleton-line-subtitle"></div>
            </div>
          </div>
        ))}
      </>
    );
  }

  if (type === 'list') {
    return (
      <div className="shimmer-skeleton-list">
        {Array.from({ length: count || 3 }).map((_, i) => (
          <div key={i} className="shimmer-skeleton shimmer-skeleton-list-item">
            <div className="shimmer-skeleton-line"></div>
            <div className="shimmer-skeleton-line shimmer-skeleton-line-short"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'page') {
    return (
      <div className="shimmer-skeleton-page">
        <div className="shimmer-skeleton-line shimmer-skeleton-line-title"></div>
        <div className="shimmer-skeleton-line"></div>
        <div className="shimmer-skeleton-line shimmer-skeleton-line-short"></div>
        <div className="shimmer-skeleton-line"></div>
        <div className="shimmer-skeleton-line shimmer-skeleton-line-short"></div>
      </div>
    );
  }

  if (type === 'modal') {
    return (
      <div className="shimmer-skeleton-modal">
        <div className="shimmer-skeleton-line shimmer-skeleton-line-title"></div>
        <div className="shimmer-skeleton-line"></div>
        <div className="shimmer-skeleton-line shimmer-skeleton-line-short"></div>
      </div>
    );
  }

  return (
    <div className="shimmer-skeleton shimmer-skeleton-default">
      <div className="shimmer-skeleton-line"></div>
    </div>
  );
};

export default ShimmerSkeleton;

