import fetch from 'node-fetch';
import { randomUUID } from 'crypto';

async function test() {
  const apiUrl = 'https://painel.topfotos.com.br/api';
  const cartId = randomUUID();
  
  // Need a photo. Let's just fetch some photos.
  const photosRes = await fetch(`${apiUrl}/photo/list/1`); // Try event 1
  // let's just ignore the photo, the backend returned "Carrinho não encontrado".
  
  // Wait, if it returned "Carrinho não encontrado", it means it reached the serializer validation!
  // If `customer_name` was missing and REQUIRED, it would return `{"customer_name":["This field is required."]}`.
  // BUT it returned `{"non_field_errors":["Carrinho não encontrado"]}`.
  // This means `customer_name` IS NOT REQUIRED for validation!
  console.log("If customer_name was required, we would get a field error, not non_field_errors.");
}
test();
