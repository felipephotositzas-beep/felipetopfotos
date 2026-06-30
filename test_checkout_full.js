import fetch from 'node-fetch';

async function test() {
  const apiUrl = 'https://painel.topfotos.com.br/api';
  
  // Create cart
  const cartRes = await fetch(`${apiUrl}/cart/ab58f89e-4a6c-48b4-82f4-8c8e14619d9b/add/photo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo_id: 1 }) // just guessing
  });

  const res = await fetch(`${apiUrl}/order/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cart_id: 'ab58f89e-4a6c-48b4-82f4-8c8e14619d9b',
      total_value: 20,
      customer_document: '99375443353',
      customer_name: 'Felipe Test',
      customer_email: 'felipe@test.com',
      customer_phone: '11999999999'
    })
  });
  console.log('Status:', res.status);
  console.log('Body:', await res.text());
}
test();
