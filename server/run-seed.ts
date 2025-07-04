import { db } from './db';
import * as schema from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';

async function seedAnalyticsData() {
  try {
    console.log('Starting analytics data seeding...');
    
    // First, clear existing activity and tracking data to avoid duplicates
    await db.delete(schema.userActivity);
    await db.delete(schema.projectTracking);
    console.log('Cleared existing analytics data');
    
    // Get all goals
    const goals = await db.query.goals.findMany();
    console.log(`Found ${goals.length} goals to process`);
    
    if (goals.length === 0) {
      // Create a few sample goals if none exist
      console.log('No goals found. Creating sample goals...');
      const sampleGoals = [
        { title: 'Complete project proposal', userId: 1, parentId: null, description: 'Finalize the project proposal document', completedAt: null, status: 'in_progress', content: { journals: [] } },
        { title: 'Weekly team meeting notes', userId: 1, parentId: null, description: 'Keep track of team meeting discussions', completedAt: null, status: 'in_progress', content: { journals: [] } },
        { title: 'Learning new framework', userId: 1, parentId: null, description: 'Document learning progress for new technology', completedAt: null, status: 'in_progress', content: { journals: [] } }
      ];
      
      for (const goal of sampleGoals) {
        await db.insert(schema.goals).values(goal);
      }
      
      // Fetch the newly created goals
      const newGoals = await db.query.goals.findMany();
      console.log(`Created ${newGoals.length} sample goals`);
      
      // Use these new goals for seeding analytics
      await seedGoalActivities(newGoals);
    } else {
      // Use existing goals for seeding analytics
      await seedGoalActivities(goals);
    }
    
    console.log('Analytics data seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding analytics data:', error);
  }
}

async function seedGoalActivities(goals: any[]) {
  const userId = 1; // Default user ID
  
  for (const goal of goals) {
    console.log(`Creating activity for goal: ${goal.title} (ID: ${goal.id})`);
    
    // 1. Create goal creation activity 
    await db.insert(schema.userActivity).values({
      userId: userId,
      activityType: 'goal_created',
      timestamp: goal.createdAt || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago if no date
      details: {
        goalId: goal.id
      }
    });
    
    // 2. Add some goal updates (between 1-3 updates)
    const updateCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < updateCount; i++) {
      // Updates happened some time after creation
      const creationDate = goal.createdAt || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const updateDate = new Date(creationDate.getTime() + ((i + 1) * 86400000)); // +1,2,3 days
      
      await db.insert(schema.userActivity).values({
        userId: userId,
        activityType: 'goal_updated',
        timestamp: updateDate,
        details: {
          goalId: goal.id
        }
      });
    }
    
    // 3. Add project tracking data for each day (past 7 days)
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      // Create dates from today going back
      const day = new Date();
      day.setDate(today.getDate() - i);
      day.setHours(0, 0, 0, 0); // Start of day
      
      const totalTime = 15 + (Math.floor(Math.random() * 60)); // 15-75 minutes
      const sessionsCount = 1 + (Math.floor(Math.random() * 3)); // 1-3 sessions
      
      console.log(`Adding tracking data for goal ${goal.id} on ${day.toISOString()}`);
      
      await db.insert(schema.projectTracking).values({
        userId: userId,
        goalId: goal.id,
        dateGrouping: day.toISOString().split('T')[0], // Format as YYYY-MM-DD
        totalTime: totalTime,
        sessionsCount: sessionsCount,
        lastActivity: day
      });
    }
    
    // Add some additional activity types
    const activityTypes = ['transcription', 'speech_transcription', 'document_upload', 'file_upload'];
    
    for (let i = 0; i < 5; i++) {
      const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const day = new Date();
      day.setDate(today.getDate() - Math.floor(Math.random() * 7)); // Random day in the past week
      
      await db.insert(schema.userActivity).values({
        userId: userId,
        activityType: activityType,
        timestamp: day,
        details: {
          goalId: goal.id
        }
      });
    }
  }
}

// Run the seed function
seedAnalyticsData().then(() => {
  console.log('Seeding process complete.');
  process.exit(0);
}).catch(err => {
  console.error('Error in seeding process:', err);
  process.exit(1);
});