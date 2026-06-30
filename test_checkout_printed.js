import fetch from 'node-fetch';

async function test() {
  const apiUrl = 'https://painel.topfotos.com.br/api';
  
  // Use the user's cart that caused the error!
  const res = await fetch(`${apiUrl}/order/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cart_id: 'eb698de1-89c8-4217-af28-5d8faec05189',
      total_value: 9.20,
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
