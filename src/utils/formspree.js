export const FORMSPREE_ENDPOINT = 'https://formspree.io/f/FORM_ID_HERE';

export async function submitForm(formData) {
  const response = await fetch(FORMSPREE_ENDPOINT, {
    method: 'POST',
    body: formData,
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error('Form submission failed');
  return response.json();
}
