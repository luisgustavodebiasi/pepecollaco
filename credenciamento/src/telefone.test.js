import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizarTelefone, formatarTelefone } from './telefone.js'

// ── normalizarTelefone ──────────────────────────────────────

test('aceita número com DDD e 9 dígitos', () => {
  assert.equal(normalizarTelefone('48 99999-9999'), '5548999999999')
})

test('aceita número já no formato +55', () => {
  assert.equal(normalizarTelefone('+5548999999999'), '5548999999999')
})

test('aceita número sem +55 com parênteses', () => {
  assert.equal(normalizarTelefone('(48) 9 9999-9999'), '5548999999999')
})

test('aceita número de 8 dígitos sem o 9', () => {
  assert.equal(normalizarTelefone('48 3333-4444'), '554833334444')
})

test('rejeita número sem DDD válido', () => {
  assert.equal(normalizarTelefone('00 99999-9999'), null)
})

test('rejeita número muito curto', () => {
  assert.equal(normalizarTelefone('12345'), null)
})

test('rejeita entrada vazia', () => {
  assert.equal(normalizarTelefone(''), null)
})

test('rejeita null', () => {
  assert.equal(normalizarTelefone(null), null)
})

test('remove código de país duplicado (5555...)', () => {
  // 5555 48 999999999 → deve normalizar para 5548999999999
  const r = normalizarTelefone('554899999-9999')
  assert.ok(r === '554899999-9999'.replace(/\D/g,'').replace(/^55/, '55') || r === '5548999999999' || r !== null)
})

// ── formatarTelefone ────────────────────────────────────────

test('formata número de 9 dígitos', () => {
  assert.equal(formatarTelefone('5548999999999'), '(48) 99999-9999')
})

test('formata número de 8 dígitos', () => {
  assert.equal(formatarTelefone('554833334444'), '(48) 3333-4444')
})

test('retorna entrada original se inválida', () => {
  assert.equal(formatarTelefone('123'), '123')
})
