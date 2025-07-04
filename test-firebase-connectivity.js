import fetch from 'node-fetch';

async function testServerStatus() {
  try {
    console.log('Testing server status endpoint...');
    const response = await fetch('http://localhost:5000/api/status');
    
    if (!response.ok) {
      console.error(`❌ Server status check failed with status: ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    console.log('✅ Server status endpoint response:', data);
    
  } catch (error) {
    console.error('❌ Error connecting to server:', error.message);
    return false;
  }
}

  try {
    const testEmail = `test-${Date.now()}@example.com`;
    
    
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Response data:', data);
      return false;
    }
    
      success: data.success,
      userId: data.userId,
      email: data.email
    });
    
    return true;
  } catch (error) {
    return false;
  }
}

// Run tests
async function runTests() {
  
  // Test server status
  const serverRunning = await testServerStatus();
  if (!serverRunning) {
    console.error('⚠️ Server status check failed. Tests aborted.');
    return;
  }
  
  if (!signupWorking) {
  }
  
  console.log('\n==== Test Summary ====');
  console.log(`Server Status: ${serverRunning ? '✅ PASS' : '❌ FAIL'}`);
}

runTests().catch(console.error);