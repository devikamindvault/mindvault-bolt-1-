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
      console.log('No goals found. Exiting.');
      return;
    }
    
    // For each goal, create activity and tracking data
    for (const goal of goals) {
      const userId = goal.userId || 1;
      console.log(`Creating activity for goal: ${goal.title} (ID: ${goal.id})`);
      
      // 1. Create goal creation activity 
      await db.insert(schema.userActivity).values({
        userId: userId,
        activityType: 'goal_created',
        timestamp: goal.createdAt || new Date(),
        details: {
          goalId: goal.id
        }
      });
      
      // 2. Add some goal updates (between 1-3 updates)
      const updateCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < updateCount; i++) {
        // Updates happened some time after creation
        const creationDate = goal.createdAt || new Date();
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
      
      // 3. Add project tracking data for each day (past 5 days)
      const today = new Date();
      
      for (let i = 0; i < 5; i++) {
        // Create dates from today going back
        const day = new Date();
        day.setDate(today.getDate() - i);
        day.setHours(0, 0, 0, 0); // Start of day
        
        const totalTime = 15 + (Math.floor(Math.random() * 60)); // 15-75 minutes
        const sessionsCount = 1 + (Math.floor(Math.random() * 3)); // 1-3 sessions
        
        console.log(`Adding tracking data for goal ${goal.id} on ${day.toDateString()}`);
        
        await db.insert(schema.projectTracking).values({
          userId: userId,
          goalId: goal.id,
          totalTime: totalTime,
          sessionsCount: sessionsCount,
          dateGrouping: day,
          lastActivity: day
        });
      }
    }
    
    console.log('Analytics data seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding analytics data:', error);
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