'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useSupabaseAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Heart, Star } from 'lucide-react';
import { updateSpaceFollowersCount, updatePostLikesCount, updateSpaceLikesCount, toggleFavorite } from '@/lib/counter-utils';

export default function TestFixes() {
  const { user } = useUser();
  const { getSupabaseWithSession, userId } = useSupabaseAuth();
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; result?: any; error?: string }>>({});

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    try {
      const result = await testFn();
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: true, result }
      }));
    } catch (error: any) {
      console.error(`Error in ${testName}:`, error);
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: false, error: error.message }
      }));
    }
  };

  const testLikeFunction = async () => {
    if (!userId) throw new Error('User not authenticated');
    
    const supabaseClient = await getSupabaseWithSession();
    
    // Try to add a like
    const { error } = await supabaseClient
      .from('post_reactions')
      .insert({
        post_id: 'test-post-id',
        space_id: userId,
        reaction_type: 'like'
      });
      
    if (error) throw error;
    
    // Try to remove the like
    const { error: deleteError } = await supabaseClient
      .from('post_reactions')
      .delete()
      .eq('post_id', 'test-post-id')
      .eq('space_id', userId)
      .eq('reaction_type', 'like');
      
    if (deleteError) throw deleteError;
    
    return 'Like functionality works';
  };

  const testFavoriteFunction = async () => {
    if (!userId) throw new Error('User not authenticated');
    
    // Test toggleFavorite function
    const result = await toggleFavorite(userId, 'test-post-id', 'test-space-id');
    return `Favorite function returned: ${result}`;
  };

  const testCounterUpdates = async () => {
    if (!userId) throw new Error('User not authenticated');
    
    // Test counter update functions
    const results = [];
    
    const spaceFollowers = await updateSpaceFollowersCount('test-space-id', true);
    results.push(`Space followers update: ${spaceFollowers}`);
    
    const postLikes = await updatePostLikesCount('test-post-id', true);
    results.push(`Post likes update: ${postLikes}`);
    
    const spaceLikes = await updateSpaceLikesCount('test-space-id', true);
    results.push(`Space likes update: ${spaceLikes}`);
    
    return results.join(', ');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Fixes</h1>
      
      <div className="space-y-4 mb-8">
        <Button onClick={() => runTest('Like Functionality', testLikeFunction)}>
          <Heart className="h-4 w-4 mr-2" />
          Test Like Functionality
        </Button>
        
        <Button onClick={() => runTest('Favorite Functionality', testFavoriteFunction)}>
          <Star className="h-4 w-4 mr-2" />
          Test Favorite Functionality
        </Button>
        
        <Button onClick={() => runTest('Counter Updates', testCounterUpdates)}>
          Test Counter Updates
        </Button>
      </div>
      
      <div className="border rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">Test Results</h2>
        
        {Object.keys(testResults).length === 0 ? (
          <p className="text-gray-500">Run tests to see results</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(testResults).map(([testName, result]) => (
              <div key={testName} className="border-b pb-4">
                <h3 className="font-medium">{testName}</h3>
                {result.success ? (
                  <p className="text-green-600">Success: {JSON.stringify(result.result)}</p>
                ) : (
                  <p className="text-red-600">Error: {result.error}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}