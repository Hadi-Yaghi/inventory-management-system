import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getReviews } from '../api/misc';
import { Star } from 'lucide-react';

const Reviews = () => {
  const { data: reviews, isLoading } = useQuery({ queryKey: ['reviews'], queryFn: getReviews });

  if (isLoading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Product Reviews</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews?.map(review => (
          <div key={review.id} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-medium text-slate-900">{review.product?.name || 'Unknown Product'}</h3>
                <p className="text-sm text-slate-500">{review.customer?.name || 'Anonymous'}</p>
              </div>
              <div className="flex text-yellow-400">
                {[...Array(review.rating)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
            </div>
            <p className="text-slate-700 text-sm">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
export default Reviews;
