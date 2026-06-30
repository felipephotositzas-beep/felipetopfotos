import fetch from 'node-fetch';

async function test() {
  const apiUrl = 'https://painel.topfotos.com.br/api';
  
  const res = await fetch(`${apiUrl}/order/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cart_id: 'ffbcb849-1238-4e55-b48f-33abce9b223d',
      total_value: 20,
      customer_document: '99375443353'
    })
  });
  console.log('Status:', res.status);
  console.log('Body:', await res.text());
}
test();
