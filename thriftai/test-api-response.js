const http = require('http');

const postData = JSON.stringify({
  query: 'phone',
  limit: 3
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/buyers/enhanced-search',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('\n📦 Full API Response Structure:');
      console.log('Response keys:', Object.keys(response));
      console.log('Response type:', typeof response);
      console.log('\n📦 API Response Summary:');
      console.log('Total products:', response.products?.length || 0);

      if (response.products && response.products.length > 0) {
        const firstProduct = response.products[0];
        console.log('\n🔍 First Product:');
        console.log('Name:', firstProduct.name);
        console.log('Brand:', firstProduct.brand);
        console.log('Category:', firstProduct.category);
        console.log('\n📋 dynamicSpecs field:');
        console.log('Has dynamicSpecs?', firstProduct.dynamicSpecs ? 'YES' : 'NO');
        if (firstProduct.dynamicSpecs) {
          console.log('dynamicSpecs keys:', Object.keys(firstProduct.dynamicSpecs));
          console.log('dynamicSpecs data:', JSON.stringify(firstProduct.dynamicSpecs, null, 2));
        } else {
          console.log('⚠️ dynamicSpecs is missing or null');
        }

        console.log('\n📄 Full product object keys:');
        console.log(Object.keys(firstProduct));
      }
    } catch (error) {
      console.error('❌ Error parsing response:', error);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.write(postData);
req.end();
