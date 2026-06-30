import fetch from 'node-fetch';

async function test() {
  const apiUrl = 'https://painel.topfotos.com.br/api';
  const res = await fetch(`${apiUrl}/customer/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_document: '99375443353',
      customer_name: 'Felipe Updated',
      customer_email: 'felipe@updated.com',
      customer_phone: '11999999999'
    })
  });
  console.log(await res.text());
}
test();
