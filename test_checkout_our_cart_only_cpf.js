import fetch from 'node-fetch';

async function test() {
  const apiUrl = 'https://painel.topfotos.com.br/api';
  
  const res = await fetch(`${apiUrl}/order/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cart_id: 'eb698de1-89c8-4217-af28-5d8faec05189',
      total_value: 20,
      customer_document: '99375443353'
    })
  });
  console.log('Status:', res.status);
  console.log('Body:', await res.text());
}
test();
