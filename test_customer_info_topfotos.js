import fetch from 'node-fetch';

async function test() {
  const apiUrl = 'https://topfotos.com.br/api';
  const res = await fetch(`${apiUrl}/customer/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_document: '08783533936'
    })
  });
  console.log(await res.text());
}
test();
