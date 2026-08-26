/**
 * E2E тесты для Project Stages API
 * Запускается после применения миграций
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api/settings/project-stages';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testProjectStages() {
  console.log('🧪 Starting Project Stages API E2E tests...\n');

  let createdId = null;

  try {
    // Test 1: Create stage
    console.log('✅ Test 1: Create stage with color and variant');
    const createRes = await axios.post(BASE_URL, {
      name: 'Test Stage',
      color: '#FF5733',
      variant: 'soft',
      order: 999
    });
    createdId = createRes.data.id;
    console.log(`   Created stage: ${JSON.stringify(createRes.data)}\n`);

    if (!createRes.data.color || !createRes.data.variant) {
      throw new Error('Color or variant not returned in create response');
    }

    // Test 2: Get all stages
    console.log('✅ Test 2: Get all stages');
    const getAllRes = await axios.get(BASE_URL);
    console.log(`   Found ${getAllRes.data.items.length} stages`);
    const testStage = getAllRes.data.items.find(s => s.id === createdId);
    if (!testStage) {
      throw new Error('Created stage not found in list');
    }
    console.log(`   Test stage: ${JSON.stringify(testStage)}\n`);

    // Test 3: Update stage
    console.log('✅ Test 3: Update stage');
    const updateRes = await axios.put(`${BASE_URL}/${createdId}`, {
      name: 'Updated Stage Name',
      color: '#33FF57',
      variant: 'outline'
    });
    console.log(`   Updated: ${JSON.stringify(updateRes.data)}\n`);

    if (updateRes.data.name !== 'Updated Stage Name') {
      throw new Error('Name not updated');
    }
    if (updateRes.data.color !== '#33FF57') {
      throw new Error('Color not updated');
    }
    if (updateRes.data.variant !== 'outline') {
      throw new Error('Variant not updated');
    }

    // Test 4: Update only order
    console.log('✅ Test 4: Update order only');
    const orderRes = await axios.put(`${BASE_URL}/${createdId}`, {
      order: 1
    });
    console.log(`   Order updated: ${orderRes.data.displayorder}\n`);

    // Test 5: Reorder stages
    console.log('✅ Test 5: Reorder stages');
    const reorderRes = await axios.put(`${BASE_URL}/reorder`, {
      ids: getAllRes.data.items.map(s => s.id)
    });
    console.log(`   Reorder result: ${JSON.stringify(reorderRes.data)}\n`);

    // Test 6: Try to delete stage used in projects (should fail)
    console.log('✅ Test 6: Try to delete stage (will create new for this test)');
    
    // Create a stage specifically for deletion test
    const deleteTestStage = await axios.post(BASE_URL, {
      name: 'Delete Test Stage',
      color: '#3333FF',
      variant: 'ghost'
    });
    const deleteTestId = deleteTestStage.data.id;
    
    // Try to delete it (should succeed since it's not used)
    console.log(`   Deleting unused stage: ${deleteTestId}`);
    await axios.delete(`${BASE_URL}/${deleteTestId}`);
    console.log('   Successfully deleted unused stage\n');

    // Test 7: Verify deletion
    console.log('✅ Test 7: Verify deletion');
    const afterDeleteRes = await axios.get(BASE_URL);
    const stillExists = afterDeleteRes.data.items.some(s => s.id === deleteTestId);
    if (stillExists) {
      throw new Error('Stage was not deleted');
    }
    console.log('   Deletion verified\n');

    // Cleanup: Delete test stage
    console.log('🧹 Cleaning up test stage...');
    await axios.delete(`${BASE_URL}/${createdId}`);
    console.log('   Cleanup complete\n');

    console.log('✅ All tests passed! 🎉');
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    
    // Cleanup on error
    if (createdId) {
      try {
        await axios.delete(`${BASE_URL}/${createdId}`);
        console.log('   Cleanup attempted');
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    
    process.exit(1);
  }
}

// Run tests
testProjectStages();
