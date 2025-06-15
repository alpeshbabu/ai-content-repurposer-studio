'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const SAMPLE_CONTENT = `The Benefits of Regular Exercise

Regular physical activity is one of the most important things you can do for your health. Being physically active can improve your brain health, help manage weight, reduce the risk of disease, strengthen bones and muscles, and improve your ability to do everyday activities.

Adults who sit less and do any amount of moderate-to-vigorous physical activity gain some health benefits. Only a few lifestyle choices have as large an impact on your health as physical activity.

Here are some key benefits:
- Improved brain health
- Weight management
- Reduced risk of cardiovascular disease
- Reduced risk of type 2 diabetes
- Strengthened bones and muscles
- Improved ability to do daily activities

The recommended amount is 150 minutes a week of moderate intensity activity such as brisk walking. Even small amounts of physical activity are beneficial, and activity can be accumulated throughout the day.`;

const DEMO_REPURPOSED_CONTENT = [
  {
    platform: 'twitter',
    content: `Regular exercise isn't just good for your body—it's essential for overall health! 💪

Just 150 mins/week of moderate activity can:
• Boost brain health
• Help manage weight
• Reduce disease risk
• Strengthen bones & muscles

The best part? Even small amounts throughout the day make a difference! #HealthTips #Fitness`
  },
  {
    platform: 'linkedin',
    content: `📊 The Science-Backed Benefits of Regular Exercise for Professionals

In our fast-paced professional lives, physical activity often takes a backseat. However, research consistently shows that regular exercise might be the most impactful productivity hack available to us.

Just 150 minutes of moderate activity weekly (that's only 30 minutes, 5 days a week) delivers remarkable benefits:

• Enhanced cognitive function and brain health - improving decision-making and creativity
• Stress reduction and improved mental health - essential for leadership and team collaboration
• Disease prevention - reducing sick days and healthcare costs
• Increased energy levels - maintaining focus throughout demanding workdays

What's most encouraging is that even small amounts of physical activity accumulated throughout your day provide meaningful benefits. A short walk between meetings or taking the stairs can contribute to your weekly goal.

Have you incorporated regular exercise into your professional routine? What changes have you noticed in your performance and wellbeing?

#ProfessionalDevelopment #WorkplaceWellness #ProductivityTips #LeadershipHealth`
  },
  {
    platform: 'instagram',
    content: `✨ MOVEMENT IS MEDICINE ✨

Did you know that regular physical activity is one of the MOST powerful things you can do for your body and mind? 💯

Just a few benefits:
🧠 Improved brain function & mood
⚖️ Healthy weight management
❤️ Stronger heart & lower disease risk
💪 Stronger bones & muscles
🔋 More energy for daily life

The best part? You don't need to become a gym rat to see results! Just 150 minutes of moderate activity each week (like a brisk 30-min walk 5 days a week) can transform your health.

And remember - even small bursts of movement throughout your day ADD UP! 👏

Double tap if you're committed to moving your body this week! 

#MovementIsMedicine #HealthyHabits #WellnessJourney #FitnessMotivation #SelfCare #HealthTips`
  }
];

export default function DemoRepurposer() {
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleClick = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setShowResults(true);
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-semibold mb-2">See it in action</h3>
        <p className="text-gray-600">
          This is what our AI content repurposing tool can do. Try the demo below to see how content is transformed for different platforms.
        </p>
      </div>
      
      <div className="p-6 bg-gray-50">
        <h4 className="font-medium mb-2">Original Content</h4>
        <div className="bg-white border border-gray-200 rounded-md p-4 mb-4 whitespace-pre-wrap">
          {SAMPLE_CONTENT}
        </div>

        <div className="flex justify-center mb-6">
          <button
            onClick={handleClick}
            disabled={isLoading || showResults}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Repurposing...
              </>
            ) : showResults ? (
              'Repurposed!'
            ) : (
              'Repurpose For Different Platforms'
            )}
          </button>
        </div>

        {showResults && (
          <div className="space-y-6">
            <h4 className="font-medium">Repurposed Content</h4>
            
            <div className="grid md:grid-cols-3 gap-4">
              {DEMO_REPURPOSED_CONTENT.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-md bg-white">
                  <div className="border-b border-gray-200 px-4 py-2 bg-gray-50">
                    <h5 className="font-medium capitalize">{item.platform}</h5>
                  </div>
                  <div className="p-4 whitespace-pre-wrap text-sm">
                    {item.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 