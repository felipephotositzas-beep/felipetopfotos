import fetch from 'node-fetch';

async function test() {
  const apiUrl = 'https://painel.topfotos.com.br/api';

  const res = await fetch(`${apiUrl}/customer/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cpf: '99375443353',
      name: 'Felipe Test',
      email: 'felipe@test.com',
      phone: '11999999999'
    })
  });
  console.log('Status:', res.status);
  console.log('Body:', await res.text());
}
test();
