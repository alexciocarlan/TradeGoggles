
/**
 * Extrage un mesaj de eroare citibil din orice tip de input.
 * Garantează returnarea unui string util pentru utilizator, evitând [object Object].
 */
export function getErrorMessage(error: any): string {
  if (error === null || error === undefined) {
    return 'Eroare necunoscută (Null/Undefined)';
  }

  // 1. Gestionare string-uri directe
  if (typeof error === 'string') {
    return error;
  }

  // 2. Gestionare DOMException / SecurityError (ex: "The operation is insecure")
  // Acestea apar deseori în mod Incognito sau iFrame-uri restricționate
  const isSecurityError = 
    error.name === 'SecurityError' || 
    error.code === 18 || 
    (error.message && (
      error.message.toLowerCase().includes('insecure') || 
      error.message.toLowerCase().includes('access denied') ||
      error.message.toLowerCase().includes('not allowed') ||
      error.message.toLowerCase().includes('is insecure')
    ));

  if (isSecurityError) {
    return "ACCES STOCARE REFUZAT: Browserul tău blochează stocarea locală a datelor. Aceasta se întâmplă de obicei în mod Incognito sau din cauza setărilor de confidențialitate stricte. Aplicația va rula fără a salva datele la refresh.";
  }

  // 3. Gestionare instanțe standard de Error
  if (error instanceof Error) {
    return error.message;
  }

  // 4. Gestionare obiecte de eroare complexe
  if (typeof error === 'object') {
    // Verificăm proprietăți comune de mesaje
    const possibleMessage = error.message || error.error || error.reason || error.statusText;
    
    if (possibleMessage) {
      if (typeof possibleMessage === 'string') return possibleMessage;
      if (typeof possibleMessage === 'object') return getErrorMessage(possibleMessage);
    }

    // Dacă este un obiect fără mesaj clar, încercăm serializarea sigură
    try {
      const stringified = JSON.stringify(error);
      if (stringified !== '{}' && stringified !== 'undefined') {
        return `Eroare (detalii): ${stringified}`;
      }
    } catch (e) {
      // Ignorăm erorile de serializare
    }
  }

  // 5. Fallback final - evităm returnarea directă a obiectului pentru a nu scoate [object Object]
  const finalString = String(error);
  if (finalString === '[object Object]') {
    return 'Eroare de sistem: Date de eroare neserializabile detectate.';
  }

  return finalString || 'Eroare de execuție nespecificată';
}
