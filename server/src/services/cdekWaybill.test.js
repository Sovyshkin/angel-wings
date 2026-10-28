import assert from 'node:assert/strict'
import test from 'node:test'
import { createReadyCdekWaybill } from './cdekWaybill.js'

const orderUuid = '12345678-1234-1234-1234-123456789abc'
const printUuid = 'abcdef12-1234-1234-1234-123456789abc'

test('waits for a registered order and a READY print form before reporting success', async () => {
  let orderReads = 0
  let printReads = 0
  let printRequests = 0
  const waits = []
  const client = {
    getOrder: async () => ({ entity: { cdek_number: ++orderReads === 1 ? null : '10341246152' }, requests: [{ state: 'SUCCESSFUL' }] }),
    getPrintForm: async () => { printRequests++; return { entity: { uuid: printUuid }, requests: [{ state: 'ACCEPTED' }] } },
    getPrintFormStatus: async () => ++printReads === 1
      ? { entity: { statuses: [{ code: 'PROCESSING' }] } }
      : { entity: { statuses: [{ code: 'READY' }], url: '/print/orders/file.pdf' } }
  }
  const result = await createReadyCdekWaybill(orderUuid, {
    cdekClient: client,
    waitFor: async duration => { waits.push(duration) },
    orderDelays: [0, 2],
    printDelays: [0, 3]
  })
  assert.equal(result.printUuid, printUuid)
  assert.equal(orderReads, 2)
  assert.equal(printRequests, 1)
  assert.equal(printReads, 2)
  assert.deepEqual(waits, [2, 3])
})

test('does not report an accepted print request as success when CDEK later rejects it', async () => {
  const client = {
    getOrder: async () => ({ entity: { cdek_number: '10341246152' } }),
    getPrintForm: async () => ({ entity: { uuid: printUuid } }),
    getPrintFormStatus: async () => ({
      entity: { statuses: [{ code: 'ACCEPTED' }, { code: 'INVALID' }] },
      requests: [{ state: 'INVALID', errors: [{ code: 'v2_orders_number_is_empty', message: 'Entity is empty. All orders are incorrect' }] }]
    })
  }
  await assert.rejects(
    createReadyCdekWaybill(orderUuid, { cdekClient: client, printDelays: [0] }),
    /All orders are incorrect/
  )
})

test('does not request a print form before the order has a CDEK number', async () => {
  let printRequests = 0
  const client = {
    getOrder: async () => ({ entity: { cdek_number: null } }),
    getPrintForm: async () => { printRequests++ }
  }
  await assert.rejects(
    createReadyCdekWaybill(orderUuid, { cdekClient: client, waitFor: async () => {}, orderDelays: [0, 1] }),
    /ещё обрабатывает заказ/
  )
  assert.equal(printRequests, 0)
})

test('concurrent requests for the same shipment create one print job', async () => {
  let printRequests = 0
  const client = {
    getOrder: async () => ({ entity: { cdek_number: '10341246152' } }),
    getPrintForm: async () => {
      printRequests++
      await new Promise(resolve => setTimeout(resolve, 5))
      return { entity: { uuid: printUuid } }
    },
    getPrintFormStatus: async () => ({ entity: { statuses: [{ code: 'READY' }], url: '/print/orders/file.pdf' } })
  }
  const options = { cdekClient: client, orderDelays: [0], printDelays: [0] }
  const [first, second] = await Promise.all([
    createReadyCdekWaybill(orderUuid, options),
    createReadyCdekWaybill(orderUuid, options)
  ])
  assert.equal(first.printUuid, second.printUuid)
  assert.equal(printRequests, 1)
})

test('a still-processing print job is not submitted twice during polling', async () => {
  let printRequests = 0
  const client = {
    getOrder: async () => ({ entity: { cdek_number: '10341246152' } }),
    getPrintForm: async () => { printRequests++; return { entity: { uuid: printUuid } } },
    getPrintFormStatus: async () => ({ entity: { statuses: [{ code: 'PROCESSING' }] } })
  }
  await assert.rejects(
    createReadyCdekWaybill(orderUuid, { cdekClient: client, waitFor: async () => {}, printDelays: [0, 1, 1] }),
    error => error.status === 503 && error.printUuid === printUuid
  )
  assert.equal(printRequests, 1)
})
