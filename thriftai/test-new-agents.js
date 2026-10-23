// Test the NEW Multi-Agent Scoring System
const product = {
  name: "iPhone 13 Pro 256GB - Gold",
  price: 472.14,
  brand: "Apple",
  category: "ELECTRONICS",
  condition: "Very Good",
  description: "Apple iPhone 13 Pro in excellent condition, 256GB storage",
  seller: {
    name: "Veritas Marketplace",
    rating: 4.8,
    verified: true
  }
};

fetch('http://localhost:3000/api/agents/score', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ product })
})
.then(r => r.json())
.then(data => {
  console.log('\n🤖 NEW MULTI-AGENT SCORING SYSTEM\n');
  console.log('Product:', product.name);
  console.log('Price: $' + product.price);
  console.log('\n📊 RESULTS:');

  if (data.success) {
    const scoring = data.data.scoring;
    console.log('  Veritas Score:', scoring.veritasScore + '/100');
    console.log('  Confidence:', Math.round(scoring.confidence * 100) + '%');
    console.log('\n  Component Scores (7 Agents):');
    Object.entries(scoring.componentScores).forEach(([agent, score]) => {
      console.log(`    ${agent}: ${score}/100`);
    });
    console.log('\n  Processing Time:', data.data.metadata.processingTime + 'ms');
  } else {
    console.log('  Error:', data.error);
  }
})
.catch(err => console.error('Request failed:', err));
