import fetch from 'node-fetch';
import { readFile } from 'fs/promises';


async function testConnectivity() {
  console.log('Testing connectivity to major services...');
  
  try {
    console.log('\nTesting Google.com...');
    const googleResponse = await fetch('https://google.com');
    console.log('Google.com status:', googleResponse.status);
  } catch (error) {
    console.error('Google.com error:', error.message);
  }
  
  try {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    
    // If we get a 400 status, that's good - it means we can reach the API
    }
    
  } catch (error) {
  }
  
  try {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    
    // If we get a 400 status, that's good - it means we can reach the API
    }
    
  } catch (error) {
  }
}

testConnectivity();