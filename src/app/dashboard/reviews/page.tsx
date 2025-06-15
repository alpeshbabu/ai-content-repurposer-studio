import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ReviewForm } from '@/components/reviews/review-form';
import { UserReviewList } from '@/components/reviews/user-review-list';
import { Star, MessageSquare } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Reviews & Feedback',
  description: 'Share your feedback and view your reviews',
};

export default async function ReviewsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/auth/signin');
  }

  // Get user's review statistics
  const reviewStats = await prisma.review.groupBy({
    by: ['status'],
    where: { userId: session.user.id },
    _count: true
  });

  const totalReviews = await prisma.review.count({
    where: { userId: session.user.id }
  });

  const pendingReviews = reviewStats.find(stat => stat.status === 'pending')?._count || 0;
  const approvedReviews = reviewStats.find(stat => stat.status === 'approved')?._count || 0;

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Star className="h-8 w-8 text-yellow-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold">Reviews & Feedback</h1>
            <p className="text-gray-600">Share your experience and help us improve</p>
          </div>
        </div>
      </div>

      {/* Review Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Reviews</p>
              <p className="text-2xl font-bold text-gray-900">{totalReviews}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <div className="h-4 w-4 bg-yellow-600 rounded-full"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingReviews}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <div className="h-4 w-4 bg-green-600 rounded-full"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{approvedReviews}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Review Submission Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Submit a Review</h2>
        <p className="text-gray-600 mb-6">
          Your feedback helps us improve our service and helps other users make informed decisions.
        </p>
        <ReviewForm onSuccess={() => window.location.reload()} />
      </div>

      {/* User's Reviews */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Your Reviews</h2>
        <UserReviewList />
      </div>
    </div>
  );
} 