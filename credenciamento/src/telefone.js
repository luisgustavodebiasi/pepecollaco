const DDDS_VALIDOS = new Set([
  '11','12','13','14','15','16','17','18','19',
  '21','22','24','27','28',
  '31','32','33','34','35','37','38',
  '41','42','43','44','45','46','47','48','49',
  '51','53','54','55',
  '61','62','63','64','65','66','67','68','69',
  '71','73','74','75','77','79',
  '81','82','83','84','85','86','87','88','89',
  '91','92','93','94','95','96','97','98','99',
])

/**
 * Normaliza telefone para o formato numérico brasileiro internacional.
 * Ex: "(48) 99999-9999" → "5548999999999"
 * Retorna null se o número for inválido.
 */
export function normalizarTelefone(raw) {
  if (!raw) return null

  let digits = raw.replace(/\D/g, '')

  if (!digits) return null

  // Remove código de país duplicado (5555...)
  if (digits.startsWith('555') && digits.length > 13) {
    digits = '55' + digits.slice(3)
  }

  if (digits.startsWith('55')) {
    const semPais = digits.slice(2)
    if (semPais.length < 10 || semPais.length > 11) return null
    const ddd = semPais.slice(0, 2)
    if (!DDDS_VALIDOS.has(ddd)) return null
    return digits
  }

  // Sem código de país: verifica se tem DDD válido
  if (digits.length >= 10) {
    const ddd = digits.slice(0, 2)
    if (DDDS_VALIDOS.has(ddd)) return '55' + digits
  }

  return null
}

/**
 * Formata número normalizado para exibição.
 * "5548991208900" → "(48) 99120-8900"
 */
export function formatarTelefone(normalizado) {
  if (!normalizado || normalizado.length < 12) return normalizado
  const sem55 = normalizado.startsWith('55') ? normalizado.slice(2) : normalizado
  const ddd = sem55.slice(0, 2)
  const numero = sem55.slice(2)
  if (numero.length === 9) {
    return `(${ddd}) ${numero.slice(0, 5)}-${numero.slice(5)}`
  }
  return `(${ddd}) ${numero.slice(0, 4)}-${numero.slice(4)}`
}
